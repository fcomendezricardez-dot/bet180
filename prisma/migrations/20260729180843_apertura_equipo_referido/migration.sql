/*
  Warnings:

  - You are about to drop the column `letra` on the `aperturas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "aperturas" DROP COLUMN "letra",
ADD COLUMN     "equipo" TEXT,
ADD COLUMN     "referido_por" TEXT;
