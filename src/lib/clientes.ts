import { z } from "zod";
import { type Actor, assertAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { calcularSaldoCasino, calcularSaldoCuenta } from "@/lib/saldos";

/**
 * Arqueo: para cada banco del cliente, su historial de movimientos con saldo
 * corriente (solo los CONFIRMADO afectan el saldo; pendiente/cancelado se
 * muestran pero no cuentan). Solo ADMIN.
 */
export async function arqueoCliente(actor: Actor, clienteId: string) {
  assertAdmin(actor);

  const cliente = await prisma.cliente.findUniqueOrThrow({
    where: { id: clienteId },
    include: { cuentas: true },
  });

  const bancos = await Promise.all(
    cliente.cuentas.map(async (cuenta) => {
      const movimientos = await prisma.movimiento.findMany({
        where: {
          OR: [{ cuentaId: cuenta.id }, { casinoUOrigen: cuenta.id, tipo: "RETIRO" }],
        },
        orderBy: { fecha: "asc" },
      });

      let saldo = cuenta.saldoInicial;
      const historial = movimientos.map((m) => {
        const esEntradaPrestamo = m.cuentaId !== cuenta.id && m.casinoUOrigen === cuenta.id;
        if (m.estado === "CONFIRMADO") {
          saldo = esEntradaPrestamo || m.tipo === "DEPOSITO" ? saldo.plus(m.monto) : saldo.minus(m.monto);
        }
        return {
          id: m.id,
          fecha: m.fecha,
          tipoMovimiento: m.tipoMovimiento,
          tipo: m.tipo,
          monto: m.monto.toNumber(),
          estado: m.estado,
          concepto: m.concepto,
          saldoDespues: saldo.toNumber(),
        };
      });

      return {
        id: cuenta.id,
        banco: cuenta.banco,
        letra: cuenta.letra,
        perfil: cuenta.perfil,
        saldoInicial: cuenta.saldoInicial.toNumber(),
        saldoActual: (await calcularSaldoCuenta(cuenta.id)).toNumber(),
        movimientos: historial,
      };
    }),
  );

  return { cliente: { id: cliente.id, nombreCompleto: cliente.nombreCompleto }, bancos };
}

/** Busca clientes por nombre o ID (catálogo completo, solo ADMIN). */
export async function buscarClientes(actor: Actor, query: string) {
  assertAdmin(actor);
  if (!query.trim()) return [];

  return prisma.cliente.findMany({
    where: {
      OR: [
        { nombreCompleto: { contains: query.trim(), mode: "insensitive" } },
        { id: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    select: { id: true, nombreCompleto: true, status: true, equipo: true },
    orderBy: { nombreCompleto: "asc" },
    take: 20,
  });
}

/** Ficha completa de un cliente: datos personales + sus cuentas y casinos. */
export async function obtenerFichaCliente(actor: Actor, id: string) {
  assertAdmin(actor);

  const cliente = await prisma.cliente.findUniqueOrThrow({
    where: { id },
    include: { cuentas: true },
  });

  const letraPerfil =
    parsearEquipo(cliente.equipo) ??
    (cliente.cuentas[0] ? { letra: cliente.cuentas[0].letra, perfil: cliente.cuentas[0].perfil } : null);

  const casinos = letraPerfil
    ? await prisma.casino.findMany({
        where: { letra: letraPerfil.letra, perfil: letraPerfil.perfil },
        orderBy: { nombreCasino: "asc" },
      })
    : [];

  const cuentasConSaldo = await Promise.all(
    cliente.cuentas.map(async (c) => ({ ...c, saldo: await calcularSaldoCuenta(c.id) })),
  );
  const casinosConSaldo = await Promise.all(
    casinos.map(async (c) => ({ ...c, saldo: await calcularSaldoCasino(c.id) })),
  );

  return { cliente, cuentas: cuentasConSaldo, casinos: casinosConSaldo };
}

export function parsearEquipo(equipo: string | null): { letra: string; perfil: string } | null {
  if (!equipo) return null;
  const partes = equipo.split("-");
  if (partes.length !== 2) return null;
  return { letra: partes[0].toUpperCase(), perfil: partes[1] };
}

/**
 * Busca clientes por nombre o ID y resuelve en qué letra.perfil está jugando
 * cada uno ahora mismo (vía `equipo`, o si no está definido, vía su cuenta
 * vinculada). Disponible para ADMIN y OPERADOR (el operador solo ve los de su
 * propia letra) — a diferencia de buscarClientes, que es la ficha completa y
 * es solo ADMIN.
 */
export async function buscarClientesOperativo(actor: Actor, query: string) {
  if (!query.trim()) return [];

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { nombreCompleto: { contains: query.trim(), mode: "insensitive" } },
        { id: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      nombreCompleto: true,
      status: true,
      equipo: true,
      cuentas: { select: { letra: true, perfil: true }, take: 1 },
    },
    orderBy: { nombreCompleto: "asc" },
    take: 20,
  });

  return clientes
    .map((c) => {
      const letraPerfil = parsearEquipo(c.equipo) ?? (c.cuentas[0] ?? null);
      return {
        id: c.id,
        nombreCompleto: c.nombreCompleto,
        status: c.status,
        letra: letraPerfil?.letra ?? null,
        perfil: letraPerfil?.perfil ?? null,
      };
    })
    .filter((c) => actor.rol === "ADMIN" || c.letra === actor.letra);
}

/** Ficha de un cliente para editar sus datos (sin cuentas/casinos). Solo ADMIN. */
export async function getClienteParaEditar(actor: Actor, id: string) {
  assertAdmin(actor);
  return prisma.cliente.findUniqueOrThrow({ where: { id } });
}

async function siguienteIdCliente() {
  const ultimo = await prisma.cliente.findFirst({
    select: { id: true },
    orderBy: { id: "desc" },
  });
  const n = ultimo ? parseInt(ultimo.id.replace(/^CL/i, ""), 10) || 0 : 0;
  return `CL${String(n + 1).padStart(4, "0")}`;
}

const ClienteSchema = z.object({
  status: z.string().optional(),
  nombreCompleto: z.string().min(1),
  direccionIne: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.string().optional(),
  cp: z.string().optional(),
  curp: z.string().optional(),
  rfc: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  expIne: z.number().int().optional(),
  idmx: z.string().optional(),
  noIne: z.string().optional(),
  telefono: z.string().optional(),
  whatsapp: z.string().optional(),
  nombreReferencia: z.string().optional(),
  noReferencia: z.string().optional(),
  ingresoPor: z.string().optional(),
  /// letra-perfil, ej "a-101": conecta al cliente con sus casinos (por letra+perfil) y sirve de referencia visual del equipo
  equipo: z.string().optional(),
  opera: z.string().optional(),
  correoOperativo: z.string().optional(),
  contrasenaOperativa: z.string().optional(),
  noLinea: z.string().optional(),
  telefonia: z.string().optional(),
  validacion: z.string().optional(),
  ultRecarga: z.string().optional(),
  apertura: z.string().optional(),
  fechaRegistro: z.string().optional(),
  nota: z.string().optional(),
});

function fechasADate<T extends { fechaNacimiento?: string; ultRecarga?: string; fechaRegistro?: string }>(
  data: T,
) {
  return {
    ...data,
    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined,
    ultRecarga: data.ultRecarga ? new Date(data.ultRecarga) : undefined,
    fechaRegistro: data.fechaRegistro ? new Date(data.fechaRegistro) : undefined,
  };
}

/** Alta de un cliente nuevo: genera el ID CLxxxx automáticamente. Solo ADMIN. */
export async function crearCliente(actor: Actor, input: z.infer<typeof ClienteSchema>) {
  assertAdmin(actor);
  const data = ClienteSchema.parse(input);
  const id = await siguienteIdCliente();
  return prisma.cliente.create({ data: { id, ...fechasADate(data) } });
}

const ActualizarClienteSchema = ClienteSchema.partial();

/** Editar un cliente existente. Solo ADMIN. */
export async function actualizarCliente(
  actor: Actor,
  id: string,
  input: z.infer<typeof ActualizarClienteSchema>,
) {
  assertAdmin(actor);
  const data = ActualizarClienteSchema.parse(input);
  return prisma.cliente.update({ where: { id }, data: fechasADate(data) });
}
