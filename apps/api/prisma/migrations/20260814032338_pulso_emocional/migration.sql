-- CreateEnum
CREATE TYPE "TipoPreguntaEmocional" AS ENUM ('SELECCION_UNICA', 'ESCALA');

-- CreateEnum
CREATE TYPE "NivelRiesgoRespuesta" AS ENUM ('NINGUNO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "EstadoSesionEmocional" AS ENUM ('EN_CURSO', 'COMPLETADA', 'ABANDONADA');

-- CreateEnum
CREATE TYPE "TipoIntervencionEmocional" AS ENUM ('RESPIRACION', 'PAUSA', 'GROUNDING', 'MOVIMIENTO', 'DISTANCIAMIENTO', 'DISTRACCION', 'COMUNICACION', 'CONTACTO');

-- CreateEnum
CREATE TYPE "EstadoEnvioTsq8" AS ENUM ('PENDIENTE', 'ENLACE_GENERADO', 'ERROR');

-- AlterTable
ALTER TABLE "PrivacySettings" ADD COLUMN     "locationPermissionGranted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Emocion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "icono" TEXT NOT NULL,
    "colorBase" TEXT NOT NULL,
    "tecnicasRapidas" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emocion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NivelEmocional" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "intensidadMinima" INTEGER NOT NULL,
    "intensidadMaxima" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NivelEmocional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreguntaEmocional" (
    "id" TEXT NOT NULL,
    "emocionId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoPreguntaEmocional" NOT NULL DEFAULT 'SELECCION_UNICA',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PreguntaEmocional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaEmocional" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "siguientePreguntaId" TEXT,
    "siguienteEmocionId" TEXT,
    "nivelRiesgo" "NivelRiesgoRespuesta" NOT NULL DEFAULT 'NINGUNO',
    "accion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RespuestaEmocional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesionEmocional" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emocionInicialId" TEXT NOT NULL,
    "intensidadInicial" INTEGER NOT NULL,
    "emocionFinalId" TEXT,
    "intensidadFinal" INTEGER,
    "nivelFinal" INTEGER,
    "banderaSeguridad" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoSesionEmocional" NOT NULL DEFAULT 'EN_CURSO',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),

    CONSTRAINT "SesionEmocional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaSesion" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "respuestaId" TEXT NOT NULL,
    "respondidaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaSesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervencion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoIntervencionEmocional" NOT NULL,
    "duracionSegundos" INTEGER,
    "nivelMinimo" INTEGER NOT NULL DEFAULT 1,
    "nivelMaximo" INTEGER NOT NULL DEFAULT 4,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Intervencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AplicacionIntervencion" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "intervencionId" TEXT NOT NULL,
    "intensidadAntes" INTEGER NOT NULL,
    "intensidadDespues" INTEGER,
    "resultado" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AplicacionIntervencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroEmocionalDiario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "emocionPredominanteId" TEXT,
    "color" TEXT,
    "intensidadMaxima" INTEGER NOT NULL DEFAULT 0,
    "intensidadPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadEventos" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroEmocionalDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tsq8Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sesionId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "mensaje" TEXT NOT NULL,
    "estadoEnvio" "EstadoEnvioTsq8" NOT NULL DEFAULT 'PENDIENTE',
    "whatsappMessageId" TEXT,
    "fechaEnvio" TIMESTAMP(3),

    CONSTRAINT "Tsq8Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Emocion_nombre_key" ON "Emocion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "NivelEmocional_nombre_key" ON "NivelEmocional"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "NivelEmocional_nivel_key" ON "NivelEmocional"("nivel");

-- CreateIndex
CREATE UNIQUE INDEX "PreguntaEmocional_emocionId_nivel_orden_key" ON "PreguntaEmocional"("emocionId", "nivel", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaEmocional_preguntaId_orden_key" ON "RespuestaEmocional"("preguntaId", "orden");

-- CreateIndex
CREATE INDEX "SesionEmocional_userId_fechaInicio_idx" ON "SesionEmocional"("userId", "fechaInicio");

-- CreateIndex
CREATE INDEX "RespuestaSesion_sesionId_idx" ON "RespuestaSesion"("sesionId");

-- CreateIndex
CREATE UNIQUE INDEX "Intervencion_nombre_key" ON "Intervencion"("nombre");

-- CreateIndex
CREATE INDEX "AplicacionIntervencion_sesionId_idx" ON "AplicacionIntervencion"("sesionId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroEmocionalDiario_userId_fecha_key" ON "RegistroEmocionalDiario"("userId", "fecha");

-- CreateIndex
CREATE INDEX "Tsq8Event_userId_fecha_idx" ON "Tsq8Event"("userId", "fecha");

-- AddForeignKey
ALTER TABLE "PreguntaEmocional" ADD CONSTRAINT "PreguntaEmocional_emocionId_fkey" FOREIGN KEY ("emocionId") REFERENCES "Emocion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaEmocional" ADD CONSTRAINT "RespuestaEmocional_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaEmocional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaEmocional" ADD CONSTRAINT "RespuestaEmocional_siguientePreguntaId_fkey" FOREIGN KEY ("siguientePreguntaId") REFERENCES "PreguntaEmocional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaEmocional" ADD CONSTRAINT "RespuestaEmocional_siguienteEmocionId_fkey" FOREIGN KEY ("siguienteEmocionId") REFERENCES "Emocion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionEmocional" ADD CONSTRAINT "SesionEmocional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionEmocional" ADD CONSTRAINT "SesionEmocional_emocionInicialId_fkey" FOREIGN KEY ("emocionInicialId") REFERENCES "Emocion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionEmocional" ADD CONSTRAINT "SesionEmocional_emocionFinalId_fkey" FOREIGN KEY ("emocionFinalId") REFERENCES "Emocion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaSesion" ADD CONSTRAINT "RespuestaSesion_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionEmocional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaSesion" ADD CONSTRAINT "RespuestaSesion_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaEmocional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaSesion" ADD CONSTRAINT "RespuestaSesion_respuestaId_fkey" FOREIGN KEY ("respuestaId") REFERENCES "RespuestaEmocional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionIntervencion" ADD CONSTRAINT "AplicacionIntervencion_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionEmocional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionIntervencion" ADD CONSTRAINT "AplicacionIntervencion_intervencionId_fkey" FOREIGN KEY ("intervencionId") REFERENCES "Intervencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroEmocionalDiario" ADD CONSTRAINT "RegistroEmocionalDiario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroEmocionalDiario" ADD CONSTRAINT "RegistroEmocionalDiario_emocionPredominanteId_fkey" FOREIGN KEY ("emocionPredominanteId") REFERENCES "Emocion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tsq8Event" ADD CONSTRAINT "Tsq8Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tsq8Event" ADD CONSTRAINT "Tsq8Event_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionEmocional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
