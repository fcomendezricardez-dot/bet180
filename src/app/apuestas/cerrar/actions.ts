"use server";

import { auth } from "@/auth";
import { cerrarApuestaGanada, cerrarApuestaPerdida } from "@/lib/apuestas";
import { type Actor } from "@/lib/authz";

async function actorOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  return { rol: session.user.rol, letra: session.user.letra };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function accionCerrarPerdida(apuestaId: number): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await cerrarApuestaPerdida(actor, apuestaId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionCerrarGanada(apuestaId: number, resultadoGanancia: number): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await cerrarApuestaGanada(actor, apuestaId, resultadoGanancia);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
