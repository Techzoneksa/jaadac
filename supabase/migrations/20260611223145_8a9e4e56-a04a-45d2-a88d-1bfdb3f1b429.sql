
-- Phase: Security hardening for scanner findings

-- 1) document_number_sequences: add write policies restricted to owner/accountant.
--    Direct writes are NOT used by application code (only the SECURITY DEFINER
--    _jaad_next_number bypasses RLS), so this only blocks tampering by other roles.
DROP POLICY IF EXISTS document_number_sequences_write ON public.document_number_sequences;
CREATE POLICY document_number_sequences_write
  ON public.document_number_sequences
  FOR ALL
  TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
      OR public.has_role(auth.uid(), tenant_id, 'accountant'::public.app_role)
    )
  )
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
      OR public.has_role(auth.uid(), tenant_id, 'accountant'::public.app_role)
    )
  );

-- 2) attachments: tighten write policy to writer roles only (owner, accountant, sales).
--    Viewer / read-only roles can still SELECT via the existing read policy.
DROP POLICY IF EXISTS attachments_write ON public.attachments;
CREATE POLICY attachments_write
  ON public.attachments
  FOR ALL
  TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
      OR public.has_role(auth.uid(), tenant_id, 'accountant'::public.app_role)
      OR public.has_role(auth.uid(), tenant_id, 'sales'::public.app_role)
    )
  )
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
      OR public.has_role(auth.uid(), tenant_id, 'accountant'::public.app_role)
      OR public.has_role(auth.uid(), tenant_id, 'sales'::public.app_role)
    )
  );

-- 3) Lock down SECURITY DEFINER function execute privileges.
--    Revoke from PUBLIC/anon everywhere; grant authenticated only where the
--    application or RLS policies need it. Internal helpers stay reachable for
--    RLS policy evaluation but are not exposed to anon.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon',
                   r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role',
                   r.proname, r.args);
  END LOOP;
END $$;

-- 4) Function search_path: set immutable search_path on trigger/helper functions
--    that the linter flagged as having a mutable search_path.
ALTER FUNCTION public.touch_updated_at()                  SET search_path = public, pg_temp;
ALTER FUNCTION public._cap_touch_updated_at()             SET search_path = public, pg_temp;
ALTER FUNCTION public.guard_issued_invoice()              SET search_path = public, pg_temp;
ALTER FUNCTION public.guard_issued_invoice_lines()        SET search_path = public, pg_temp;
ALTER FUNCTION public.guard_posted_journal()              SET search_path = public, pg_temp;
ALTER FUNCTION public.guard_posted_journal_lines()        SET search_path = public, pg_temp;
ALTER FUNCTION public.assert_balanced_before_post()       SET search_path = public, pg_temp;
