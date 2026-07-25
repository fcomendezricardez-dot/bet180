import { z } from "zod";
import { type Actor, assertAdmin, assertLetraAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

/**
 * Lista casinos visibles para el actor: ADMIN ve todas las letras (o filtra
 * por una si se indica), OPERADOR solo ve los de su propia letra.
 */
export async function listCasinos(actor: Actor, opts?: { letra?: string }) {
  const letra = actor.rol === "OPERADOR" ? actor.letra! : opts?.letra;
  return prisma.casino.findMany({
    where: { letra },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
  });
}

export async function getCasino(actor: Actor, id: string) {
  const casino = await prisma.casino.findUniqueOrThrow({ where: { id } });
  assertLetraAccess(actor, casino.letra);
  return casino;
}

const CrearCasinoSchema = z.object({
  id: z.string().min(1),
  noCasino: z.number().int().positive(),
  nombreCasino: z.string().min(1),
  letra: z.string().min(1),
  perfil: z.string().min(1),
  saldoInicial: z.number().default(0),
  statusPerfil: z.enum(["VERIFICADO", "EN_PROCESO", "SIN_VERIFICACION"]).default("SIN_VERIFICACION"),
  usuario: z.string().optional(),
  contrasena: z.string().optional(),
  requiereMismoCliente: z.boolean().optional(),
  cobraEnId: z.string().optional(),
  nota: z.string().optional(),
});

/** Alta de casino nuevo (solo ADMIN, cualquier letra). */
export async function crearCasino(actor: Actor, input: z.infer<typeof CrearCasinoSchema>) {
  assertAdmin(actor);
  const data = CrearCasinoSchema.parse(input);
  return prisma.casino.create({ data: { ...data, statusCasino: "ACTIVO" } });
}

const ActualizarCasinoSchema = CrearCasinoSchema.omit({ id: true })
  .partial()
  .extend({
    statusCasino: z.enum(["ACTIVO", "BLOQUEADO", "ALERTA"]).optional(),
  });

/** Editar casino existente, incluyendo status (solo ADMIN, cualquier letra). */
export async function actualizarCasino(
  actor: Actor,
  id: string,
  input: z.infer<typeof ActualizarCasinoSchema>,
) {
  assertAdmin(actor);
  const data = ActualizarCasinoSchema.parse(input);
  return prisma.casino.update({ where: { id }, data });
}
