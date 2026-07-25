"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import { bonosDisponibles, registrarReclamoBono } from "@/lib/bonos";

async function adminOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const actor = { rol: session.user.rol, letra: session.user.letra };
  if (actor.rol !== "ADMIN") throw new ForbiddenError();
  return actor;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function accionBonosDisponibles() {
  const actor = await adminOrThrow();
  return bonosDisponibles(actor);
}

export async function accionRegistrarReclamoBono(reglaId: number, monto: number): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await registrarReclamoBono(actor, { reglaId, monto });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
