/**
 * Importa el JSON producido por scripts/extraer_letra_a.py a Casino y
 * Cuenta, vía upsert conservador: en registros nuevos usa saldo y estatus
 * del Excel; en registros que ya existen NO toca saldoInicial ni el estatus
 * (para no pisar el uso real ya registrado en la app), solo refresca
 * credenciales/notas/datos de referencia.
 *
 * Uso:
 *   npx tsx scripts/importar_letra_a.ts <archivo.json>
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

type Fila = Record<string, unknown>;

const BANCOS: Record<string, string> = {
  bano: "banorte",
  saba: "sabadell",
  mife: "mifel",
  scot: "scotiabank",
  nu: "nu",
  sant: "santander",
  bank: "bankool",
  hey: "hey",
  azte: "azteca",
  astr: "astropay",
};

function perfilDePrefijo(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  const partes = s.split("-");
  return partes.length > 1 ? partes[1].trim() : s || null;
}

function textoLimpio(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toLocaleDateString("es-MX");
  const s = String(v).trim();
  return s.length ? s : null;
}

async function importarCasinos(filas: Fila[]) {
  let creados = 0;
  let actualizados = 0;
  let omitidos = 0;

  for (const row of filas) {
    const casinoAbrev = textoLimpio(row["Casino"]);
    const perfil = perfilDePrefijo(row["Perf"]);
    const estatusRaw = textoLimpio(row["Estatus"])?.toLowerCase() ?? null;

    if (!casinoAbrev || !perfil || estatusRaw === "x crear") {
      omitidos++;
      continue;
    }

    const id = `${casinoAbrev.toLowerCase()}.a.${perfil}`;
    const saldo = Number(row["Saldo final"] ?? row["Balance"] ?? 0) || 0;
    const noCasino = Number(row["No. Cas"] ?? 0) || 0;

    const notaPartes = [
      textoLimpio(row["Nota, seguimiento"]),
      textoLimpio(row["Accion"]),
    ].filter((x): x is string => !!x);
    const idClienteExcel = textoLimpio(row["Id cliente"]);
    if (idClienteExcel) notaPartes.push(`Cliente: ${idClienteExcel}`);
    const notaExcel = notaPartes.join("; ") || null;

    let statusCasino: "ACTIVO" | "ALERTA" = "ACTIVO";
    if (estatusRaw === "alerta" || estatusRaw === "urgente") statusCasino = "ALERTA";

    const existente = await prisma.casino.findUnique({ where: { id } });

    if (existente) {
      const nuevaNota =
        notaExcel && !(existente.nota ?? "").includes(notaExcel)
          ? [existente.nota, `[Excel] ${notaExcel}`].filter(Boolean).join("\n")
          : existente.nota;
      await prisma.casino.update({
        where: { id },
        data: {
          usuario: textoLimpio(row["Usuario"]) ?? existente.usuario,
          contrasena: textoLimpio(row["Contraseña"]) ?? existente.contrasena,
          nota: nuevaNota,
        },
      });
      actualizados++;
    } else {
      await prisma.casino.create({
        data: {
          id,
          noCasino,
          nombreCasino: casinoAbrev,
          letra: "A",
          perfil,
          saldoInicial: saldo,
          statusCasino,
          statusPerfil: "SIN_VERIFICACION",
          usuario: textoLimpio(row["Usuario"]),
          contrasena: textoLimpio(row["Contraseña"]),
          nota: notaExcel,
        },
      });
      creados++;
    }
  }

  console.log(`Casinos A -> creados: ${creados}, actualizados: ${actualizados}, omitidos: ${omitidos}`);
}

async function importarBancos(filas: Fila[]) {
  let creados = 0;
  let actualizados = 0;
  let omitidos = 0;
  let clientesVinculados = 0;

  for (const row of filas) {
    const bancoAbrevRaw = textoLimpio(row["Banco"]);
    const perfil = perfilDePrefijo(row["Perfil no"]);

    if (!bancoAbrevRaw || !perfil) {
      omitidos++;
      continue;
    }

    const bancoAbrev = bancoAbrevRaw.toLowerCase();
    const bancoNombre = BANCOS[bancoAbrev] ?? bancoAbrev;
    const id = `${bancoAbrev}.a.${perfil}`;

    const estatusRaw = textoLimpio(row["Estatus"])?.toLowerCase() ?? null;
    const saldo = Number(row["Saldo Total"] ?? row["Disponible"] ?? 0) || 0;

    const tipoRaw = textoLimpio(row["Tipo de cuenta"])?.toLowerCase().trim() ?? null;
    let tipoCuenta: "BASICA" | "SIN_LIMITE" | "MEJORADA" | null = null;
    if (tipoRaw === "basica") tipoCuenta = "BASICA";
    else if (tipoRaw === "sin limite") tipoCuenta = "SIN_LIMITE";
    else if (tipoRaw === "mejor") tipoCuenta = "MEJORADA";

    let status: "ACTIVA" | "POR_VERIFICAR" | "BLOQUEADA" = "ACTIVA";
    if (estatusRaw === "urgente") status = "POR_VERIFICAR";
    else if (estatusRaw === "pausa") status = "BLOQUEADA";

    const idClienteExcelRaw = textoLimpio(row["id unico"]);
    let idCliente: string | null = null;
    let nombreCliente: string | null = null;
    if (idClienteExcelRaw) {
      const cliente = await prisma.cliente.findUnique({ where: { id: idClienteExcelRaw } });
      if (cliente) {
        idCliente = cliente.id;
        nombreCliente = cliente.nombreCompleto;
        clientesVinculados++;
      }
    }

    const observacionesExcel = textoLimpio(row["Obsevaciones"]);
    const existente = await prisma.cuenta.findUnique({ where: { id } });

    if (existente) {
      const nuevasObs =
        observacionesExcel && !(existente.observaciones ?? "").includes(observacionesExcel)
          ? [existente.observaciones, `[Excel] ${observacionesExcel}`].filter(Boolean).join("\n")
          : existente.observaciones;
      await prisma.cuenta.update({
        where: { id },
        data: {
          clabe: textoLimpio(row["Clabe intrerbancaria"]) ?? existente.clabe,
          usuario: textoLimpio(row["Usuario nom"]) ?? existente.usuario,
          contrasena: textoLimpio(row[" CONTRASEÑA"]) ?? existente.contrasena,
          token: textoLimpio(row["TOKEN no"]) ?? existente.token,
          nCuenta: textoLimpio(row["No Cuenta"]) ?? existente.nCuenta,
          nCliente: textoLimpio(row["no.cliente"]) ?? existente.nCliente,
          nombrePerfil: textoLimpio(row["Nombre Perfil"]) ?? existente.nombrePerfil,
          nTarjeta: textoLimpio(row["No. Tarjeta"]) ?? existente.nTarjeta,
          exp: textoLimpio(row["Exp"]) ?? existente.exp,
          cvv: textoLimpio(row["C v v num"]) ?? existente.cvv,
          nip: textoLimpio(row["Pin num"]) ?? existente.nip,
          observaciones: nuevasObs,
          idCliente: idCliente ?? existente.idCliente,
          nombreCliente: nombreCliente ?? existente.nombreCliente,
        },
      });
      actualizados++;
    } else {
      await prisma.cuenta.create({
        data: {
          id,
          status,
          tipoCuenta,
          letra: "A",
          perfil,
          banco: bancoNombre,
          saldoInicial: saldo,
          clabe: textoLimpio(row["Clabe intrerbancaria"]),
          usuario: textoLimpio(row["Usuario nom"]),
          contrasena: textoLimpio(row[" CONTRASEÑA"]),
          token: textoLimpio(row["TOKEN no"]),
          nCuenta: textoLimpio(row["No Cuenta"]),
          nCliente: textoLimpio(row["no.cliente"]),
          nombrePerfil: textoLimpio(row["Nombre Perfil"]),
          nTarjeta: textoLimpio(row["No. Tarjeta"]),
          exp: textoLimpio(row["Exp"]),
          cvv: textoLimpio(row["C v v num"]),
          nip: textoLimpio(row["Pin num"]),
          observaciones: observacionesExcel,
          idCliente,
          nombreCliente,
        },
      });
      creados++;
    }
  }

  console.log(
    `Bancos -> creados: ${creados}, actualizados: ${actualizados}, omitidos: ${omitidos}, clientes vinculados: ${clientesVinculados}`,
  );
}

async function main() {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error("Uso: npx tsx scripts/importar_letra_a.ts <archivo.json>");
    process.exit(1);
  }
  const datos = JSON.parse(readFileSync(archivo, "utf-8")) as {
    casinos: Fila[];
    bancos: Fila[];
  };
  await importarCasinos(datos.casinos);
  await importarBancos(datos.bancos);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
