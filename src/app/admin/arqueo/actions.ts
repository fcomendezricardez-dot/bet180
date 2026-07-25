"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import { arqueoCliente, buscarClientes } from "@/lib/clientes";

async function adminOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const actor = { rol: session.user.rol, letra: session.user.letra };
  if (actor.rol !== "ADMIN") throw new ForbiddenError();
  return actor;
}

export async function accionBuscarClientes(query: string) {
  const actor = await adminOrThrow();
  return buscarClientes(actor, query);
}

export async function accionArqueoCliente(clienteId: string) {
  const actor = await adminOrThrow();
  return arqueoCliente(actor, clienteId);
}
