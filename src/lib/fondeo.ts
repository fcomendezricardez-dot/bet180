import { prisma } from "@/lib/prisma";
import { calcularSaldoCuenta } from "@/lib/saldos";

/**
 * Guarda una foto del saldo actual de cada cuenta activa para el día de hoy
 * (idempotente: si ya existe la corre para hoy, la actualiza). Pensado para
 * llamarse una vez al día desde /api/cron/snapshot-saldos.
 */
export async function registrarSnapshotDiario() {
  const cuentas = await prisma.cuenta.findMany({ where: { status: "ACTIVA" }, select: { id: true } });
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  let procesadas = 0;
  for (const cuenta of cuentas) {
    const saldo = await calcularSaldoCuenta(cuenta.id);
    await prisma.saldoDiario.upsert({
      where: { cuentaId_fecha: { cuentaId: cuenta.id, fecha: hoy } },
      update: { saldo },
      create: { cuentaId: cuenta.id, fecha: hoy, saldo },
    });
    procesadas++;
  }
  return { procesadas, fecha: hoy.toISOString() };
}

/**
 * Cuentas activas cuyo saldo promedio del mes actual (según las fotos
 * diarias acumuladas) está por debajo del mínimo — riesgo de comisión por
 * fondeo bajo. Solo cuenta cuentas con al menos una foto registrada este mes.
 */
export async function calcularFondeoCuentas(minimo = 5000, letra?: string) {
  const inicioMes = new Date();
  inicioMes.setUTCDate(1);
  inicioMes.setUTCHours(0, 0, 0, 0);

  const cuentas = await prisma.cuenta.findMany({
    where: { status: "ACTIVA", letra },
    select: { id: true, banco: true, letra: true, perfil: true, nombreCliente: true },
  });

  const promedios = await prisma.saldoDiario.groupBy({
    by: ["cuentaId"],
    _avg: { saldo: true },
    _count: { saldo: true },
    where: { fecha: { gte: inicioMes } },
  });
  const porCuenta = new Map(promedios.map((p) => [p.cuentaId, p]));

  return cuentas
    .map((c) => {
      const p = porCuenta.get(c.id);
      const promedioMes = p?._avg.saldo ? Number(p._avg.saldo) : null;
      return {
        id: c.id,
        banco: c.banco,
        letra: c.letra,
        perfil: c.perfil,
        nombreCliente: c.nombreCliente,
        diasRegistrados: p?._count.saldo ?? 0,
        promedioMes,
      };
    })
    .filter((c) => c.promedioMes !== null && c.promedioMes < minimo)
    .sort((a, b) => (a.promedioMes ?? 0) - (b.promedioMes ?? 0));
}
