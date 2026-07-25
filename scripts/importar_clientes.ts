/**
 * Importa el JSON producido por scripts/extraer_clientes.py al catálogo de
 * Clientes, vía upsert (no duplica si se corre de nuevo).
 *
 * Uso:
 *   npx tsx scripts/importar_clientes.ts <archivo.json>
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

type ClienteRow = {
  id: string;
  status: string | null;
  nombreCompleto: string;
  direccionIne: string | null;
  ciudad: string | null;
  estado: string | null;
  cp: string | null;
  curp: string | null;
  rfc: string | null;
  fechaNacimiento: string | null;
  expIne: number | null;
  idmx: string | null;
  noIne: string | null;
  telefono: string | null;
  whatsapp: string | null;
  nombreReferencia: string | null;
  noReferencia: string | null;
  ingresoPor: string | null;
  equipo: string | null;
  opera: string | null;
  correoOperativo: string | null;
  contrasenaOperativa: string | null;
  noLinea: string | null;
  telefonia: string | null;
  validacion: string | null;
  ultRecarga: string | null;
  apertura: string | null;
  fechaRegistro: string | null;
  nota: string | null;
};

function aFecha(v: string | null): Date | undefined {
  return v ? new Date(v) : undefined;
}

async function main() {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error("Uso: npx tsx scripts/importar_clientes.ts <archivo.json>");
    process.exit(1);
  }

  const clientes = JSON.parse(readFileSync(archivo, "utf-8")) as ClienteRow[];

  let creados = 0;
  let actualizados = 0;
  for (const c of clientes) {
    const { id, fechaNacimiento, ultRecarga, fechaRegistro, ...resto } = c;
    const data = {
      ...resto,
      fechaNacimiento: aFecha(fechaNacimiento),
      ultRecarga: aFecha(ultRecarga),
      fechaRegistro: aFecha(fechaRegistro),
    };
    const existente = await prisma.cliente.findUnique({ where: { id } });
    await prisma.cliente.upsert({ where: { id }, create: { id, ...data }, update: data });
    if (existente) actualizados++;
    else creados++;
  }

  console.log(`Clientes: ${creados} creados, ${actualizados} actualizados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
