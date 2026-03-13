-- Phase 3: Cronograma models — Etapa and Tarefa
-- Run after applying schema changes via: pnpm --filter @obravision/db exec prisma db push

-- etapas table
ALTER TABLE "etapas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "etapas"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- tarefas table
ALTER TABLE "tarefas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "tarefas"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- NOTE: obras table already has RLS from migration 00000000000001_rls_policies
-- lat/lon columns are added to obras table via db push — no RLS change needed
