"use server";

import { auth } from "@/auth";
import { type Actor } from "@/lib/authz";
import {
  bonosDisponibles,
  marcarRolloverLiberado,
  reclamosConRolloverPendiente,
  registrarReclamoBono,
} from "@/lib/bonos";

async function actorOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  return { rol: session.user.rol, letra: session.user.letra };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function accionBonosDisponibles() {
  const actor = await actorOrThrow();
  return bonosDisponibles(actor);
}

export async function accionRegistrarReclamoBono(reglaId: number, monto: number): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await registrarReclamoBono(actor, { reglaId, monto });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionReclamosConRolloverPendiente() {
  const actor = await actorOrThrow();
  return reclamosConRolloverPendiente(actor);
}

export async function accionMarcarRolloverLiberado(reclamoId: number, liberado: boolean): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await marcarRolloverLiberado(actor, reclamoId, liberado);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
