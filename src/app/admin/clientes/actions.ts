"use server";

import { auth } from "@/auth";
import { type Actor } from "@/lib/authz";
import { buscarClientes, obtenerFichaCliente } from "@/lib/clientes";

async function actorOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  return { rol: session.user.rol, letra: session.user.letra };
}

export async function accionBuscarClientes(query: string) {
  const actor = await actorOrThrow();
  return buscarClientes(actor, query);
}

export async function accionObtenerFicha(id: string) {
  const actor = await actorOrThrow();
  const { cliente, cuentas, casinos } = await obtenerFichaCliente(actor, id);

  return {
    cliente: {
      ...cliente,
      fechaNacimiento: cliente.fechaNacimiento?.toISOString() ?? null,
      ultRecarga: cliente.ultRecarga?.toISOString() ?? null,
      fechaRegistro: cliente.fechaRegistro?.toISOString() ?? null,
    },
    cuentas: cuentas.map((c) => ({
      id: c.id,
      banco: c.banco,
      status: c.status,
      clabe: c.clabe,
      usuario: c.usuario,
      contrasena: c.contrasena,
      nTarjeta: c.nTarjeta,
      exp: c.exp,
      cvv: c.cvv,
      nip: c.nip,
      ubicacionCustodia: c.ubicacionCustodia,
      saldo: c.saldo.toNumber(),
    })),
    casinos: casinos.map((c) => ({
      id: c.id,
      nombreCasino: c.nombreCasino,
      statusCasino: c.statusCasino,
      usuario: c.usuario,
      contrasena: c.contrasena,
      saldo: c.saldo.toNumber(),
    })),
  };
}
