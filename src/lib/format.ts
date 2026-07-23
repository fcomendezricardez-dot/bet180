import type { Prisma } from "@/generated/prisma/client";

const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function formatMoney(value: Prisma.Decimal | number | string): string {
  return formatter.format(Number(value));
}
