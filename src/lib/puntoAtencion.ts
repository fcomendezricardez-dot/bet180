import { type Actor, assertAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { calcularFondeoCuentas } from "@/lib/fondeo";

/** Clientes cuya INE ya venció o vence este año o el próximo. Solo ADMIN. */
export async function vencimientosIne(actor: Actor) {
  assertAdmin(actor);
  const anioActual = new Date().getFullYear();

  const clientes = await prisma.cliente.findMany({
    where: { expIne: { not: null } },
    select: { id: true, nombreCompleto: true, expIne: true, equipo: true, status: true },
  });

  return clientes
    .map((c) => ({ ...c, aniosParaVencer: c.expIne! - anioActual }))
    .filter((c) => c.aniosParaVencer <= 1)
    .sort((a, b) => a.aniosParaVencer - b.aniosParaVencer);
}

/**
 * Clientes con 3+ meses desde su última recarga — riesgo de que la
 * telefonía dé de baja el número si pasan de 5 meses sin recargar.
 */
export async function proximosARecarga(actor: Actor) {
  assertAdmin(actor);

  const clientes = await prisma.cliente.findMany({
    where: { ultRecarga: { not: null } },
    select: { id: true, nombreCompleto: true, ultRecarga: true, equipo: true, status: true, telefono: true },
  });

  const hoy = Date.now();
  return clientes
    .map((c) => {
      const dias = Math.floor((hoy - c.ultRecarga!.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, dias, meses: dias / 30 };
    })
    .filter((c) => c.meses >= 3)
    .sort((a, b) => b.meses - a.meses);
}

/** Cuentas activas con saldo promedio del mes por debajo del mínimo. Solo ADMIN. */
export async function cuentasEnRiesgoDeFondeo(actor: Actor, minimo = 5000) {
  assertAdmin(actor);
  return calcularFondeoCuentas(minimo);
}
