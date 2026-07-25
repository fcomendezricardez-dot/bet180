import { type Actor, assertAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { calcularSaldoCasino, calcularSaldoCuenta } from "@/lib/saldos";

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

function parsearEquipo(equipo: string | null): { letra: string; perfil: string } | null {
  if (!equipo) return null;
  const partes = equipo.split("-");
  if (partes.length !== 2) return null;
  return { letra: partes[0].toUpperCase(), perfil: partes[1] };
}
