import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

/**
 * Saldo Actual de una Cuenta bancaria (ver ESPECIFICACION sección 4):
 * saldo_inicial
 *   + depósitos confirmados a la cuenta
 *   - retiros confirmados de la cuenta
 *   + retiros confirmados cuyo `casino_u_origen` es esta cuenta
 *     (esta cuenta como destino de un préstamo desde otra cuenta)
 */
export async function calcularSaldoCuenta(cuentaId: string): Promise<Decimal> {
  const cuenta = await prisma.cuenta.findUniqueOrThrow({
    where: { id: cuentaId },
    select: { saldoInicial: true },
  });

  const [depositos, retiros, prestamosRecibidos] = await Promise.all([
    prisma.movimiento.aggregate({
      _sum: { monto: true },
      where: { cuentaId, tipo: "DEPOSITO", estado: "CONFIRMADO" },
    }),
    prisma.movimiento.aggregate({
      _sum: { monto: true },
      where: { cuentaId, tipo: "RETIRO", estado: "CONFIRMADO" },
    }),
    prisma.movimiento.aggregate({
      _sum: { monto: true },
      where: { casinoUOrigen: cuentaId, tipo: "RETIRO", estado: "CONFIRMADO" },
    }),
  ]);

  return cuenta.saldoInicial
    .plus(depositos._sum.monto ?? 0)
    .minus(retiros._sum.monto ?? 0)
    .plus(prestamosRecibidos._sum.monto ?? 0);
}

/**
 * Saldo Actual de un Casino (ver ESPECIFICACION sección 4):
 * saldo_inicial
 *   + depósitos recibidos desde bancos (retiros bancarios con casino_u_origen = este casino)
 *   - cobros retirados hacia bancos (depósitos bancarios con casino_u_origen = este casino)
 *   - todo lo apostado (En juego, Ganada o Perdida)
 *   + ganancias confirmadas (apuestas Ganada)
 */
export async function calcularSaldoCasino(casinoId: string): Promise<Decimal> {
  const casino = await prisma.casino.findUniqueOrThrow({
    where: { id: casinoId },
    select: { saldoInicial: true },
  });

  const [depositosRecibidos, cobrosRetirados, apuestas, ganancias] = await Promise.all([
    prisma.movimiento.aggregate({
      _sum: { monto: true },
      where: { casinoUOrigen: casinoId, tipo: "RETIRO", estado: "CONFIRMADO" },
    }),
    prisma.movimiento.aggregate({
      _sum: { monto: true },
      where: { casinoUOrigen: casinoId, tipo: "DEPOSITO", estado: "CONFIRMADO" },
    }),
    prisma.apuesta.aggregate({
      _sum: { saldoReal: true, bono: true },
      where: {
        casinoId,
        statusApuesta: { in: ["EN_JUEGO", "GANADA", "PERDIDA"] },
      },
    }),
    prisma.apuesta.aggregate({
      _sum: { resultadoGanancia: true },
      where: { casinoId, statusApuesta: "GANADA" },
    }),
  ]);

  const totalApostado = new Decimal(apuestas._sum.saldoReal ?? 0).plus(
    apuestas._sum.bono ?? 0,
  );

  return casino.saldoInicial
    .plus(depositosRecibidos._sum.monto ?? 0)
    .minus(cobrosRetirados._sum.monto ?? 0)
    .minus(totalApostado)
    .plus(ganancias._sum.resultadoGanancia ?? 0);
}

/**
 * Calcula el saldo actual de varias cuentas a la vez (agregando por cuentaId
 * y por casinoUOrigen en una sola pasada), para no hacer N+1 queries en
 * dashboards y listados.
 */
export async function calcularSaldosCuentas(
  where?: Prisma.CuentaWhereInput,
): Promise<Map<string, Decimal>> {
  const cuentas = await prisma.cuenta.findMany({
    where,
    select: { id: true, saldoInicial: true },
  });
  if (cuentas.length === 0) return new Map();

  const ids = cuentas.map((c) => c.id);

  const [porCuenta, prestamosRecibidos] = await Promise.all([
    prisma.movimiento.groupBy({
      by: ["cuentaId", "tipo"],
      _sum: { monto: true },
      where: { cuentaId: { in: ids }, estado: "CONFIRMADO" },
    }),
    prisma.movimiento.groupBy({
      by: ["casinoUOrigen"],
      _sum: { monto: true },
      where: { casinoUOrigen: { in: ids }, tipo: "RETIRO", estado: "CONFIRMADO" },
    }),
  ]);

  const movByCuenta = new Map<string, { depositos: Decimal; retiros: Decimal }>();
  for (const row of porCuenta) {
    const actual = movByCuenta.get(row.cuentaId) ?? { depositos: new Decimal(0), retiros: new Decimal(0) };
    if (row.tipo === "DEPOSITO") actual.depositos = actual.depositos.plus(row._sum.monto ?? 0);
    if (row.tipo === "RETIRO") actual.retiros = actual.retiros.plus(row._sum.monto ?? 0);
    movByCuenta.set(row.cuentaId, actual);
  }

  const prestamosByCuenta = new Map<string, Decimal>();
  for (const row of prestamosRecibidos) {
    if (row.casinoUOrigen) prestamosByCuenta.set(row.casinoUOrigen, new Decimal(row._sum.monto ?? 0));
  }

  const resultado = new Map<string, Decimal>();
  for (const cuenta of cuentas) {
    const mov = movByCuenta.get(cuenta.id) ?? { depositos: new Decimal(0), retiros: new Decimal(0) };
    const prestamo = prestamosByCuenta.get(cuenta.id) ?? new Decimal(0);
    resultado.set(cuenta.id, cuenta.saldoInicial.plus(mov.depositos).minus(mov.retiros).plus(prestamo));
  }
  return resultado;
}

/**
 * Calcula el saldo actual de varios casinos a la vez. Ver calcularSaldoCasino
 * para la fórmula; aquí se agrega por casinoId/casinoUOrigen en una sola pasada.
 */
export async function calcularSaldosCasinos(
  where?: Prisma.CasinoWhereInput,
): Promise<Map<string, Decimal>> {
  const casinos = await prisma.casino.findMany({
    where,
    select: { id: true, saldoInicial: true },
  });
  if (casinos.length === 0) return new Map();

  const ids = casinos.map((c) => c.id);

  const [porCasino, apuestasByCasino, gananciasByCasino] = await Promise.all([
    prisma.movimiento.groupBy({
      by: ["casinoUOrigen", "tipo"],
      _sum: { monto: true },
      where: { casinoUOrigen: { in: ids }, estado: "CONFIRMADO" },
    }),
    prisma.apuesta.groupBy({
      by: ["casinoId"],
      _sum: { saldoReal: true, bono: true },
      where: { casinoId: { in: ids }, statusApuesta: { in: ["EN_JUEGO", "GANADA", "PERDIDA"] } },
    }),
    prisma.apuesta.groupBy({
      by: ["casinoId"],
      _sum: { resultadoGanancia: true },
      where: { casinoId: { in: ids }, statusApuesta: "GANADA" },
    }),
  ]);

  const movByCasino = new Map<string, { entradas: Decimal; salidas: Decimal }>();
  for (const row of porCasino) {
    if (!row.casinoUOrigen) continue;
    const actual = movByCasino.get(row.casinoUOrigen) ?? { entradas: new Decimal(0), salidas: new Decimal(0) };
    if (row.tipo === "RETIRO") actual.entradas = actual.entradas.plus(row._sum.monto ?? 0);
    if (row.tipo === "DEPOSITO") actual.salidas = actual.salidas.plus(row._sum.monto ?? 0);
    movByCasino.set(row.casinoUOrigen, actual);
  }

  const apostadoByCasino = new Map<string, Decimal>();
  for (const row of apuestasByCasino) {
    apostadoByCasino.set(
      row.casinoId,
      new Decimal(row._sum.saldoReal ?? 0).plus(row._sum.bono ?? 0),
    );
  }

  const gananciaByCasino = new Map<string, Decimal>();
  for (const row of gananciasByCasino) {
    gananciaByCasino.set(row.casinoId, new Decimal(row._sum.resultadoGanancia ?? 0));
  }

  const resultado = new Map<string, Decimal>();
  for (const casino of casinos) {
    const mov = movByCasino.get(casino.id) ?? { entradas: new Decimal(0), salidas: new Decimal(0) };
    const apostado = apostadoByCasino.get(casino.id) ?? new Decimal(0);
    const ganancia = gananciaByCasino.get(casino.id) ?? new Decimal(0);
    resultado.set(
      casino.id,
      casino.saldoInicial.plus(mov.entradas).minus(mov.salidas).minus(apostado).plus(ganancia),
    );
  }
  return resultado;
}

/**
 * Widget "Quién puede prestar +$X": agrupa cuentas por perfil y suma su saldo
 * actual, filtrando los perfiles cuyo total supera el mínimo indicado.
 */
export async function perfilesConDisponibilidad(minimo = 10000, where?: Prisma.CuentaWhereInput) {
  const cuentas = await prisma.cuenta.findMany({
    where: { status: "ACTIVA", ...where },
    select: { id: true, letra: true, perfil: true, nombrePerfil: true },
  });
  const saldos = await calcularSaldosCuentas({ status: "ACTIVA", ...where });

  const porPerfil = new Map<
    string,
    { letra: string; perfil: string; nombrePerfil: string | null; total: Decimal }
  >();
  for (const cuenta of cuentas) {
    const key = `${cuenta.letra}.${cuenta.perfil}`;
    const saldo = saldos.get(cuenta.id) ?? new Decimal(0);
    const actual = porPerfil.get(key);
    if (actual) {
      actual.total = actual.total.plus(saldo);
    } else {
      porPerfil.set(key, {
        letra: cuenta.letra,
        perfil: cuenta.perfil,
        nombrePerfil: cuenta.nombrePerfil,
        total: saldo,
      });
    }
  }

  return [...porPerfil.values()]
    .filter((p) => p.total.greaterThanOrEqualTo(minimo))
    .sort((a, b) => b.total.comparedTo(a.total));
}
