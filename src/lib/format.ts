import type { Prisma } from "@/generated/prisma/client";

const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function formatMoney(value: Prisma.Decimal | number | string): string {
  return formatter.format(Number(value));
}

/** Etiqueta corta de una cuenta bancaria o de casino: primeras 4 letras del nombre + perfil (ej. "Code101"). */
export function etiquetaCorta(nombre: string, perfil: string): string {
  return `${nombre.slice(0, 4)}${perfil}`;
}
