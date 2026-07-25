/**
 * Crea (o actualiza) un usuario ADMIN directamente en la base de datos
 * apuntada por DATABASE_URL — útil para crear la cuenta real de admin en
 * producción, sin pasar por el seed de datos de ejemplo.
 *
 * Uso:
 *   DATABASE_URL="<url de producción>" npx tsx scripts/crear_admin.ts <email> <password> [nombre]
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [email, password, nombre] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Uso: npx tsx scripts/crear_admin.ts <email> <password> [nombre]");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { password: hash, rol: "ADMIN", letra: null, activo: true },
    create: {
      email,
      password: hash,
      nombre: nombre || email,
      rol: "ADMIN",
      letra: null,
    },
  });

  console.log(`Usuario ADMIN listo: ${usuario.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
