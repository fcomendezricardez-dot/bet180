-- AlterTable
ALTER TABLE "apuestas" ADD COLUMN     "reclamo_bono_id" INTEGER;

-- AlterTable
ALTER TABLE "bono_reclamos" ADD COLUMN     "rollover_liberado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rollover_requerido" DECIMAL(14,2);

-- CreateIndex
CREATE INDEX "apuestas_reclamo_bono_id_idx" ON "apuestas"("reclamo_bono_id");

-- AddForeignKey
ALTER TABLE "apuestas" ADD CONSTRAINT "apuestas_reclamo_bono_id_fkey" FOREIGN KEY ("reclamo_bono_id") REFERENCES "bono_reclamos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
