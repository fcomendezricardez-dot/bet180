-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusCuenta" AS ENUM ('POR_VERIFICAR', 'ACTIVA', 'BLOQUEADA', 'BAJA', 'SIN_ACCESO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('BASICA', 'SIN_LIMITE', 'MEJORADA');

-- CreateEnum
CREATE TYPE "StatusCasino" AS ENUM ('ACTIVO', 'BLOQUEADO', 'ALERTA');

-- CreateEnum
CREATE TYPE "StatusPerfil" AS ENUM ('VERIFICADO', 'EN_PROCESO', 'SIN_VERIFICACION');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('DEPOSITO_A_CASINO', 'RETIRO_DE_CASINO', 'PRESTAMO_ENTRE_CUENTAS', 'GASTO_OPERATIVO');

-- CreateEnum
CREATE TYPE "DireccionMovimiento" AS ENUM ('RETIRO', 'DEPOSITO');

-- CreateEnum
CREATE TYPE "EstadoMovimiento" AS ENUM ('CONFIRMADO', 'PENDIENTE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Mercado" AS ENUM ('LOCAL', 'EMPATE', 'VISITANTE');

-- CreateEnum
CREATE TYPE "StatusApuesta" AS ENUM ('EN_JUEGO', 'GANADA', 'PERDIDA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "letra" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "status" "StatusCuenta" NOT NULL DEFAULT 'POR_VERIFICAR',
    "tipo_cuenta" "TipoCuenta" NOT NULL,
    "letra" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(14,2) NOT NULL,
    "clabe" TEXT,
    "usuario" TEXT,
    "contrasena" TEXT,
    "nueva_contrasena" TEXT,
    "token" TEXT,
    "nip" TEXT,
    "n_cuenta" TEXT,
    "n_cliente" TEXT,
    "nombre_perfil" TEXT,
    "n_tarjeta" TEXT,
    "exp" TEXT,
    "cvv" TEXT,
    "ubicacion_custodia" TEXT,
    "observaciones" TEXT,
    "prestada_a" TEXT,
    "id_cliente" TEXT,
    "nombre_cliente" TEXT,
    "cliente_activo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casinos" (
    "id" TEXT NOT NULL,
    "no_casino" INTEGER NOT NULL,
    "nombre_casino" TEXT NOT NULL,
    "letra" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(14,2) NOT NULL,
    "status_casino" "StatusCasino" NOT NULL,
    "status_perfil" "StatusPerfil" NOT NULL,
    "usuario" TEXT,
    "contrasena" TEXT,
    "cobraEnId" TEXT,
    "nota" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_movimiento" "TipoMovimiento" NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "tipo" "DireccionMovimiento" NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "estado" "EstadoMovimiento" NOT NULL DEFAULT 'CONFIRMADO',
    "casino_u_origen" TEXT,
    "concepto" TEXT,
    "referencia" TEXT,
    "notas" TEXT,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apuestas" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "letra" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "casinoId" TEXT NOT NULL,
    "no_apuesta" TEXT,
    "evento" TEXT NOT NULL,
    "mercado" "Mercado" NOT NULL,
    "descripcion" TEXT,
    "momio" DECIMAL(8,3) NOT NULL,
    "saldo_real" DECIMAL(14,2) NOT NULL,
    "bono" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "posible_ganancia" DECIMAL(14,2) NOT NULL,
    "status_apuesta" "StatusApuesta" NOT NULL DEFAULT 'EN_JUEGO',
    "resultado_ganancia" DECIMAL(14,2),
    "apuesta_relacionada_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apuestas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "cuentas_letra_idx" ON "cuentas"("letra");

-- CreateIndex
CREATE INDEX "cuentas_status_idx" ON "cuentas"("status");

-- CreateIndex
CREATE INDEX "casinos_letra_idx" ON "casinos"("letra");

-- CreateIndex
CREATE INDEX "casinos_status_casino_idx" ON "casinos"("status_casino");

-- CreateIndex
CREATE INDEX "movimientos_cuentaId_idx" ON "movimientos"("cuentaId");

-- CreateIndex
CREATE INDEX "movimientos_casino_u_origen_idx" ON "movimientos"("casino_u_origen");

-- CreateIndex
CREATE INDEX "movimientos_tipo_movimiento_idx" ON "movimientos"("tipo_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_fecha_idx" ON "movimientos"("fecha");

-- CreateIndex
CREATE INDEX "apuestas_casinoId_idx" ON "apuestas"("casinoId");

-- CreateIndex
CREATE INDEX "apuestas_letra_idx" ON "apuestas"("letra");

-- CreateIndex
CREATE INDEX "apuestas_status_apuesta_idx" ON "apuestas"("status_apuesta");

-- AddForeignKey
ALTER TABLE "casinos" ADD CONSTRAINT "casinos_cobraEnId_fkey" FOREIGN KEY ("cobraEnId") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apuestas" ADD CONSTRAINT "apuestas_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "casinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apuestas" ADD CONSTRAINT "apuestas_apuesta_relacionada_id_fkey" FOREIGN KEY ("apuesta_relacionada_id") REFERENCES "apuestas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
