import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("changeme123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@bet180.local" },
    update: {},
    create: {
      email: "admin@bet180.local",
      password,
      nombre: "Administrador",
      rol: "ADMIN",
      letra: null,
    },
  });

  for (const letra of ["A", "B"]) {
    await prisma.usuario.upsert({
      where: { email: `operador.${letra.toLowerCase()}@bet180.local` },
      update: {},
      create: {
        email: `operador.${letra.toLowerCase()}@bet180.local`,
        password,
        nombre: `Operador ${letra}`,
        rol: "OPERADOR",
        letra,
      },
    });
  }

  const cuentaA = await prisma.cuenta.upsert({
    where: { id: "sant.a.101" },
    update: {},
    create: {
      id: "sant.a.101",
      status: "ACTIVA",
      tipoCuenta: "BASICA",
      letra: "A",
      perfil: "101",
      banco: "Santander",
      saldoInicial: 5000,
      clabe: "014180000000000001",
      nombrePerfil: "Perfil Uno A",
    },
  });

  const cuentaA2 = await prisma.cuenta.upsert({
    where: { id: "bbva.a.102" },
    update: {},
    create: {
      id: "bbva.a.102",
      status: "ACTIVA",
      tipoCuenta: "MEJORADA",
      letra: "A",
      perfil: "102",
      banco: "BBVA",
      saldoInicial: 8000,
      clabe: "012180000000000002",
      nombrePerfil: "Perfil Dos A",
    },
  });

  const cuentaB = await prisma.cuenta.upsert({
    where: { id: "banorte.b.201" },
    update: {},
    create: {
      id: "banorte.b.201",
      status: "ACTIVA",
      tipoCuenta: "SIN_LIMITE",
      letra: "B",
      perfil: "201",
      banco: "Banorte",
      saldoInicial: 3000,
      clabe: "072180000000000003",
      nombrePerfil: "Perfil Uno B",
    },
  });

  const casinoA = await prisma.casino.upsert({
    where: { id: "code.a.101" },
    update: {},
    create: {
      id: "code.a.101",
      noCasino: 1,
      nombreCasino: "Codere",
      letra: "A",
      perfil: "101",
      saldoInicial: 1000,
      statusCasino: "ACTIVO",
      statusPerfil: "VERIFICADO",
      cobraEnId: cuentaA.id,
    },
  });

  await prisma.casino.upsert({
    where: { id: "bet365.a.101" },
    update: {},
    create: {
      id: "bet365.a.101",
      noCasino: 2,
      nombreCasino: "Bet365",
      letra: "A",
      perfil: "101",
      saldoInicial: 500,
      statusCasino: "ACTIVO",
      statusPerfil: "VERIFICADO",
      cobraEnId: cuentaA2.id,
    },
  });

  await prisma.casino.upsert({
    where: { id: "code.b.201" },
    update: {},
    create: {
      id: "code.b.201",
      noCasino: 1,
      nombreCasino: "Codere",
      letra: "B",
      perfil: "201",
      saldoInicial: 750,
      statusCasino: "ACTIVO",
      statusPerfil: "VERIFICADO",
      cobraEnId: cuentaB.id,
    },
  });

  // Movimiento de ejemplo: Depósito a Casino desde cuenta A101 hacia casino code.a.101
  const existingMov = await prisma.movimiento.findFirst({
    where: { cuentaId: cuentaA.id, casinoUOrigen: casinoA.id },
  });
  if (!existingMov) {
    await prisma.movimiento.create({
      data: {
        tipoMovimiento: "DEPOSITO_A_CASINO",
        cuentaId: cuentaA.id,
        tipo: "RETIRO",
        monto: 200,
        estado: "CONFIRMADO",
        casinoUOrigen: casinoA.id,
        concepto: "Depósito inicial de prueba",
        registradoPor: "admin@bet180.local",
      },
    });
  }

  // Apuesta de ejemplo en juego
  const existingApuesta = await prisma.apuesta.findFirst({
    where: { casinoId: casinoA.id },
  });
  if (!existingApuesta) {
    await prisma.apuesta.create({
      data: {
        letra: "A",
        perfil: "101",
        casinoId: casinoA.id,
        evento: "Real Madrid vs Barcelona",
        mercado: "LOCAL",
        descripcion: "Gana Real Madrid",
        momio: 2.1,
        saldoReal: 100,
        bono: 0,
        posibleGanancia: 210,
        statusApuesta: "EN_JUEGO",
      },
    });
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
