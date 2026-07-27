import { z } from "zod";
import { type Actor, assertGestion, assertLetraAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

/**
 * Lista cuentas visibles para el actor: ADMIN ve todas las letras (o filtra
 * por una si se indica), OPERADOR solo ve las de su propia letra.
 */
export async function listCuentas(actor: Actor, opts?: { letra?: string }) {
  const letra = actor.rol === "OPERADOR" ? actor.letra! : opts?.letra;
  return prisma.cuenta.findMany({
    where: { letra },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
  });
}

export async function getCuenta(actor: Actor, id: string) {
  const cuenta = await prisma.cuenta.findUniqueOrThrow({ where: { id } });
  assertLetraAccess(actor, cuenta.letra);
  return cuenta;
}

const CrearCuentaSchema = z.object({
  id: z.string().min(1),
  tipoCuenta: z.enum(["BASICA", "SIN_LIMITE", "MEJORADA"]).nullable().optional(),
  letra: z.string().min(1),
  perfil: z.string().min(1),
  banco: z.string().min(1),
  saldoInicial: z.number().default(0),
  clabe: z.string().optional(),
  usuario: z.string().optional(),
  contrasena: z.string().optional(),
  token: z.string().optional(),
  nip: z.string().optional(),
  nCuenta: z.string().optional(),
  nCliente: z.string().optional(),
  nombrePerfil: z.string().optional(),
  nTarjeta: z.string().optional(),
  exp: z.string().optional(),
  cvv: z.string().optional(),
  ubicacionCustodia: z.string().optional(),
  observaciones: z.string().optional(),
  idCliente: z.string().optional(),
  nombreCliente: z.string().optional(),
  clienteActivo: z.boolean().optional(),
});

/** Alta de cuenta nueva (ADMIN o GESTOR, cualquier letra). */
export async function crearCuenta(actor: Actor, input: z.infer<typeof CrearCuentaSchema>) {
  assertGestion(actor);
  const data = CrearCuentaSchema.parse(input);
  return prisma.cuenta.create({ data: { ...data, status: "POR_VERIFICAR" } });
}

const ActualizarCuentaSchema = CrearCuentaSchema.omit({ id: true })
  .partial()
  .extend({
    status: z.enum(["POR_VERIFICAR", "ACTIVA", "BLOQUEADA", "BAJA", "SIN_ACCESO"]).optional(),
  });

/** Editar cuenta existente, incluyendo status/tipo (ADMIN o GESTOR, cualquier letra). */
export async function actualizarCuenta(
  actor: Actor,
  id: string,
  input: z.infer<typeof ActualizarCuentaSchema>,
) {
  assertGestion(actor);
  const data = ActualizarCuentaSchema.parse(input);
  return prisma.cuenta.update({ where: { id }, data });
}
