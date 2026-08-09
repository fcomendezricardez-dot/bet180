"use server";

import { auth } from "@/auth";
import { type Actor, ForbiddenError } from "@/lib/authz";
import { importarLetraA } from "@/lib/importarLetraA";

async function adminOrThrow(): Promise<Actor> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const actor = { rol: session.user.rol, letra: session.user.letra };
  if (actor.rol !== "ADMIN") throw new ForbiddenError();
  return actor;
}

export type ResultadoImportacion =
  | {
      ok: true;
      casinos: { creados: number; actualizados: number; omitidos: number };
      bancos: { creados: number; actualizados: number; omitidos: number; clientesVinculados: number };
    }
  | { ok: false; error: string };

export async function accionImportarLetraA(formData: FormData): Promise<ResultadoImportacion> {
  try {
    const actor = await adminOrThrow();
    const archivo = formData.get("archivo");
    if (!(archivo instanceof File) || archivo.size === 0) {
      return { ok: false, error: "Selecciona un archivo Excel." };
    }
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const resultado = await importarLetraA(actor, buffer);
    return { ok: true, ...resultado };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
