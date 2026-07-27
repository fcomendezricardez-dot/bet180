import { type Actor, assertGestion } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export type ItemAgenda = {
  tipo: "SEGUIMIENTO" | "APERTURA";
  id: number;
  fecha: Date;
  titulo: string;
  cliente: string | null;
  responsable: string | null;
  prioridad: "BAJA" | "MEDIA" | "ALTA" | null;
};

/** Junta, ordenados por fecha, los Seguimientos con fecha de entrega y las Aperturas agendadas. ADMIN o GESTOR. */
export async function agendaCombinada(actor: Actor): Promise<ItemAgenda[]> {
  assertGestion(actor);

  const [seguimientos, aperturas] = await Promise.all([
    prisma.seguimiento.findMany({
      where: { estado: "PENDIENTE", fechaEntrega: { not: null } },
      include: {
        cliente: { select: { nombreCompleto: true } },
        responsable: { select: { nombre: true } },
      },
    }),
    prisma.apertura.findMany({
      where: { estado: "AGENDADA" },
      include: {
        cliente: { select: { nombreCompleto: true } },
        responsable: { select: { nombre: true } },
      },
    }),
  ]);

  const items: ItemAgenda[] = [
    ...seguimientos.map((s) => ({
      tipo: "SEGUIMIENTO" as const,
      id: s.id,
      fecha: s.fechaEntrega!,
      titulo: `${s.titulo} (${s.tipo})`,
      cliente: s.cliente?.nombreCompleto ?? null,
      responsable: s.responsable?.nombre ?? null,
      prioridad: s.prioridad,
    })),
    ...aperturas.map((a) => ({
      tipo: "APERTURA" as const,
      id: a.id,
      fecha: a.fechaCita,
      titulo: `Apertura: ${a.nombreCliente} — ${a.bancoOCasino}`,
      cliente: a.cliente?.nombreCompleto ?? a.nombreCliente,
      responsable: a.responsable?.nombre ?? null,
      prioridad: null,
    })),
  ];

  return items.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}
