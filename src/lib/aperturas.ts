import { z } from "zod";
import { type Actor, assertGestion } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const AperturaSchema = z.object({
  nombreCliente: z.string().min(1),
  telefono: z.string().optional(),
  equipo: z.string().optional(),
  referidoPor: z.string().optional(),
  clienteId: z.string().optional(),
  bancoOCasino: z.string().min(1),
  fechaCita: z.string().min(1),
  responsableId: z.string().optional(),
  notas: z.string().optional(),
});

/** Agenda una nueva apertura de cuenta (cliente nuevo o existente). ADMIN o GESTOR. */
export async function crearApertura(actor: Actor, input: z.infer<typeof AperturaSchema>) {
  assertGestion(actor);
  const { fechaCita, ...data } = AperturaSchema.parse(input);
  return prisma.apertura.create({ data: { ...data, fechaCita: new Date(fechaCita) } });
}

const ActualizarAperturaSchema = AperturaSchema.partial().extend({
  estado: z.enum(["AGENDADA", "REALIZADA", "CANCELADA"]).optional(),
});

/** Edita una apertura agendada, incluyendo su estado. ADMIN o GESTOR. */
export async function actualizarApertura(
  actor: Actor,
  id: number,
  input: z.infer<typeof ActualizarAperturaSchema>,
) {
  assertGestion(actor);
  const { fechaCita, ...data } = ActualizarAperturaSchema.parse(input);
  return prisma.apertura.update({
    where: { id },
    data: { ...data, fechaCita: fechaCita ? new Date(fechaCita) : undefined },
  });
}

/** Lista todas las aperturas agendadas, con cliente/responsable resueltos. ADMIN o GESTOR. */
export async function listAperturas(actor: Actor) {
  assertGestion(actor);
  return prisma.apertura.findMany({
    include: {
      cliente: { select: { id: true, nombreCompleto: true } },
      responsable: { select: { id: true, nombre: true } },
    },
    orderBy: [{ estado: "asc" }, { fechaCita: "asc" }],
  });
}
