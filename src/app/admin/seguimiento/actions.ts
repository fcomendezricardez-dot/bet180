"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import {
  buscarCasinosSimple,
  buscarCuentasSimple,
  crearSeguimiento,
  listSeguimientos,
  actualizarSeguimiento,
} from "@/lib/seguimiento";
import { buscarClientes } from "@/lib/clientes";
import { listUsuariosActivos } from "@/lib/usuarios";

async function gestionOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const actor = { rol: session.user.rol, letra: session.user.letra };
  if (actor.rol !== "ADMIN" && actor.rol !== "GESTOR") throw new ForbiddenError();
  return actor;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export type SeguimientoInput = {
  titulo: string;
  tipo: string;
  prioridad: "BAJA" | "MEDIA" | "ALTA";
  clienteId?: string;
  responsableId?: string;
  fechaEntrega?: string;
  casinoInvolucradoId?: string;
  bancoInvolucradoId?: string;
  cantidadInvolucrada?: number;
  notas?: string;
};

export async function accionListSeguimientos() {
  const actor = await gestionOrThrow();
  const filas = await listSeguimientos(actor);
  return filas.map((f) => ({
    id: f.id,
    titulo: f.titulo,
    tipo: f.tipo,
    prioridad: f.prioridad,
    estado: f.estado,
    fechaEntrega: f.fechaEntrega?.toISOString() ?? null,
    cliente: f.cliente?.nombreCompleto ?? null,
    responsable: f.responsable?.nombre ?? null,
    casino: f.casinoInvolucrado ? `${f.casinoInvolucrado.nombreCasino} (${f.casinoInvolucrado.perfil})` : null,
    banco: f.bancoInvolucrado ? `${f.bancoInvolucrado.banco} (${f.bancoInvolucrado.perfil})` : null,
    cantidadInvolucrada: f.cantidadInvolucrada ? f.cantidadInvolucrada.toNumber() : null,
    notas: f.notas,
  }));
}

export async function accionCrearSeguimiento(input: SeguimientoInput): Promise<ActionResult> {
  try {
    const actor = await gestionOrThrow();
    await crearSeguimiento(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionActualizarSeguimiento(
  id: number,
  input: Partial<SeguimientoInput> & { estado?: "PENDIENTE" | "COMPLETADO" },
): Promise<ActionResult> {
  try {
    const actor = await gestionOrThrow();
    await actualizarSeguimiento(actor, id, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionBuscarClientesSeguimiento(query: string) {
  const actor = await gestionOrThrow();
  return buscarClientes(actor, query);
}

export async function accionBuscarCasinosSeguimiento(query: string) {
  const actor = await gestionOrThrow();
  return buscarCasinosSimple(actor, query);
}

export async function accionBuscarCuentasSeguimiento(query: string) {
  const actor = await gestionOrThrow();
  return buscarCuentasSimple(actor, query);
}

export async function accionListUsuariosActivos() {
  const actor = await gestionOrThrow();
  return listUsuariosActivos(actor);
}
