-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "status" TEXT,
    "nombre_completo" TEXT NOT NULL,
    "direccion_ine" TEXT,
    "ciudad" TEXT,
    "estado" TEXT,
    "cp" TEXT,
    "curp" TEXT,
    "rfc" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "exp_ine" INTEGER,
    "idmx" TEXT,
    "no_ine" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "nombre_referencia" TEXT,
    "no_referencia" TEXT,
    "ingreso_por" TEXT,
    "equipo" TEXT,
    "opera" TEXT,
    "correo_operativo" TEXT,
    "contrasena_operativa" TEXT,
    "no_linea" TEXT,
    "telefonia" TEXT,
    "validacion" TEXT,
    "ult_recarga" TIMESTAMP(3),
    "apertura" TEXT,
    "fecha_registro" TIMESTAMP(3),
    "nota" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_nombre_completo_idx" ON "clientes"("nombre_completo");

-- CreateIndex
CREATE INDEX "cuentas_id_cliente_idx" ON "cuentas"("id_cliente");

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
