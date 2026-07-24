"use server";

import { auth } from "@/auth";
import { type Actor } from "@/lib/authz";
import { actualizarCuenta } from "@/lib/cuentas";

async function actorOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  return { rol: session.user.rol, letra: session.user.letra };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function accionActualizarStatus(
  cuentaId: string,
  status: "POR_VERIFICAR" | "ACTIVA" | "BLOQUEADA" | "BAJA" | "SIN_ACCESO",
  tipoCuenta: "BASICA" | "SIN_LIMITE" | "MEJORADA" | null,
): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await actualizarCuenta(actor, cuentaId, { status, tipoCuenta });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
