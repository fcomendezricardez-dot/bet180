import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const Decimal = Prisma.Decimal;

/**
 * Flujo de movimientos: clasifica cada tipo_movimiento como Entrada, Salida
 * o Interna respecto al conjunto de cuentas bancarias controladas:
 * - Entrada: Retiro de Casino (dinero que llega de un casino a una cuenta).
 * - Salida: Depósito a Casino y Gasto Operativo (dinero que sale hacia un
 *   casino o fuera del sistema).
 * - Interna: Préstamo entre Cuentas (se mueve entre cuentas propias).
 */
export async function flujoDeMovimientos(opts?: { letra?: string }) {
  const grupos = await prisma.movimiento.groupBy({
    by: ["tipoMovimiento"],
    _sum: { monto: true },
    _count: { _all: true },
    where: { estado: "CONFIRMADO", cuenta: opts?.letra ? { letra: opts.letra } : undefined },
  });

  const clasificacion: Record<string, "ENTRADA" | "SALIDA" | "INTERNA"> = {
    RETIRO_DE_CASINO: "ENTRADA",
    DEPOSITO_A_CASINO: "SALIDA",
    GASTO_OPERATIVO: "SALIDA",
    PRESTAMO_ENTRE_CUENTAS: "INTERNA",
  };

  const resultado = {
    ENTRADA: { total: new Decimal(0), count: 0 },
    SALIDA: { total: new Decimal(0), count: 0 },
    INTERNA: { total: new Decimal(0), count: 0 },
  };

  for (const g of grupos) {
    const clave = clasificacion[g.tipoMovimiento];
    resultado[clave].total = resultado[clave].total.plus(g._sum.monto ?? 0);
    resultado[clave].count += g._count._all;
  }

  return resultado;
}

/**
 * Ganancia por casino (para reportes) = suma de Retiros de Casino (cobros)
 * − suma de Depósitos a Casino. Distinto del saldo_actual del casino.
 */
export async function gananciaPorCasino(opts?: { letra?: string }) {
  const casinos = await prisma.casino.findMany({
    where: opts?.letra ? { letra: opts.letra } : undefined,
    select: { id: true, nombreCasino: true, letra: true, perfil: true },
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
  });
  if (casinos.length === 0) {
    const cero = new Decimal(0);
    return { filas: [], total: { depositos: cero, apuestas: cero, cobros: cero, gananciaNeta: cero } };
  }

  const ids = casinos.map((c) => c.id);

  const [movs, apuestas] = await Promise.all([
    prisma.movimiento.groupBy({
      by: ["casinoUOrigen", "tipoMovimiento"],
      _sum: { monto: true },
      where: {
        casinoUOrigen: { in: ids },
        estado: "CONFIRMADO",
        tipoMovimiento: { in: ["DEPOSITO_A_CASINO", "RETIRO_DE_CASINO"] },
      },
    }),
    prisma.apuesta.groupBy({
      by: ["casinoId"],
      _sum: { saldoReal: true, bono: true },
      where: { casinoId: { in: ids } },
    }),
  ]);

  const depositosPorCasino = new Map<string, Prisma.Decimal>();
  const cobrosPorCasino = new Map<string, Prisma.Decimal>();
  for (const m of movs) {
    if (!m.casinoUOrigen) continue;
    if (m.tipoMovimiento === "DEPOSITO_A_CASINO") {
      depositosPorCasino.set(m.casinoUOrigen, new Decimal(m._sum.monto ?? 0));
    } else if (m.tipoMovimiento === "RETIRO_DE_CASINO") {
      cobrosPorCasino.set(m.casinoUOrigen, new Decimal(m._sum.monto ?? 0));
    }
  }

  const apostadoPorCasino = new Map<string, Prisma.Decimal>();
  for (const a of apuestas) {
    apostadoPorCasino.set(a.casinoId, new Decimal(a._sum.saldoReal ?? 0).plus(a._sum.bono ?? 0));
  }

  const filas = casinos.map((c) => {
    const depositos = depositosPorCasino.get(c.id) ?? new Decimal(0);
    const apuestasTotal = apostadoPorCasino.get(c.id) ?? new Decimal(0);
    const cobros = cobrosPorCasino.get(c.id) ?? new Decimal(0);
    return {
      casinoId: c.id,
      nombreCasino: c.nombreCasino,
      letra: c.letra,
      perfil: c.perfil,
      depositos,
      apuestas: apuestasTotal,
      cobros,
      gananciaNeta: cobros.minus(depositos),
    };
  });

  const total = filas.reduce(
    (acc, f) => ({
      depositos: acc.depositos.plus(f.depositos),
      apuestas: acc.apuestas.plus(f.apuestas),
      cobros: acc.cobros.plus(f.cobros),
      gananciaNeta: acc.gananciaNeta.plus(f.gananciaNeta),
    }),
    { depositos: new Decimal(0), apuestas: new Decimal(0), cobros: new Decimal(0), gananciaNeta: new Decimal(0) },
  );

  return { filas, total };
}
