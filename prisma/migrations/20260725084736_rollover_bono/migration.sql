-- AlterTable
ALTER TABLE "reglas_bono" ADD COLUMN     "bono_maximo" DECIMAL(14,2),
ADD COLUMN     "deposito_minimo" DECIMAL(14,2),
ADD COLUMN     "rollover_multiplicador" DECIMAL(6,3);
