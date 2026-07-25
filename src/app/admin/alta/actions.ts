"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import {
  crearReglaBono,
  actualizarReglaBono,
  eliminarReglaBono,
  listReglasBonoPorCasino,
} from "@/lib/bonos";
import { crearCasino, actualizarCasino, getCasino } from "@/lib/casinos";
import { crearCuenta, actualizarCuenta, getCuenta } from "@/lib/cuentas";
import { buscarClientes, crearCliente, actualizarCliente, getClienteParaEditar } from "@/lib/clientes";
import { prisma } from "@/lib/prisma";

async function adminOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const actor = { rol: session.user.rol, letra: session.user.letra };
  if (actor.rol !== "ADMIN") throw new ForbiddenError();
  return actor;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

// ---------- Cuentas ----------

export type CuentaInput = {
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
  idCliente?: string;
  nombreCliente?: string;
  clienteActivo?: boolean;
};

export async function accionCrearCuenta(input: CuentaInput): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await crearCuenta(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionActualizarCuenta(
  id: string,
  input: Partial<CuentaInput> & { status?: "POR_VERIFICAR" | "ACTIVA" | "BLOQUEADA" | "BAJA" | "SIN_ACCESO" },
): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await actualizarCuenta(actor, id, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionBuscarCuentas(query: string) {
  await adminOrThrow();
  if (!query.trim()) return [];
  return prisma.cuenta.findMany({
    where: {
      OR: [
        { id: { contains: query.trim(), mode: "insensitive" } },
        { banco: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    select: { id: true, banco: true, letra: true, perfil: true, status: true },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    take: 20,
  });
}

export async function accionObtenerCuenta(id: string) {
  const actor = await adminOrThrow();
  const cuenta = await getCuenta(actor, id);
  return { ...cuenta, saldoInicial: cuenta.saldoInicial.toNumber() };
}

// ---------- Casinos ----------

export type CasinoInput = {
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
};

export async function accionCrearCasino(input: CasinoInput): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await crearCasino(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionActualizarCasino(
  id: string,
  input: Partial<CasinoInput> & { statusCasino?: "ACTIVO" | "BLOQUEADO" | "ALERTA" },
): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await actualizarCasino(actor, id, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionBuscarCasinos(query: string) {
  await adminOrThrow();
  if (!query.trim()) return [];
  return prisma.casino.findMany({
    where: {
      OR: [
        { id: { contains: query.trim(), mode: "insensitive" } },
        { nombreCasino: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    select: { id: true, nombreCasino: true, letra: true, perfil: true, statusCasino: true },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    take: 20,
  });
}

export async function accionObtenerCasino(id: string) {
  const actor = await adminOrThrow();
  const casino = await getCasino(actor, id);
  return { ...casino, saldoInicial: casino.saldoInicial.toNumber() };
}

export async function buscarCuentasParaCobraEn(letra: string) {
  await adminOrThrow();
  if (!letra.trim()) return [];
  return prisma.cuenta.findMany({
    where: { letra: letra.trim() },
    select: { id: true, banco: true, perfil: true },
    orderBy: { perfil: "asc" },
  });
}

// ---------- Clientes ----------

export type ClienteInput = {
  status?: string;
  nombreCompleto: string;
  direccionIne?: string;
  ciudad?: string;
  estado?: string;
  cp?: string;
  curp?: string;
  rfc?: string;
  fechaNacimiento?: string;
  expIne?: number;
  idmx?: string;
  noIne?: string;
  telefono?: string;
  whatsapp?: string;
  nombreReferencia?: string;
  noReferencia?: string;
  ingresoPor?: string;
  equipo?: string;
  opera?: string;
  correoOperativo?: string;
  contrasenaOperativa?: string;
  noLinea?: string;
  telefonia?: string;
  validacion?: string;
  ultRecarga?: string;
  apertura?: string;
  fechaRegistro?: string;
  nota?: string;
};

export async function accionCrearCliente(input: ClienteInput): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await crearCliente(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionActualizarCliente(id: string, input: Partial<ClienteInput>): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await actualizarCliente(actor, id, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionBuscarClientes(query: string) {
  const actor = await adminOrThrow();
  return buscarClientes(actor, query);
}

export async function accionObtenerCliente(id: string) {
  const actor = await adminOrThrow();
  return getClienteParaEditar(actor, id);
}

// ---------- Bonos ----------

export type ReglaBonoInput = {
  casinoId: string;
  nombre: string;
  tipo: "DEPOSITO_MES" | "CADA_N_DIAS" | "BIENVENIDA";
  diaCorteMes?: number;
  cadaDias?: number;
  momioMinimo?: number;
  montoMinimo?: number;
  activo: boolean;
  notas?: string;
  tiers: { depositoMin: number; depositoMax?: number; bonoMonto: number }[];
};

export async function accionListReglasBono(casinoId: string) {
  const actor = await adminOrThrow();
  const reglas = await listReglasBonoPorCasino(actor, casinoId);
  return reglas.map((r) => ({
    ...r,
    momioMinimo: r.momioMinimo ? r.momioMinimo.toNumber() : null,
    montoMinimo: r.montoMinimo ? r.montoMinimo.toNumber() : null,
    tiers: r.tiers.map((t) => ({
      id: t.id,
      depositoMin: t.depositoMin.toNumber(),
      depositoMax: t.depositoMax ? t.depositoMax.toNumber() : null,
      bonoMonto: t.bonoMonto.toNumber(),
    })),
  }));
}

export async function accionCrearReglaBono(input: ReglaBonoInput): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await crearReglaBono(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionActualizarReglaBono(id: number, input: Partial<ReglaBonoInput>): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await actualizarReglaBono(actor, id, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionEliminarReglaBono(id: number): Promise<ActionResult> {
  try {
    const actor = await adminOrThrow();
    await eliminarReglaBono(actor, id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
