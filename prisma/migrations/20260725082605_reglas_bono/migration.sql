-- CreateEnum
CREATE TYPE "TipoBono" AS ENUM ('DEPOSITO_MES', 'CADA_N_DIAS', 'BIENVENIDA');

-- CreateTable
CREATE TABLE "reglas_bono" (
    "id" SERIAL NOT NULL,
    "casino_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoBono" NOT NULL,
    "dia_corte_mes" INTEGER,
    "cada_dias" INTEGER,
    "momio_minimo" DECIMAL(8,3),
    "monto_minimo" DECIMAL(14,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_bono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bono_tiers" (
    "id" SERIAL NOT NULL,
    "regla_id" INTEGER NOT NULL,
    "deposito_min" DECIMAL(14,2) NOT NULL,
    "deposito_max" DECIMAL(14,2),
    "bono_monto" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "bono_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bono_reclamos" (
    "id" SERIAL NOT NULL,
    "regla_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(14,2) NOT NULL,
    "bono_otorgado" DECIMAL(14,2) NOT NULL,
    "registrado_por" TEXT NOT NULL,

    CONSTRAINT "bono_reclamos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reglas_bono_casino_id_idx" ON "reglas_bono"("casino_id");

-- CreateIndex
CREATE INDEX "bono_tiers_regla_id_idx" ON "bono_tiers"("regla_id");

-- CreateIndex
CREATE INDEX "bono_reclamos_regla_id_idx" ON "bono_reclamos"("regla_id");

-- AddForeignKey
ALTER TABLE "reglas_bono" ADD CONSTRAINT "reglas_bono_casino_id_fkey" FOREIGN KEY ("casino_id") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bono_tiers" ADD CONSTRAINT "bono_tiers_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "reglas_bono"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bono_reclamos" ADD CONSTRAINT "bono_reclamos_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "reglas_bono"("id") ON DELETE CASCADE ON UPDATE CASCADE;
