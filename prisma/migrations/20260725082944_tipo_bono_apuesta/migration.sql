-- CreateEnum
CREATE TYPE "TipoBonoApuesta" AS ENUM ('FREEBET', 'DINERO');

-- AlterTable
ALTER TABLE "apuestas" ADD COLUMN     "tipo_bono" "TipoBonoApuesta";
