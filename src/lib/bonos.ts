import { z } from "zod";
import { type Actor, assertAdmin, assertLetraAccess } from "@/lib/authz";
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

  return reglas
    .map((r) => {
      const ultimoReclamo = r.reclamos[0]?.fecha ?? null;
      const { disponible, proximaFecha } = calcularDisponibilidad(r, ultimoReclamo);
      return {
        id: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        casino: r.casino,
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
    })
    .sort((a, b) => Number(b.disponible) - Number(a.disponible));
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

  const tier = regla.tiers.find(
    (t) => data.monto >= t.depositoMin.toNumber() && (t.depositoMax === null || data.monto <= t.depositoMax.toNumber()),
  );
  if (!tier) {
    throw new Error("El monto no corresponde a ningún tier configurado para este bono.");
  }

  return prisma.bonoReclamo.create({
    data: {
      reglaId: data.reglaId,
      monto: data.monto,
      bonoOtorgado: tier.bonoMonto,
      registradoPor: actor.rol === "ADMIN" ? "admin" : `operador.${actor.letra}`,
    },
  });
}
