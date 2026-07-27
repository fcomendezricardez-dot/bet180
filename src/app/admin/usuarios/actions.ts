"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import { actualizarUsuario, crearUsuario, getUsuario, listUsuarios } from "@/lib/usuarios";

async function adminOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const actor = { rol: session.user.rol, letra: session.user.letra };
  if (actor.rol !== "ADMIN") throw new ForbiddenError();
  return actor;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export type UsuarioInput = {
  email: string;
  password: string;
  nombre: string;
  rol: "ADMIN" | "OPERADOR";
  letra?: string;
  activo: boolean;
};

export async function accionListUsuarios() {
  const actor = await adminOrThrow();
  return listUsuarios(actor);
}

export async function accionObtenerUsuario(id: string) {
  const actor = await adminOrThrow();
  return getUsuario(actor, id);
}

export async function accionCrearUsuario(input: UsuarioInput): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await crearUsuario(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionActualizarUsuario(
  id: string,
  input: Partial<UsuarioInput>,
): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await actualizarUsuario(actor, id, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
