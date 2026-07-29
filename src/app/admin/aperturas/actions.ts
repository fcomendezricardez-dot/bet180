"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import { crearApertura, listAperturas, actualizarApertura } from "@/lib/aperturas";
import { buscarClientes, previsualizarSiguienteIdCliente } from "@/lib/clientes";
import { listUsuariosActivos } from "@/lib/usuarios";

async function gestionOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const actor = { rol: session.user.rol, letra: session.user.letra };
  if (actor.rol !== "ADMIN" && actor.rol !== "GESTOR") throw new ForbiddenError();
  return actor;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export type AperturaInput = {
  nombreCliente: string;
  telefono?: string;
  equipo?: string;
  referidoPor?: string;
  clienteId?: string;
  bancoOCasino: string;
  fechaCita: string;
  responsableId?: string;
  notas?: string;
};

export async function accionListAperturas() {
  const actor = await gestionOrThrow();
  const filas = await listAperturas(actor);
  return filas.map((f) => ({
    id: f.id,
    nombreCliente: f.nombreCliente,
    telefono: f.telefono,
    equipo: f.equipo,
    referidoPor: f.referidoPor,
    bancoOCasino: f.bancoOCasino,
    fechaCita: f.fechaCita.toISOString(),
    estado: f.estado,
    notas: f.notas,
    cliente: f.cliente?.nombreCompleto ?? null,
    responsable: f.responsable?.nombre ?? null,
  }));
}

export async function accionPrevisualizarSiguienteIdCliente() {
  const actor = await gestionOrThrow();
  return previsualizarSiguienteIdCliente(actor);
}

export async function accionCrearApertura(input: AperturaInput): Promise<ActionResult> {
  try {
    const actor = await gestionOrThrow();
    await crearApertura(actor, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionActualizarApertura(
  id: number,
  input: Partial<AperturaInput> & { estado?: "AGENDADA" | "REALIZADA" | "CANCELADA" },
): Promise<ActionResult> {
  try {
    const actor = await gestionOrThrow();
    await actualizarApertura(actor, id, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function accionBuscarClientesApertura(query: string) {
  const actor = await gestionOrThrow();
  return buscarClientes(actor, query);
}

export async function accionListUsuariosActivosApertura() {
  const actor = await gestionOrThrow();
  return listUsuariosActivos(actor);
}
