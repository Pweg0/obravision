-- Migration: Add tsvector search to SinapiComposicao + RLS policies for all Phase 4 tables
-- Run this AFTER prisma migrate deploy creates the base tables.
-- Execute with: psql $DATABASE_URL < packages/db/prisma/migrations/sinapi_tsvector.sql

-- 1. Add GENERATED tsvector column to SinapiComposicao
ALTER TABLE "SinapiComposicao"
  DROP COLUMN IF EXISTS "searchVec";

ALTER TABLE "SinapiComposicao"
  ADD COLUMN "searchVec" tsvector
    GENERATED ALWAYS AS (
      to_tsvector('portuguese', coalesce("descricao", '') || ' ' || coalesce("codigo", ''))
    ) STORED;

-- 2. GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS sinapi_composicao_search_vec_idx
  ON "SinapiComposicao" USING GIN ("searchVec");

-- 3. Regular index on codigo for fast exact lookup
CREATE INDEX IF NOT EXISTS sinapi_composicao_codigo_idx
  ON "SinapiComposicao" ("codigo");

-- ── RLS policies for Phase 4 tables ─────────────────────────────────────────
-- Pattern: tenantId must match app.current_tenant_id session setting

-- Orcamento
ALTER TABLE "Orcamento" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "Orcamento" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "Orcamento" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "Orcamento" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "Orcamento" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- OrcamentoEtapa
ALTER TABLE "OrcamentoEtapa" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "OrcamentoEtapa" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "OrcamentoEtapa" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "OrcamentoEtapa" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "OrcamentoEtapa" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- OrcamentoItem
ALTER TABLE "OrcamentoItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "OrcamentoItem" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "OrcamentoItem" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "OrcamentoItem" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "OrcamentoItem" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- SinapiComposicao (read-only for tenants, write only via seed script with superuser)
ALTER TABLE "SinapiComposicao" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_all" ON "SinapiComposicao" FOR SELECT
  TO PUBLIC USING (true);

-- Fornecedor
ALTER TABLE "Fornecedor" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "Fornecedor" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "Fornecedor" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "Fornecedor" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "Fornecedor" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- CompraRequisicao
ALTER TABLE "CompraRequisicao" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "CompraRequisicao" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "CompraRequisicao" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "CompraRequisicao" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "CompraRequisicao" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- CompraCotacao
ALTER TABLE "CompraCotacao" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "CompraCotacao" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "CompraCotacao" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "CompraCotacao" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "CompraCotacao" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- CompraPedido
ALTER TABLE "CompraPedido" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "CompraPedido" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "CompraPedido" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "CompraPedido" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "CompraPedido" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- CompraPedidoItem
ALTER TABLE "CompraPedidoItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "CompraPedidoItem" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "CompraPedidoItem" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "CompraPedidoItem" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "CompraPedidoItem" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- Deposito
ALTER TABLE "Deposito" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "Deposito" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "Deposito" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "Deposito" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "Deposito" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- MovimentacaoEstoque
ALTER TABLE "MovimentacaoEstoque" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "MovimentacaoEstoque" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "MovimentacaoEstoque" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "MovimentacaoEstoque" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- MedicaoFisica
ALTER TABLE "MedicaoFisica" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "MedicaoFisica" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "MedicaoFisica" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "MedicaoFisica" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "MedicaoFisica" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- MedicaoFisicaItem
ALTER TABLE "MedicaoFisicaItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "MedicaoFisicaItem" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "MedicaoFisicaItem" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "MedicaoFisicaItem" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "MedicaoFisicaItem" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- MedicaoContrato
ALTER TABLE "MedicaoContrato" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "MedicaoContrato" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "MedicaoContrato" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "MedicaoContrato" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "MedicaoContrato" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

-- MedicaoContratoItem
ALTER TABLE "MedicaoContratoItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON "MedicaoContratoItem" FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_insert" ON "MedicaoContratoItem" FOR INSERT
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_update" ON "MedicaoContratoItem" FOR UPDATE
  USING ("tenantId" = current_setting('app.current_tenant_id'));

CREATE POLICY "tenant_delete" ON "MedicaoContratoItem" FOR DELETE
  USING ("tenantId" = current_setting('app.current_tenant_id'));
