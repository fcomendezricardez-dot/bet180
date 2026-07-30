import { type Actor } from "@/lib/authz";
import { parsearEquipo } from "@/lib/clientes";
import { prisma } from "@/lib/prisma";
import { calcularFondeoCuentas } from "@/lib/fondeo";

function letraDeCliente(c: { equipo: string | null; cuentas: { letra: string }[] }) {
  return parsearEquipo(c.equipo)?.letra ?? c.cuentas[0]?.letra ?? null;
}

/**
 * Clientes cuya INE ya venció o vence este año o el próximo. ADMIN y GESTOR
 * ven todas las letras; OPERADOR solo la suya.
 */
export async function vencimientosIne(actor: Actor) {
  const anioActual = new Date().getFullYear();

  const clientes = await prisma.cliente.findMany({
    where: { expIne: { not: null } },
    select: {
      id: true,
      nombreCompleto: true,
      expIne: true,
      equipo: true,
      status: true,
      cuentas: { select: { letra: true }, take: 1 },
    },
  });

  return clientes
    .map((c) => ({ ...c, aniosParaVencer: c.expIne! - anioActual, letra: letraDeCliente(c) }))
    .filter((c) => c.aniosParaVencer <= 1)
    .filter((c) => actor.rol !== "OPERADOR" || c.letra === actor.letra)
    .sort((a, b) => a.aniosParaVencer - b.aniosParaVencer);
}

/**
 * Clientes con 3+ meses desde su última recarga — riesgo de que la
 * telefonía dé de baja el número si pasan de 5 meses sin recargar. ADMIN y
 * GESTOR ven todas las letras; OPERADOR solo la suya.
 */
export async function proximosARecarga(actor: Actor) {
  const clientes = await prisma.cliente.findMany({
    where: { ultRecarga: { not: null } },
    select: {
      id: true,
      nombreCompleto: true,
      ultRecarga: true,
      equipo: true,
      status: true,
      telefono: true,
      cuentas: { select: { letra: true }, take: 1 },
    },
  });

  const hoy = Date.now();
  return clientes
    .map((c) => {
      const dias = Math.floor((hoy - c.ultRecarga!.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, dias, meses: dias / 30, letra: letraDeCliente(c) };
    })
    .filter((c) => c.meses >= 3)
    .filter((c) => actor.rol !== "OPERADOR" || c.letra === actor.letra)
    .sort((a, b) => b.meses - a.meses);
}

/**
 * Cuentas activas con saldo promedio del mes por debajo del mínimo. ADMIN y
 * GESTOR ven todas las letras; OPERADOR solo la suya.
 */
export async function cuentasEnRiesgoDeFondeo(actor: Actor, minimo = 5000) {
  return calcularFondeoCuentas(minimo, actor.rol === "OPERADOR" ? actor.letra! : undefined);
}
