import { z } from "zod";
import { type Actor, assertLetraAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const EstadoMovimientoSchema = z.enum(["CONFIRMADO", "PENDIENTE", "CANCELADO"]).default("CONFIRMADO");

const MovimientoBaseSchema = z.object({
  monto: z.number().positive(),
  concepto: z.string().optional(),
  referencia: z.string().optional(),
  notas: z.string().optional(),
  estado: EstadoMovimientoSchema,
  registradoPor: z.string().min(1),
});

async function cuentaOrThrow(cuentaId: string) {
  return prisma.cuenta.findUniqueOrThrow({ where: { id: cuentaId } });
}

const DepositoRetiroSchema = MovimientoBaseSchema.extend({
  cuentaId: z.string().min(1),
  casinoId: z.string().min(1),
});

/**
 * Depósito a Casino: crea 1 movimiento bancario (Retiro, de la cuenta elegida,
 * con casino_u_origen = id del casino).
 */
export async function registrarDepositoACasino(actor: Actor, input: z.infer<typeof DepositoRetiroSchema>) {
  const data = DepositoRetiroSchema.parse(input);
  const cuenta = await cuentaOrThrow(data.cuentaId);
  assertLetraAccess(actor, cuenta.letra);

  return prisma.movimiento.create({
    data: {
      tipoMovimiento: "DEPOSITO_A_CASINO",
      cuentaId: data.cuentaId,
      tipo: "RETIRO",
      monto: data.monto,
      estado: data.estado,
      casinoUOrigen: data.casinoId,
      concepto: data.concepto,
      referencia: data.referencia,
      notas: data.notas,
      registradoPor: data.registradoPor,
    },
  });
}

/**
 * Retiro de Casino (cobro): crea 1 movimiento bancario (Depósito, a la cuenta
 * elegida, con casino_u_origen = id del casino).
 */
export async function registrarRetiroDeCasino(actor: Actor, input: z.infer<typeof DepositoRetiroSchema>) {
  const data = DepositoRetiroSchema.parse(input);
  const cuenta = await cuentaOrThrow(data.cuentaId);
  assertLetraAccess(actor, cuenta.letra);

  return prisma.movimiento.create({
    data: {
      tipoMovimiento: "RETIRO_DE_CASINO",
      cuentaId: data.cuentaId,
      tipo: "DEPOSITO",
      monto: data.monto,
      estado: data.estado,
      casinoUOrigen: data.casinoId,
      concepto: data.concepto,
      referencia: data.referencia,
      notas: data.notas,
      registradoPor: data.registradoPor,
    },
  });
}

const PrestamoSchema = MovimientoBaseSchema.extend({
  cuentaOrigenId: z.string().min(1),
  cuentaDestinoId: z.string().min(1),
}).refine((data) => data.cuentaOrigenId !== data.cuentaDestinoId, {
  message: "La cuenta origen y destino no pueden ser la misma.",
  path: ["cuentaDestinoId"],
});

/**
 * Préstamo entre Cuentas: crea 1 movimiento (Retiro en la cuenta origen, con
 * casino_u_origen apuntando a la cuenta destino).
 *
 * Un solo registro basta y es lo correcto: la fórmula de saldo de una cuenta
 * (sección 4) ya suma como depósito, en la cuenta destino, cualquier Retiro
 * cuyo casino_u_origen sea esa cuenta ("esto cubre cuando ESTA cuenta es el
 * destino de un préstamo desde otra cuenta"). Crear además un segundo
 * movimiento con cuenta_id = destino duplicaría el crédito en esa cuenta.
 */
export async function registrarPrestamoEntreCuentas(actor: Actor, input: z.infer<typeof PrestamoSchema>) {
  const data = PrestamoSchema.parse(input);
  const [origen, destino] = await Promise.all([
    cuentaOrThrow(data.cuentaOrigenId),
    cuentaOrThrow(data.cuentaDestinoId),
  ]);
  assertLetraAccess(actor, origen.letra);
  assertLetraAccess(actor, destino.letra);

  return prisma.movimiento.create({
    data: {
      tipoMovimiento: "PRESTAMO_ENTRE_CUENTAS",
      cuentaId: data.cuentaOrigenId,
      tipo: "RETIRO",
      monto: data.monto,
      estado: data.estado,
      casinoUOrigen: data.cuentaDestinoId,
      concepto: data.concepto,
      referencia: data.referencia,
      notas: data.notas,
      registradoPor: data.registradoPor,
    },
  });
}

const GastoOperativoSchema = MovimientoBaseSchema.extend({
  cuentaId: z.string().min(1),
});

/**
 * Gasto Operativo: crea 1 movimiento (Retiro) sin cuenta/casino destino — el
 * dinero simplemente sale del sistema.
 */
export async function registrarGastoOperativo(actor: Actor, input: z.infer<typeof GastoOperativoSchema>) {
  const data = GastoOperativoSchema.parse(input);
  const cuenta = await cuentaOrThrow(data.cuentaId);
  assertLetraAccess(actor, cuenta.letra);

  return prisma.movimiento.create({
    data: {
      tipoMovimiento: "GASTO_OPERATIVO",
      cuentaId: data.cuentaId,
      tipo: "RETIRO",
      monto: data.monto,
      estado: data.estado,
      casinoUOrigen: null,
      concepto: data.concepto,
      referencia: data.referencia,
      notas: data.notas,
      registradoPor: data.registradoPor,
    },
  });
}

/**
 * Lista movimientos visibles para el actor: ADMIN ve todas las letras (o
 * filtra por una si se indica), OPERADOR solo ve movimientos de cuentas de
 * su propia letra.
 */
export async function listMovimientos(actor: Actor, opts?: { letra?: string; cuentaId?: string }) {
  const letra = actor.rol === "OPERADOR" ? actor.letra! : opts?.letra;

  return prisma.movimiento.findMany({
    where: {
      cuentaId: opts?.cuentaId,
      cuenta: letra ? { letra } : undefined,
    },
    include: { cuenta: { select: { letra: true, banco: true, perfil: true } } },
    orderBy: { fecha: "desc" },
  });
}
