"use server";

import { auth } from "@/auth";
import { crearCasino } from "@/lib/casinos";
import { type Actor } from "@/lib/authz";
import { crearCuenta } from "@/lib/cuentas";
import { prisma } from "@/lib/prisma";

async function actorOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  return { rol: session.user.rol, letra: session.user.letra };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function accionCrearCuenta(input: {
  id: string;
  tipoCuenta?: "BASICA" | "SIN_LIMITE" | "MEJORADA";
  letra: string;
  perfil: string;
  banco: string;
  saldoInicial: number;
  clabe?: string;
  usuario?: string;
  contrasena?: string;
  token?: string;
  nip?: string;
  nCuenta?: string;
  nCliente?: string;
  nombrePerfil?: string;
  nTarjeta?: string;
  exp?: string;
  cvv?: string;
  ubicacionCustodia?: string;
  observaciones?: string;
}): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await crearCuenta(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionCrearCasino(input: {
  id: string;
  noCasino: number;
  nombreCasino: string;
  letra: string;
  perfil: string;
  saldoInicial: number;
  statusPerfil: "VERIFICADO" | "EN_PROCESO" | "SIN_VERIFICACION";
  usuario?: string;
  contrasena?: string;
  cobraEnId?: string;
  nota?: string;
}): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await crearCasino(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function buscarCuentasParaCobraEn(letra: string) {
  await actorOrThrow();
  if (!letra.trim()) return [];
  return prisma.cuenta.findMany({
    where: { letra: letra.trim() },
    select: { id: true, banco: true, perfil: true },
    orderBy: { perfil: "asc" },
  });
}
