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
  depositoMinimo?: number;
  bonoMaximo?: number;
  rolloverMultiplicador?: number;
  notas?: string;
  tiers?: TierConfig[];
};

const MARCAS: { nombreCasino: string; reglas: ReglaConfig[] }[] = [
  {
    // en tu catálogo puede aparecer completo ("Codere") o abreviado ("Code"); ambos hacen match con "Cod"
    nombreCasino: "Cod",
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
  {
    // igual: "Betc" hace match con "Betc" (abreviado) o "Betcris" (completo)
    nombreCasino: "Betc",
    reglas: [
      {
        nombre: "Bienvenida 200% (JUEGATRIPLEMX)",
        tipo: "BIENVENIDA",
        multiplicador: 2,
        depositoMinimo: 200,
        bonoMaximo: 8600,
        rolloverMultiplicador: 7,
        notas:
          "Vigente jun-dic 2026. Solo primer depósito, seleccionando JUEGATRIPLEMX en el cajero. Bono exclusivo " +
          "para apuestas deportivas. Además otorga 20 Free Spins en 'Football Super Spins' tras apostar mínimo $5 " +
          "en dinero real en los juegos de Casino participantes (vigencia de los free spins: 3 días).",
      },
      {
        nombre: "Recarga 15% miércoles (RECARGA15MX)",
        tipo: "CADA_N_DIAS",
        cadaDias: 7,
        multiplicador: 0.15,
        depositoMinimo: 200,
        bonoMaximo: 10000,
        rolloverMultiplicador: 3,
        notas:
          "Solo aplica para recargas (no primer depósito), y solo los miércoles, seleccionando RECARGA15 en el " +
          "cajero. Exclusivo apuestas deportivas (no Casino ni Caballos). Vigente hasta dic 2026.",
      },
      {
        nombre: "Recarga 100% semanal (DOBLE100)",
        tipo: "CADA_N_DIAS",
        cadaDias: 7,
        multiplicador: 1,
        depositoMinimo: 600,
        bonoMaximo: 10000,
        rolloverMultiplicador: 12,
        notas:
          "Solo recargas, una vez por semana, seleccionando DOBLE100 en el cajero. Exclusivo apuestas deportivas. " +
          "Vigente hasta dic 2026.",
      },
      {
        nombre: "Activa y Gana (verificación de cuenta)",
        tipo: "BIENVENIDA",
        momioMinimo: 1.5,
        rolloverMultiplicador: 15,
        notas:
          "Free play fijo de $200 tras primer depósito de $200+ y verificación de cuenta (KYC) con Atención a " +
          "Clientes. Se acredita hasta 12 hrs después de validar. Vigencia de uso: 5 días. No aplica Casino ni Caballos.",
        tiers: [{ depositoMin: 200, bonoMonto: 200 }],
      },
    ],
  },
  {
    // en tu catálogo aparece como "Sporti" (abreviado) o "Sportium"; "Sporti" hace match con ambos
    nombreCasino: "Sporti",
    reglas: [
      {
        nombre: "Bienvenida 100% hasta $3,500",
        tipo: "BIENVENIDA",
        multiplicador: 1,
        depositoMinimo: 100,
        bonoMaximo: 3500,
        rolloverMultiplicador: 3,
        momioMinimo: 2.0,
        notas:
          "Apuesta gratis por el monto del depósito (tope $3,500), se acredita al jugar 3 veces el depósito real " +
          "dentro de 15 días, momio mínimo +100 (2.00). La apuesta gratis caduca a los 7 días de acreditada. No " +
          "participan momios mejorados. Un bono por cliente nuevo.",
      },
    ],
  },
  {
    // Solo la parte del bono ligado a depósito; falta el detalle completo de
    // T&C (rollover, momio mínimo, vigencia) para configurarlo con precisión.
    // "Cali" hace match con "Cali" (abreviado) o "Caliente" (completo)
    nombreCasino: "Cali",
    reglas: [
      {
        nombre: "Duplican tu primer depósito (hasta $7,000)",
        tipo: "BIENVENIDA",
        multiplicador: 2,
        bonoMaximo: 7000,
        notas:
          "PENDIENTE confirmar: depósito mínimo, momio mínimo y rollover exactos (no estaban en el anuncio). " +
          "Además hay un regalo de $1,000 sin depósito que no aplica a este modelo (no requiere depositar).",
      },
    ],
  },
];

async function main() {
  for (const marca of MARCAS) {
    const casinos = await prisma.casino.findMany({
      where: { nombreCasino: { contains: marca.nombreCasino, mode: "insensitive" } },
    });
    const nombresDistintos = [...new Set(casinos.map((c) => c.nombreCasino))];
    console.log(`${marca.nombreCasino}: ${casinos.length} cuenta(s) encontrada(s). Nombres: ${nombresDistintos.join(", ") || "ninguno"}`);

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
            depositoMinimo: regla.depositoMinimo,
            bonoMaximo: regla.bonoMaximo,
            rolloverMultiplicador: regla.rolloverMultiplicador,
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
