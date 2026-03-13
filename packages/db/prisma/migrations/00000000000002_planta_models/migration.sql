-- RLS Policies for planta-related tenant-isolated tables
-- Run after Prisma creates the tables via db push or migrate

-- plantas table
ALTER TABLE "plantas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "plantas"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- planta_revisaos table
ALTER TABLE "planta_revisaos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "planta_revisaos"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- pins table
ALTER TABLE "pins" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "pins"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- threads table
ALTER TABLE "threads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "threads"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- thread_messages table
ALTER TABLE "thread_messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "thread_messages"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);

-- notifications table
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "notifications"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);
