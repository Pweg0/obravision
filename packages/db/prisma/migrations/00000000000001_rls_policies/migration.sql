-- RLS Policies for tenant-isolated tables
-- Run after Prisma creates the tables via db push or migrate

-- obras table
ALTER TABLE "obras" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "obras"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- obra_statuses table
ALTER TABLE "obra_statuses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "obra_statuses"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- obra_members table
ALTER TABLE "obra_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "obra_members"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- invitations table
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "invitations"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- NOTE: RLS is NOT enabled on:
--   users, accounts, sessions, verification_tokens, leads, empresas, password_reset_tokens
-- These are not tenant-scoped tables (auth + global data).
