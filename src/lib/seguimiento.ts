import { z } from "zod";
import { type Actor, assertGestion } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

function etiquetaCreador(actor: Actor) {
  if (actor.rol === "ADMIN") return "admin";
  if (actor.rol === "GESTOR") return "gestor";
  return `operador.${actor.letra}`;
}

const SeguimientoSchema = z.object({
  titulo: z.string().min(1),
  tipo: z.string().min(1),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA"]).default("MEDIA"),
  clienteId: z.string().optional(),
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
      creadoPor: etiquetaCreador(actor),
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

/** Lista todos los Seguimientos, con datos resueltos de cliente/responsable/casino/banco. ADMIN o GESTOR. */
export async function listSeguimientos(actor: Actor) {
  assertGestion(actor);
  return prisma.seguimiento.findMany({
    include: {
      cliente: { select: { id: true, nombreCompleto: true } },
      responsable: { select: { id: true, nombre: true } },
      casinoInvolucrado: { select: { id: true, nombreCasino: true, perfil: true } },
      bancoInvolucrado: { select: { id: true, banco: true, perfil: true } },
    },
    orderBy: [{ estado: "asc" }, { fechaEntrega: "asc" }, { createdAt: "desc" }],
  });
}

/** Búsqueda simple de casinos (para el campo "Casino involucrado"). ADMIN o GESTOR. */
export async function buscarCasinosSimple(actor: Actor, query: string) {
  assertGestion(actor);
  if (!query.trim()) return [];
  return prisma.casino.findMany({
    where: {
      OR: [
        { nombreCasino: { contains: query.trim(), mode: "insensitive" } },
        { id: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    select: { id: true, nombreCasino: true, letra: true, perfil: true },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    take: 20,
  });
}

/** Búsqueda simple de cuentas bancarias (para el campo "Banco involucrado"). ADMIN o GESTOR. */
export async function buscarCuentasSimple(actor: Actor, query: string) {
  assertGestion(actor);
  if (!query.trim()) return [];
  return prisma.cuenta.findMany({
    where: {
      OR: [
        { banco: { contains: query.trim(), mode: "insensitive" } },
        { id: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    select: { id: true, banco: true, letra: true, perfil: true },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    take: 20,
  });
}
