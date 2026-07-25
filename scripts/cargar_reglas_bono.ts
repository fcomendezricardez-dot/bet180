/**
 * Carga reglas de bono (promociones) para TODOS los casinos que coincidan con
 * un nombre de marca (ej. "Codere"), sin importar la letra/perfil. Evita
 * tener que repetir la configuración a mano para cada cuenta de esa marca.
 *
 * Uso:
 *   DATABASE_URL="..." npx tsx scripts/cargar_reglas_bono.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

type TierConfig = { depositoMin: number; depositoMax?: number; bonoMonto: number };

type ReglaConfig = {
  nombre: string;
  tipo: "DEPOSITO_MES" | "CADA_N_DIAS" | "BIENVENIDA";
  diaCorteMes?: number;
  cadaDias?: number;
  momioMinimo?: number;
  montoMinimo?: number;
  multiplicador?: number;
  notas?: string;
  tiers?: TierConfig[];
};

const MARCAS: { nombreCasino: string; reglas: ReglaConfig[] }[] = [
  {
    nombreCasino: "Codere",
    reglas: [
      {
        nombre: "Bono de primer depósito del mes",
        tipo: "DEPOSITO_MES",
        diaCorteMes: 15,
        notas: "Disponible del día 1 al 15 de cada mes, una vez por mes.",
        tiers: [
          { depositoMin: 500, depositoMax: 999.99, bonoMonto: 200 },
          { depositoMin: 1000, bonoMonto: 500 },
        ],
      },
      {
        nombre: "Bono cada 25 días",
        tipo: "CADA_N_DIAS",
        cadaDias: 25,
        notas: "Se puede volver a pedir cada 25 días desde el último reclamo.",
        tiers: [
          { depositoMin: 200, depositoMax: 399.99, bonoMonto: 100 },
          { depositoMin: 400, depositoMax: 1999.99, bonoMonto: 800 },
          { depositoMin: 2000, depositoMax: 3999.99, bonoMonto: 1000 },
          { depositoMin: 4000, bonoMonto: 2000 },
        ],
      },
      {
        nombre: "Bono de bienvenida",
        tipo: "BIENVENIDA",
        multiplicador: 2,
        momioMinimo: 1.5,
        montoMinimo: 500,
        notas:
          "El doble de lo depositado, una sola vez al registrarse. Se libera al colocar una apuesta con el monto " +
          "depositado a momio mínimo -200 / 1.5. No participan momios mejorados ni apuestas a un mismo evento.",
      },
    ],
  },
];

async function main() {
  for (const marca of MARCAS) {
    const casinos = await prisma.casino.findMany({
      where: { nombreCasino: { equals: marca.nombreCasino, mode: "insensitive" } },
    });
    console.log(`${marca.nombreCasino}: ${casinos.length} cuenta(s) encontrada(s).`);

    for (const casino of casinos) {
      for (const regla of marca.reglas) {
        const existe = await prisma.reglaBono.findFirst({
          where: { casinoId: casino.id, nombre: regla.nombre },
        });
        if (existe) {
          console.log(`  ${casino.id}: ya tiene "${regla.nombre}", se omite.`);
          continue;
        }

        await prisma.reglaBono.create({
          data: {
            casinoId: casino.id,
            nombre: regla.nombre,
            tipo: regla.tipo,
            diaCorteMes: regla.diaCorteMes,
            cadaDias: regla.cadaDias,
            momioMinimo: regla.momioMinimo,
            montoMinimo: regla.montoMinimo,
            multiplicador: regla.multiplicador,
            notas: regla.notas,
            tiers: regla.tiers ? { create: regla.tiers } : undefined,
          },
        });
        console.log(`  ${casino.id}: "${regla.nombre}" creada.`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
