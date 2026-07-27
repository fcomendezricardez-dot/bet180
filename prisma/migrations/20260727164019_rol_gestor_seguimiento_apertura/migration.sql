-- CreateEnum
CREATE TYPE "PrioridadSeguimiento" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "EstadoSeguimiento" AS ENUM ('PENDIENTE', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "EstadoApertura" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA');

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'GESTOR';

-- CreateTable
CREATE TABLE "seguimientos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "prioridad" "PrioridadSeguimiento" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoSeguimiento" NOT NULL DEFAULT 'PENDIENTE',
    "cliente_id" TEXT,
    "responsable_id" TEXT,
    "fecha_entrega" TIMESTAMP(3),
    "casino_involucrado_id" TEXT,
    "banco_involucrado_id" TEXT,
    "cantidad_involucrada" DECIMAL(14,2),
    "notas" TEXT,
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aperturas" (
    "id" SERIAL NOT NULL,
    "nombre_cliente" TEXT NOT NULL,
    "telefono" TEXT,
    "letra" TEXT,
    "cliente_id" TEXT,
    "banco_o_casino" TEXT NOT NULL,
    "fecha_cita" TIMESTAMP(3) NOT NULL,
    "responsable_id" TEXT,
    "notas" TEXT,
    "estado" "EstadoApertura" NOT NULL DEFAULT 'AGENDADA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aperturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seguimientos_estado_idx" ON "seguimientos"("estado");

-- CreateIndex
CREATE INDEX "seguimientos_cliente_id_idx" ON "seguimientos"("cliente_id");

-- CreateIndex
CREATE INDEX "seguimientos_responsable_id_idx" ON "seguimientos"("responsable_id");

-- CreateIndex
CREATE INDEX "seguimientos_fecha_entrega_idx" ON "seguimientos"("fecha_entrega");

-- CreateIndex
CREATE INDEX "aperturas_estado_idx" ON "aperturas"("estado");

-- CreateIndex
CREATE INDEX "aperturas_fecha_cita_idx" ON "aperturas"("fecha_cita");

-- CreateIndex
CREATE INDEX "aperturas_cliente_id_idx" ON "aperturas"("cliente_id");

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_casino_involucrado_id_fkey" FOREIGN KEY ("casino_involucrado_id") REFERENCES "casinos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_banco_involucrado_id_fkey" FOREIGN KEY ("banco_involucrado_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aperturas" ADD CONSTRAINT "aperturas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aperturas" ADD CONSTRAINT "aperturas_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
