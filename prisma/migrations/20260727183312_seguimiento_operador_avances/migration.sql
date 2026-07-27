-- AlterTable
ALTER TABLE "seguimientos" ADD COLUMN     "operador_id" TEXT;

-- CreateTable
CREATE TABLE "seguimiento_avances" (
    "id" SERIAL NOT NULL,
    "seguimiento_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "registrado_por" TEXT NOT NULL,

    CONSTRAINT "seguimiento_avances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seguimiento_avances_seguimiento_id_idx" ON "seguimiento_avances"("seguimiento_id");

-- CreateIndex
CREATE INDEX "seguimientos_operador_id_idx" ON "seguimientos"("operador_id");

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_avances" ADD CONSTRAINT "seguimiento_avances_seguimiento_id_fkey" FOREIGN KEY ("seguimiento_id") REFERENCES "seguimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
