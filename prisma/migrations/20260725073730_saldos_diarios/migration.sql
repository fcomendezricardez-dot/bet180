-- CreateTable
CREATE TABLE "saldos_diarios" (
    "id" SERIAL NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "saldo" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saldos_diarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saldos_diarios_fecha_idx" ON "saldos_diarios"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "saldos_diarios_cuenta_id_fecha_key" ON "saldos_diarios"("cuenta_id", "fecha");

-- AddForeignKey
ALTER TABLE "saldos_diarios" ADD CONSTRAINT "saldos_diarios_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
