-- CreateTable rdo_entradas
CREATE TABLE "rdo_entradas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "tarefaId" TEXT,
    "autorId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "texto" TEXT,
    "maoDeObra" JSONB,
    "materiais" JSONB,
    "ocorrencias" TEXT,
    "climaCondicao" TEXT,
    "climaTemp" DOUBLE PRECISION,
    "climaUmidade" DOUBLE PRECISION,
    "climaFonteDado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rdo_entradas_pkey" PRIMARY KEY ("id")
);

-- CreateTable rdo_fotos
CREATE TABLE "rdo_fotos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rdoEntradaId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "legenda" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rdo_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rdo_entradas_obraId_data_key" ON "rdo_entradas"("obraId", "data");
CREATE INDEX "rdo_entradas_obraId_idx" ON "rdo_entradas"("obraId");
CREATE INDEX "rdo_entradas_tarefaId_idx" ON "rdo_entradas"("tarefaId");
CREATE INDEX "rdo_entradas_tenantId_idx" ON "rdo_entradas"("tenantId");
CREATE INDEX "rdo_fotos_rdoEntradaId_idx" ON "rdo_fotos"("rdoEntradaId");
CREATE INDEX "rdo_fotos_tenantId_idx" ON "rdo_fotos"("tenantId");

-- AddForeignKey
ALTER TABLE "rdo_entradas" ADD CONSTRAINT "rdo_entradas_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rdo_entradas" ADD CONSTRAINT "rdo_entradas_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "tarefas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rdo_fotos" ADD CONSTRAINT "rdo_fotos_rdoEntradaId_fkey" FOREIGN KEY ("rdoEntradaId") REFERENCES "rdo_entradas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "rdo_entradas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rdo_fotos" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rdo_entradas
CREATE POLICY "rdo_entradas_tenant_isolation" ON "rdo_entradas"
    USING ("tenantId" = current_setting('app.tenant_id', true))
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- RLS Policies for rdo_fotos
CREATE POLICY "rdo_fotos_tenant_isolation" ON "rdo_fotos"
    USING ("tenantId" = current_setting('app.tenant_id', true))
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
