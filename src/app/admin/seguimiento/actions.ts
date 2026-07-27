"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import {
  agregarAvance,
  casinosYCuentasDeCliente,
  crearSeguimiento,
  listAvances,
  listSeguimientos,
  actualizarSeguimiento,
} from "@/lib/seguimiento";
import { buscarClientes } from "@/lib/clientes";
import { listOperadoresActivos, listUsuariosActivos } from "@/lib/usuarios";

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
  operadorId?: string;
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
    operador: f.operador ? `${f.operador.nombre} (${f.operador.letra})` : null,
    responsable: f.responsable?.nombre ?? null,
    casino: f.casinoInvolucrado ? `${f.casinoInvolucrado.nombreCasino} (${f.casinoInvolucrado.perfil})` : null,
    banco: f.bancoInvolucrado ? `${f.bancoInvolucrado.banco} (${f.bancoInvolucrado.perfil})` : null,
    cantidadInvolucrada: f.cantidadInvolucrada ? f.cantidadInvolucrada.toNumber() : null,
    notas: f.notas,
    numAvances: f._count.avances,
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

export async function accionCasinosYCuentasDeCliente(clienteId: string) {
  const actor = await gestionOrThrow();
  return casinosYCuentasDeCliente(actor, clienteId);
}

export async function accionListUsuariosActivos() {
  const actor = await gestionOrThrow();
  return listUsuariosActivos(actor);
}

export async function accionListOperadoresActivos() {
  const actor = await gestionOrThrow();
  return listOperadoresActivos(actor);
}

export async function accionListAvances(seguimientoId: number) {
  const actor = await gestionOrThrow();
  return listAvances(actor, seguimientoId);
}

export async function accionAgregarAvance(seguimientoId: number, descripcion: string): Promise<ActionResult> {
  try {
    const actor = await gestionOrThrow();
    await agregarAvance(actor, seguimientoId, descripcion);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
