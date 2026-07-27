import bcrypt from "bcryptjs";
import { z } from "zod";
import { type Actor, assertAdmin, assertGestion } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function listUsuarios(actor: Actor) {
  assertAdmin(actor);
  return prisma.usuario.findMany({
    orderBy: [{ rol: "asc" }, { letra: "asc" }, { nombre: "asc" }],
    select: { id: true, email: true, nombre: true, rol: true, letra: true, activo: true },
  });
}

/** Lista de usuarios activos para asignar como responsable en Seguimiento/Aperturas. ADMIN o GESTOR. */
export async function listUsuariosActivos(actor: Actor) {
  assertGestion(actor);
  return prisma.usuario.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
}

/** Lista de operadores activos, para el campo "Operador" (quien reporta) en Seguimiento. ADMIN o GESTOR. */
export async function listOperadoresActivos(actor: Actor) {
  assertGestion(actor);
  return prisma.usuario.findMany({
    where: { activo: true, rol: "OPERADOR" },
    orderBy: [{ letra: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, letra: true },
  });
}

export async function getUsuario(actor: Actor, id: string) {
  assertAdmin(actor);
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id },
    select: { id: true, email: true, nombre: true, rol: true, letra: true, activo: true },
  });
  return usuario;
}

const CrearUsuarioSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    nombre: z.string().min(1),
    rol: z.enum(["ADMIN", "OPERADOR", "GESTOR"]),
    letra: z.string().min(1).optional(),
    activo: z.boolean().default(true),
  })
  .refine((data) => data.rol !== "OPERADOR" || !!data.letra, {
    message: "La letra es obligatoria para operadores.",
    path: ["letra"],
  });

export async function crearUsuario(actor: Actor, input: z.infer<typeof CrearUsuarioSchema>) {
  assertAdmin(actor);
  const data = CrearUsuarioSchema.parse(input);
  const password = await bcrypt.hash(data.password, 10);
  return prisma.usuario.create({
    data: {
      email: data.email,
      password,
      nombre: data.nombre,
      rol: data.rol,
      letra: data.rol === "OPERADOR" ? data.letra! : null,
      activo: data.activo,
    },
  });
}

const ActualizarUsuarioSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    nombre: z.string().min(1).optional(),
    rol: z.enum(["ADMIN", "OPERADOR", "GESTOR"]).optional(),
    letra: z.string().min(1).optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => data.rol !== "OPERADOR" || !!data.letra, {
    message: "La letra es obligatoria para operadores.",
    path: ["letra"],
  });

export async function actualizarUsuario(
  actor: Actor,
  id: string,
  input: z.infer<typeof ActualizarUsuarioSchema>,
) {
  assertAdmin(actor);
  const data = ActualizarUsuarioSchema.parse(input);
  const { password, ...resto } = data;
  return prisma.usuario.update({
    where: { id },
    data: {
      ...resto,
      letra: resto.rol === "OPERADOR" ? resto.letra : resto.rol ? null : resto.letra,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  });
}
