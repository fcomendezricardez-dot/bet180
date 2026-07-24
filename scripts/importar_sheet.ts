/**
 * Importa el JSON producido por scripts/extraer_sheet.py (Cuentas y Casinos
 * de una letra) a la base de datos, vía upsert (no borra ni pisa datos de
 * otras letras, y puede volver a correrse sin duplicar).
 *
 * Uso:
 *   npx tsx scripts/importar_sheet.ts <archivo.json>
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

type CuentaRow = {
  id: string;
  status: "POR_VERIFICAR" | "ACTIVA" | "BLOQUEADA" | "BAJA" | "SIN_ACCESO";
  tipoCuenta: "BASICA" | "SIN_LIMITE" | "MEJORADA" | null;
  letra: string;
  perfil: string;
  banco: string;
  clabe: string | null;
  usuario: string | null;
  contrasena: string | null;
  nuevaContrasena: string | null;
  token: string | null;
  nip: string | null;
  nCuenta: string | null;
  nCliente: string | null;
  nombrePerfil: string | null;
  saldoInicial: number;
  nTarjeta: string | null;
  exp: string | null;
  cvv: string | null;
  observaciones: string | null;
  prestadaA: string | null;
  idCliente: string | null;
  nombreCliente: string | null;
  clienteActivo: boolean;
};

type CasinoRow = {
  id: string;
  noCasino: number;
  nombreCasino: string;
  letra: string;
  perfil: string;
  saldoInicial: number;
  statusCasino: "ACTIVO" | "BLOQUEADO" | "ALERTA";
  statusPerfil: "VERIFICADO" | "EN_PROCESO" | "SIN_VERIFICACION";
  usuario: string | null;
  contrasena: string | null;
  nota: string | null;
  cobraEnId: string | null;
};

async function main() {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error("Uso: npx tsx scripts/importar_sheet.ts <archivo.json>");
    process.exit(1);
  }

  const { cuentas, casinos } = JSON.parse(readFileSync(archivo, "utf-8")) as {
    cuentas: CuentaRow[];
    casinos: CasinoRow[];
  };

  let cuentasCreadas = 0;
  let cuentasActualizadas = 0;
  for (const c of cuentas) {
    const { id, ...data } = c;
    const existente = await prisma.cuenta.findUnique({ where: { id } });
    await prisma.cuenta.upsert({ where: { id }, create: { id, ...data }, update: data });
    if (existente) cuentasActualizadas++;
    else cuentasCreadas++;
  }
  console.log(`Cuentas: ${cuentasCreadas} creadas, ${cuentasActualizadas} actualizadas.`);

  let casinosCreados = 0;
  let casinosActualizados = 0;
  for (const c of casinos) {
    const { id, ...data } = c;
    const existente = await prisma.casino.findUnique({ where: { id } });
    await prisma.casino.upsert({ where: { id }, create: { id, ...data }, update: data });
    if (existente) casinosActualizados++;
    else casinosCreados++;
  }
  console.log(`Casinos: ${casinosCreados} creados, ${casinosActualizados} actualizados.`);

  const sinTipo = cuentas.filter((c) => c.tipoCuenta === null).length;
  if (sinTipo > 0) {
    console.log(`Aviso: ${sinTipo} cuenta(s) quedaron con tipo_cuenta pendiente de definir.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
