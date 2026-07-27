import { z } from "zod";
import { type Actor, assertAdmin, assertLetraAccess } from "@/lib/authz";
import { clientePorLetraPerfil } from "@/lib/clientes";
import { prisma } from "@/lib/prisma";

const TierSchema = z.object({
  depositoMin: z.number().nonnegative(),
  depositoMax: z.number().positive().optional(),
  bonoMonto: z.number().positive(),
});

const ReglaBonoSchema = z.object({
  casinoId: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.enum(["DEPOSITO_MES", "CADA_N_DIAS", "BIENVENIDA"]),
  diaCorteMes: z.number().int().min(1).max(31).optional(),
  cadaDias: z.number().int().positive().optional(),
  momioMinimo: z.number().positive().optional(),
  montoMinimo: z.number().nonnegative().optional(),
  /// si se define, el bono = monto × multiplicador (ej. 2 = el doble) en vez de usar la tabla de tiers
  multiplicador: z.number().positive().optional(),
  depositoMinimo: z.number().nonnegative().optional(),
  bonoMaximo: z.number().positive().optional(),
  rolloverMultiplicador: z.number().positive().optional(),
  activo: z.boolean().default(true),
  notas: z.string().optional(),
  tiers: z.array(TierSchema).default([]),
});

/** Da de alta una regla de bono nueva para un casino, con su tabla de tiers. Solo ADMIN. */
export async function crearReglaBono(actor: Actor, input: z.infer<typeof ReglaBonoSchema>) {
  assertAdmin(actor);
  const data = ReglaBonoSchema.parse(input);
  return prisma.reglaBono.create({
    data: {
      casinoId: data.casinoId,
      nombre: data.nombre,
      tipo: data.tipo,
      diaCorteMes: data.diaCorteMes,
      cadaDias: data.cadaDias,
      momioMinimo: data.momioMinimo,
      montoMinimo: data.montoMinimo,
      multiplicador: data.multiplicador,
      depositoMinimo: data.depositoMinimo,
      bonoMaximo: data.bonoMaximo,
      rolloverMultiplicador: data.rolloverMultiplicador,
      activo: data.activo,
      notas: data.notas,
      tiers: { create: data.tiers },
    },
  });
}

const ActualizarReglaBonoSchema = ReglaBonoSchema.omit({ casinoId: true }).partial();

/** Edita una regla existente; si se envían tiers, reemplaza la tabla completa. Solo ADMIN. */
export async function actualizarReglaBono(
  actor: Actor,
  id: number,
  input: z.infer<typeof ActualizarReglaBonoSchema>,
) {
  assertAdmin(actor);
  const { tiers, ...resto } = ActualizarReglaBonoSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    if (tiers) {
      await tx.bonoTier.deleteMany({ where: { reglaId: id } });
      if (tiers.length > 0) {
        await tx.bonoTier.createMany({ data: tiers.map((t) => ({ ...t, reglaId: id })) });
      }
    }
    return tx.reglaBono.update({ where: { id }, data: resto });
  });
}

/** Elimina una regla de bono (y sus tiers/reclamos en cascada). Solo ADMIN. */
export async function eliminarReglaBono(actor: Actor, id: number) {
  assertAdmin(actor);
  return prisma.reglaBono.delete({ where: { id } });
}

/** Lista las reglas de bono configuradas para un casino, con sus tiers. */
export async function listReglasBonoPorCasino(actor: Actor, casinoId: string) {
  const casino = await prisma.casino.findUniqueOrThrow({ where: { id: casinoId } });
  assertLetraAccess(actor, casino.letra);
  return prisma.reglaBono.findMany({
    where: { casinoId },
    include: { tiers: { orderBy: { depositoMin: "asc" } } },
    orderBy: { nombre: "asc" },
  });
}

function calcularDisponibilidad(
  regla: { tipo: "DEPOSITO_MES" | "CADA_N_DIAS" | "BIENVENIDA"; diaCorteMes: number | null; cadaDias: number | null },
  ultimoReclamo: Date | null,
): { disponible: boolean; proximaFecha: Date | null } {
  const hoy = new Date();

  if (regla.tipo === "BIENVENIDA") {
    return { disponible: !ultimoReclamo, proximaFecha: null };
  }

  if (regla.tipo === "CADA_N_DIAS") {
    if (!ultimoReclamo) return { disponible: true, proximaFecha: null };
    const proxima = new Date(ultimoReclamo);
    proxima.setDate(proxima.getDate() + (regla.cadaDias ?? 0));
    return { disponible: proxima <= hoy, proximaFecha: proxima > hoy ? proxima : null };
  }

  // DEPOSITO_MES
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const yaReclamadoEsteMes = ultimoReclamo !== null && ultimoReclamo >= inicioMes;
  const dentroDeCorte = hoy.getDate() <= (regla.diaCorteMes ?? 31);

  if (yaReclamadoEsteMes) {
    return { disponible: false, proximaFecha: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1) };
  }
  return {
    disponible: dentroDeCorte,
    proximaFecha: dentroDeCorte ? null : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1),
  };
}

/** Reglas activas con su status de disponibilidad ahora mismo, para Punto de Atención. Solo ADMIN. */
export async function bonosDisponibles(actor: Actor) {
  assertAdmin(actor);

  const reglas = await prisma.reglaBono.findMany({
    where: { activo: true },
    include: {
      casino: { select: { id: true, nombreCasino: true, letra: true, perfil: true } },
      tiers: { orderBy: { depositoMin: "asc" } },
      reclamos: { orderBy: { fecha: "desc" }, take: 1 },
    },
  });

  const clientesPorCasino = new Map<string, { id: string; nombreCompleto: string } | null>();
  async function clienteDe(casino: { id: string; letra: string; perfil: string }) {
    if (!clientesPorCasino.has(casino.id)) {
      clientesPorCasino.set(casino.id, await clientePorLetraPerfil(casino.letra, casino.perfil));
    }
    return clientesPorCasino.get(casino.id) ?? null;
  }

  const resultado = await Promise.all(
    reglas.map(async (r) => {
      const ultimoReclamo = r.reclamos[0]?.fecha ?? null;
      const { disponible, proximaFecha } = calcularDisponibilidad(r, ultimoReclamo);
      return {
        id: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        casino: r.casino,
        cliente: await clienteDe(r.casino),
        multiplicador: r.multiplicador ? r.multiplicador.toNumber() : null,
        depositoMinimo: r.depositoMinimo ? r.depositoMinimo.toNumber() : null,
        bonoMaximo: r.bonoMaximo ? r.bonoMaximo.toNumber() : null,
        rolloverMultiplicador: r.rolloverMultiplicador ? r.rolloverMultiplicador.toNumber() : null,
        tiers: r.tiers.map((t) => ({
          id: t.id,
          depositoMin: t.depositoMin.toNumber(),
          depositoMax: t.depositoMax?.toNumber() ?? null,
          bonoMonto: t.bonoMonto.toNumber(),
        })),
        ultimoReclamo,
        disponible,
        proximaFecha,
      };
    }),
  );

  return resultado.sort((a, b) => Number(b.disponible) - Number(a.disponible));
}

const ReclamoSchema = z.object({ reglaId: z.number().int(), monto: z.number().positive() });

/** Registra que se reclamó un bono: calcula el tier según el monto depositado y guarda el historial. */
export async function registrarReclamoBono(actor: Actor, input: z.infer<typeof ReclamoSchema>) {
  const data = ReclamoSchema.parse(input);
  const regla = await prisma.reglaBono.findUniqueOrThrow({
    where: { id: data.reglaId },
    include: { casino: true, tiers: true },
  });
  assertLetraAccess(actor, regla.casino.letra);

  let bonoOtorgado: number;
  if (regla.multiplicador) {
    if (regla.depositoMinimo && data.monto < regla.depositoMinimo.toNumber()) {
      throw new Error(`El depósito mínimo para este bono es ${regla.depositoMinimo.toNumber()}.`);
    }
    bonoOtorgado = data.monto * regla.multiplicador.toNumber();
    if (regla.bonoMaximo && bonoOtorgado > regla.bonoMaximo.toNumber()) {
      bonoOtorgado = regla.bonoMaximo.toNumber();
    }
  } else {
    const tier = regla.tiers.find(
      (t) => data.monto >= t.depositoMin.toNumber() && (t.depositoMax === null || data.monto <= t.depositoMax.toNumber()),
    );
    if (!tier) {
      throw new Error("El monto no corresponde a ningún tier configurado para este bono.");
    }
    bonoOtorgado = tier.bonoMonto.toNumber();
  }

  const rolloverRequerido = regla.rolloverMultiplicador
    ? (data.monto + bonoOtorgado) * regla.rolloverMultiplicador.toNumber()
    : undefined;

  return prisma.bonoReclamo.create({
    data: {
      reglaId: data.reglaId,
      monto: data.monto,
      bonoOtorgado,
      rolloverRequerido,
      registradoPor: actor.rol === "ADMIN" ? "admin" : `operador.${actor.letra}`,
    },
  });
}

/**
 * Progreso de rollover de un reclamo: suma las apuestas vinculadas según la
 * regla estándar — ganadoras cuentan lo menor entre arriesgado y ganado,
 * perdedoras cuentan lo arriesgado, en juego no cuenta todavía, y solo la
 * parte de saldo real (no el bono) cuenta.
 */
async function calcularProgresoRollover(reclamoId: number): Promise<number> {
  const apuestas = await prisma.apuesta.findMany({
    where: { reclamoBonoId: reclamoId, apuestaRelacionadaId: null },
    include: { gananciasRelacionadas: { select: { resultadoGanancia: true } } },
  });

  return apuestas.reduce((acc, a) => {
    const arriesgado = a.saldoReal.toNumber();
    if (a.statusApuesta === "GANADA") {
      const ganado = a.gananciasRelacionadas[0]?.resultadoGanancia?.toNumber() ?? arriesgado;
      return acc + Math.min(arriesgado, ganado);
    }
    if (a.statusApuesta === "PERDIDA") {
      return acc + arriesgado;
    }
    return acc; // EN_JUEGO: aún no cuenta
  }, 0);
}

/** Reclamos con rollover pendiente de un casino (para vincular apuestas nuevas). */
export async function reclamosPendientesDeCasino(actor: Actor, casinoId: string) {
  const casino = await prisma.casino.findUniqueOrThrow({ where: { id: casinoId } });
  assertLetraAccess(actor, casino.letra);

  const reclamos = await prisma.bonoReclamo.findMany({
    where: { regla: { casinoId }, rolloverRequerido: { not: null }, rolloverLiberado: false },
    include: { regla: { select: { nombre: true } } },
    orderBy: { fecha: "desc" },
  });

  return Promise.all(
    reclamos.map(async (r) => ({
      id: r.id,
      nombreRegla: r.regla.nombre,
      fecha: r.fecha,
      monto: r.monto.toNumber(),
      bonoOtorgado: r.bonoOtorgado.toNumber(),
      rolloverRequerido: r.rolloverRequerido!.toNumber(),
      progreso: await calcularProgresoRollover(r.id),
    })),
  );
}

/** Todos los reclamos con rollover pendiente, para la pantalla Bonos. Solo ADMIN. */
export async function reclamosConRolloverPendiente(actor: Actor) {
  assertAdmin(actor);

  const reclamos = await prisma.bonoReclamo.findMany({
    where: { rolloverRequerido: { not: null }, rolloverLiberado: false },
    include: {
      regla: { select: { nombre: true, casino: { select: { id: true, nombreCasino: true, letra: true, perfil: true } } } },
    },
    orderBy: { fecha: "desc" },
  });

  return Promise.all(
    reclamos.map(async (r) => {
      const progreso = await calcularProgresoRollover(r.id);
      const requerido = r.rolloverRequerido!.toNumber();
      const cliente = await clientePorLetraPerfil(r.regla.casino.letra, r.regla.casino.perfil);
      return {
        id: r.id,
        nombreRegla: r.regla.nombre,
        casino: r.regla.casino,
        cliente,
        fecha: r.fecha,
        monto: r.monto.toNumber(),
        bonoOtorgado: r.bonoOtorgado.toNumber(),
        rolloverRequerido: requerido,
        progreso,
        completo: progreso >= requerido,
      };
    }),
  );
}

/**
 * Recalcula el progreso de un reclamo y, si ya alcanzó lo requerido, lo marca
 * liberado automáticamente. Se llama internamente al cerrar una apuesta
 * vinculada a un reclamo (ver cerrarApuestaGanada/Perdida en lib/apuestas.ts).
 */
export async function verificarYLiberarRolloverSiCompleto(reclamoId: number) {
  const reclamo = await prisma.bonoReclamo.findUnique({ where: { id: reclamoId } });
  if (!reclamo || !reclamo.rolloverRequerido || reclamo.rolloverLiberado) return;

  const progreso = await calcularProgresoRollover(reclamoId);
  if (progreso >= reclamo.rolloverRequerido.toNumber()) {
    await prisma.bonoReclamo.update({ where: { id: reclamoId }, data: { rolloverLiberado: true } });
  }
}

/** Marca (o desmarca) el rollover de un reclamo como liberado a mano — ej. cuando el sistema interno del casino ya lo dio por completado. */
export async function marcarRolloverLiberado(actor: Actor, reclamoId: number, liberado: boolean) {
  const reclamo = await prisma.bonoReclamo.findUniqueOrThrow({
    where: { id: reclamoId },
    include: { regla: { include: { casino: true } } },
  });
  assertLetraAccess(actor, reclamo.regla.casino.letra);
  return prisma.bonoReclamo.update({ where: { id: reclamoId }, data: { rolloverLiberado: liberado } });
}
