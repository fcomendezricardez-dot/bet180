import { z } from "zod";
import { type Actor, assertGestion } from "@/lib/authz";
import { parsearEquipo } from "@/lib/clientes";
import { prisma } from "@/lib/prisma";

function etiquetaActor(actor: Actor) {
  if (actor.rol === "ADMIN") return "admin";
  if (actor.rol === "GESTOR") return "gestor";
  return `operador.${actor.letra}`;
}

const SeguimientoSchema = z.object({
  titulo: z.string().min(1),
  tipo: z.string().min(1),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA"]).default("MEDIA"),
  clienteId: z.string().optional(),
  operadorId: z.string().optional(),
  responsableId: z.string().optional(),
  fechaEntrega: z.string().optional(),
  casinoInvolucradoId: z.string().optional(),
  bancoInvolucradoId: z.string().optional(),
  cantidadInvolucrada: z.number().optional(),
  notas: z.string().optional(),
});

/** Crea un registro de Seguimiento (incidencia/trámite de un cliente). ADMIN o GESTOR. */
export async function crearSeguimiento(actor: Actor, input: z.infer<typeof SeguimientoSchema>) {
  assertGestion(actor);
  const { fechaEntrega, ...data } = SeguimientoSchema.parse(input);
  return prisma.seguimiento.create({
    data: {
      ...data,
      fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined,
      creadoPor: etiquetaActor(actor),
    },
  });
}

const ActualizarSeguimientoSchema = SeguimientoSchema.partial().extend({
  estado: z.enum(["PENDIENTE", "COMPLETADO"]).optional(),
});

/** Edita un Seguimiento existente, incluyendo su estado. ADMIN o GESTOR. */
export async function actualizarSeguimiento(
  actor: Actor,
  id: number,
  input: z.infer<typeof ActualizarSeguimientoSchema>,
) {
  assertGestion(actor);
  const { fechaEntrega, ...data } = ActualizarSeguimientoSchema.parse(input);
  return prisma.seguimiento.update({
    where: { id },
    data: { ...data, fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined },
  });
}

/** Lista todos los Seguimientos, con datos resueltos de cliente/operador/responsable/casino/banco. ADMIN o GESTOR. */
export async function listSeguimientos(actor: Actor) {
  assertGestion(actor);
  return prisma.seguimiento.findMany({
    include: {
      cliente: { select: { id: true, nombreCompleto: true } },
      operador: { select: { id: true, nombre: true, letra: true } },
      responsable: { select: { id: true, nombre: true } },
      casinoInvolucrado: { select: { id: true, nombreCasino: true, perfil: true } },
      bancoInvolucrado: { select: { id: true, banco: true, perfil: true } },
      _count: { select: { avances: true } },
    },
    orderBy: [{ estado: "asc" }, { fechaEntrega: "asc" }, { createdAt: "desc" }],
  });
}

/** Casinos y cuentas bancarias que un cliente ya tiene (para elegir "involucrado" sin buscar en todo el catálogo). ADMIN o GESTOR. */
export async function casinosYCuentasDeCliente(actor: Actor, clienteId: string) {
  assertGestion(actor);
  const cliente = await prisma.cliente.findUniqueOrThrow({
    where: { id: clienteId },
    include: { cuentas: { select: { id: true, banco: true, letra: true, perfil: true } } },
  });

  const letraPerfil =
    parsearEquipo(cliente.equipo) ??
    (cliente.cuentas[0] ? { letra: cliente.cuentas[0].letra, perfil: cliente.cuentas[0].perfil } : null);

  const casinos = letraPerfil
    ? await prisma.casino.findMany({
        where: { letra: letraPerfil.letra, perfil: letraPerfil.perfil },
        select: { id: true, nombreCasino: true, letra: true, perfil: true },
        orderBy: { nombreCasino: "asc" },
      })
    : [];

  return { cuentas: cliente.cuentas, casinos };
}

/** Historial de avance de un Seguimiento (notas con fecha), más reciente primero. ADMIN o GESTOR. */
export async function listAvances(actor: Actor, seguimientoId: number) {
  assertGestion(actor);
  return prisma.seguimientoAvance.findMany({
    where: { seguimientoId },
    orderBy: { fecha: "desc" },
  });
}

/** Agrega una nota de avance a un Seguimiento. ADMIN o GESTOR. */
export async function agregarAvance(actor: Actor, seguimientoId: number, descripcion: string) {
  assertGestion(actor);
  if (!descripcion.trim()) throw new Error("La descripción del avance no puede estar vacía.");
  return prisma.seguimientoAvance.create({
    data: { seguimientoId, descripcion: descripcion.trim(), registradoPor: etiquetaActor(actor) },
  });
}
