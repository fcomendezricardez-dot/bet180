import { z } from "zod";
import { type Actor, assertLetraAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const RegistrarApuestaSchema = z.object({
  casinoId: z.string().min(1),
  letra: z.string().min(1),
  perfil: z.string().min(1),
  noApuesta: z.string().optional(),
  evento: z.string().min(1),
  mercado: z.enum(["LOCAL", "EMPATE", "VISITANTE"]),
  descripcion: z.string().optional(),
  momio: z.number().positive(),
  saldoReal: z.number().nonnegative(),
  bono: z.number().nonnegative().default(0),
});

/**
 * Registrar una apuesta: resta saldo_real + bono del saldo del casino
 * (implícito vía la fórmula de saldo, ver src/lib/saldos.ts) y queda "En juego".
 */
export async function registrarApuesta(actor: Actor, input: z.infer<typeof RegistrarApuestaSchema>) {
  const data = RegistrarApuestaSchema.parse(input);
  assertLetraAccess(actor, data.letra);

  const posibleGanancia = data.momio * (data.saldoReal + data.bono);

  return prisma.apuesta.create({
    data: {
      casinoId: data.casinoId,
      letra: data.letra,
      perfil: data.perfil,
      noApuesta: data.noApuesta,
      evento: data.evento,
      mercado: data.mercado,
      descripcion: data.descripcion,
      momio: data.momio,
      saldoReal: data.saldoReal,
      bono: data.bono,
      posibleGanancia,
      statusApuesta: "EN_JUEGO",
    },
  });
}

/**
 * Cerrar una apuesta como Perdida: solo se actualiza el status. El dinero ya
 * estaba restado del saldo del casino, no se toca nada más.
 */
export async function cerrarApuestaPerdida(actor: Actor, apuestaId: number) {
  const apuesta = await prisma.apuesta.findUniqueOrThrow({ where: { id: apuestaId } });
  assertLetraAccess(actor, apuesta.letra);
  if (apuesta.statusApuesta !== "EN_JUEGO") {
    throw new Error("Solo se pueden cerrar apuestas que están En juego.");
  }

  return prisma.apuesta.update({
    where: { id: apuestaId },
    data: { statusApuesta: "PERDIDA" },
  });
}

/**
 * Cerrar una apuesta como Ganada: se actualiza el status Y se crea un registro
 * nuevo con el monto de resultado_ganancia, que suma al saldo del casino.
 * Nunca se edita el monto original de la apuesta.
 */
export async function cerrarApuestaGanada(actor: Actor, apuestaId: number, resultadoGanancia: number) {
  if (resultadoGanancia <= 0) {
    throw new Error("El monto de ganancia debe ser positivo.");
  }

  const apuesta = await prisma.apuesta.findUniqueOrThrow({ where: { id: apuestaId } });
  assertLetraAccess(actor, apuesta.letra);
  if (apuesta.statusApuesta !== "EN_JUEGO") {
    throw new Error("Solo se pueden cerrar apuestas que están En juego.");
  }

  const [, ganancia] = await prisma.$transaction([
    prisma.apuesta.update({
      where: { id: apuestaId },
      data: { statusApuesta: "GANADA" },
    }),
    prisma.apuesta.create({
      data: {
        casinoId: apuesta.casinoId,
        letra: apuesta.letra,
        perfil: apuesta.perfil,
        evento: apuesta.evento,
        mercado: apuesta.mercado,
        momio: apuesta.momio,
        descripcion: `Ganancia de apuesta #${apuesta.id}`,
        saldoReal: 0,
        bono: 0,
        posibleGanancia: resultadoGanancia,
        statusApuesta: "GANADA",
        resultadoGanancia,
        apuestaRelacionadaId: apuesta.id,
      },
    }),
  ]);

  return ganancia;
}

/**
 * Lista apuestas visibles para el actor: ADMIN ve todas las letras (o filtra
 * por una si se indica), OPERADOR solo ve las de su propia letra.
 */
export async function listApuestas(actor: Actor, opts?: { letra?: string; statusApuesta?: "EN_JUEGO" | "GANADA" | "PERDIDA" }) {
  const letra = actor.rol === "OPERADOR" ? actor.letra! : opts?.letra;

  return prisma.apuesta.findMany({
    where: { letra, statusApuesta: opts?.statusApuesta },
    include: { casino: { select: { nombreCasino: true, letra: true, perfil: true } } },
    orderBy: { fecha: "desc" },
  });
}
