"use server";

import { auth } from "@/auth";
import { registrarApuesta } from "@/lib/apuestas";
import { type Actor } from "@/lib/authz";
import {
  registrarDepositoACasino,
  registrarGastoOperativo,
  registrarPrestamoEntreCuentas,
  registrarRetiroDeCasino,
} from "@/lib/movimientos";
import { prisma } from "@/lib/prisma";
import { calcularSaldoCasino, calcularSaldoCuenta, perfilesConDisponibilidad } from "@/lib/saldos";

async function actorOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  return { rol: session.user.rol, letra: session.user.letra };
}

function letraWhere(actor: Actor, letra?: string) {
  if (actor.rol === "OPERADOR") return actor.letra!;
  return letra;
}

/** Paso 1: buscar casinos activos por perfil (para elegir dónde depositar/retirar/apostar). */
export async function buscarCasinosPorPerfil(perfil: string) {
  const actor = await actorOrThrow();
  if (!perfil.trim()) return [];

  const casinos = await prisma.casino.findMany({
    where: {
      perfil: { contains: perfil.trim(), mode: "insensitive" },
      statusCasino: "ACTIVO",
      letra: letraWhere(actor),
    },
    include: { cobraEn: { select: { id: true, banco: true, letra: true, perfil: true } } },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    take: 20,
  });

  return Promise.all(
    casinos.map(async (c) => ({
      id: c.id,
      letra: c.letra,
      perfil: c.perfil,
      nombreCasino: c.nombreCasino,
      usuario: c.usuario,
      contrasena: c.contrasena,
      cobraEn: c.cobraEn,
      saldo: (await calcularSaldoCasino(c.id)).toNumber(),
    })),
  );
}

/** Buscar cuentas bancarias activas por perfil (para depósito/retiro/préstamo). */
export async function buscarCuentasPorPerfil(perfil: string) {
  const actor = await actorOrThrow();
  if (!perfil.trim()) return [];

  const cuentas = await prisma.cuenta.findMany({
    where: {
      perfil: { contains: perfil.trim(), mode: "insensitive" },
      status: "ACTIVA",
      letra: letraWhere(actor),
    },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    take: 20,
  });

  return Promise.all(
    cuentas.map(async (c) => {
      const [saldo, pendientes] = await Promise.all([
        calcularSaldoCuenta(c.id),
        prisma.movimiento.count({ where: { cuentaId: c.id, estado: "PENDIENTE" } }),
      ]);
      return {
        id: c.id,
        letra: c.letra,
        perfil: c.perfil,
        banco: c.banco,
        clabe: c.clabe,
        usuario: c.usuario,
        contrasena: c.contrasena,
        token: c.token,
        nip: c.nip,
        saldo: saldo.toNumber(),
        pendientes,
      };
    }),
  );
}

export async function widgetDisponibilidad() {
  const actor = await actorOrThrow();
  return (await perfilesConDisponibilidad(10000, actor.rol === "OPERADOR" ? { letra: actor.letra! } : undefined)).map(
    (p) => ({ ...p, total: p.total.toNumber() }),
  );
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function accionRegistrarApuesta(input: {
  casinoId: string;
  letra: string;
  perfil: string;
  evento: string;
  mercado: "LOCAL" | "EMPATE" | "VISITANTE";
  descripcion?: string;
  momio: number;
  saldoReal: number;
  bono: number;
}): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await registrarApuesta(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionRegistrarMovimientoBancario(input: {
  tipo: "DEPOSITO_A_CASINO" | "RETIRO_DE_CASINO";
  cuentaId: string;
  casinoId: string;
  monto: number;
  concepto?: string;
  estado: "CONFIRMADO" | "PENDIENTE" | "CANCELADO";
}): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    const registrar = input.tipo === "DEPOSITO_A_CASINO" ? registrarDepositoACasino : registrarRetiroDeCasino;
    await registrar(actor, {
      cuentaId: input.cuentaId,
      casinoId: input.casinoId,
      monto: input.monto,
      concepto: input.concepto,
      estado: input.estado,
      registradoPor: actor.rol === "ADMIN" ? "admin" : `operador.${actor.letra}`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionRegistrarPrestamo(input: {
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  monto: number;
  concepto?: string;
  estado: "CONFIRMADO" | "PENDIENTE" | "CANCELADO";
}): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await registrarPrestamoEntreCuentas(actor, {
      ...input,
      registradoPor: actor.rol === "ADMIN" ? "admin" : `operador.${actor.letra}`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionRegistrarGastoOperativo(input: {
  cuentaId: string;
  monto: number;
  concepto?: string;
  estado: "CONFIRMADO" | "PENDIENTE" | "CANCELADO";
}): Promise<ActionResult> {
  try {
    const actor = await actorOrThrow();
    await registrarGastoOperativo(actor, {
      ...input,
      registradoPor: actor.rol === "ADMIN" ? "admin" : `operador.${actor.letra}`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
