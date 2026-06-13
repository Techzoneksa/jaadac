-- ============================================================================
-- JAAD CLOUD — Phase 1.7.1 — Tenant Bootstrap (runnable migration)
-- ============================================================================
-- Promoted from supabase/planned-migrations/004_tenant_bootstrap.sql.
-- Hardened: SECURITY DEFINER, locked search_path, auth.uid() validation,
-- duplicate-bootstrap protection per (user, name_en).
-- Demo mode does NOT call this RPC.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_default_chart_of_accounts(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_tenant_id IS NULL THEN RAISE EXCEPTION 'p_tenant_id is required'; END IF;
  INSERT INTO public.accounts (tenant_id, code, name_ar, name_en, type, is_system)
  VALUES
    (p_tenant_id, '1000', 'الأصول',               'Assets',      'asset',     true),
    (p_tenant_id, '1100', 'النقدية والبنوك',       'Cash & Bank', 'asset',     true),
    (p_tenant_id, '1200', 'العملاء',               'Receivables', 'asset',     true),
    (p_tenant_id, '2000', 'الالتزامات',           'Liabilities', 'liability', true),
    (p_tenant_id, '2100', 'الموردون',              'Payables',    'liability', true),
    (p_tenant_id, '2200', 'ضريبة القيمة المضافة',  'VAT Payable', 'liability', true),
    (p_tenant_id, '3000', 'حقوق الملكية',         'Equity',      'equity',    true),
    (p_tenant_id, '4000', 'الإيرادات',             'Revenue',     'revenue',   true),
    (p_tenant_id, '5000', 'المصروفات',             'Expenses',    'expense',   true)
  ON CONFLICT DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.create_default_chart_accounts(p_tenant_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT public.seed_default_chart_of_accounts(p_tenant_id); $$;

CREATE OR REPLACE FUNCTION public.create_default_settings(
  p_tenant_id uuid,
  p_vat_rate  numeric DEFAULT 0.15,
  p_currency  text    DEFAULT 'SAR',
  p_locale    text    DEFAULT 'ar'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_tenant_id IS NULL THEN RAISE EXCEPTION 'p_tenant_id is required'; END IF;
  INSERT INTO public.tenant_settings (tenant_id, vat_rate, default_currency, locale)
  VALUES (p_tenant_id, p_vat_rate, p_currency, p_locale)
  ON CONFLICT (tenant_id) DO NOTHING;
  INSERT INTO public.numbering_settings (tenant_id, doc_type, prefix, next_number)
  VALUES
    (p_tenant_id, 'invoice',   'INV-', 1),
    (p_tenant_id, 'quotation', 'QUO-', 1),
    (p_tenant_id, 'receipt',   'REC-', 1),
    (p_tenant_id, 'payment',   'PAY-', 1)
  ON CONFLICT DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_profile_for_auth_user(
  p_user_id uuid, p_full_name text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'p_user_id is required'; END IF;
  INSERT INTO public.profiles (id, full_name) VALUES (p_user_id, p_full_name)
  ON CONFLICT (id) DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.bootstrap_tenant_for_user(
  p_user_id  uuid,
  p_name_ar  text,
  p_name_en  text,
  p_currency text DEFAULT 'SAR',
  p_vat_rate numeric DEFAULT 0.15,
  p_locale   text DEFAULT 'ar'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_id uuid;
  v_caller    uuid;
  v_existing  uuid;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'p_user_id is required'; END IF;
  IF coalesce(trim(p_name_en), '') = '' OR coalesce(trim(p_name_ar), '') = '' THEN
    RAISE EXCEPTION 'tenant name (ar/en) is required';
  END IF;

  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is required to bootstrap a tenant';
  END IF;
  IF v_caller <> p_user_id THEN
    RAISE EXCEPTION 'caller cannot bootstrap a tenant for another user';
  END IF;

  SELECT t.id INTO v_existing
  FROM public.tenants t
  JOIN public.user_roles ur
    ON ur.tenant_id = t.id AND ur.user_id = p_user_id AND ur.role = 'owner'::app_role
  WHERE t.name_en = p_name_en
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('tenant_id', v_existing, 'ok', true, 'reused', true);
  END IF;

  INSERT INTO public.tenants (name_ar, name_en, default_currency, locale)
  VALUES (p_name_ar, p_name_en, p_currency, p_locale)
  RETURNING id INTO v_tenant_id;

  PERFORM public.ensure_profile_for_auth_user(p_user_id, COALESCE(p_name_en, p_name_ar));

  INSERT INTO public.user_tenants (user_id, tenant_id)
  VALUES (p_user_id, v_tenant_id) ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, v_tenant_id, 'owner'::app_role) ON CONFLICT DO NOTHING;

  PERFORM public.create_default_settings(v_tenant_id, p_vat_rate, p_currency, p_locale);
  PERFORM public.create_default_chart_accounts(v_tenant_id);

  INSERT INTO public.audit_logs (tenant_id, user_id, action, entity_type, description_ar, description_en)
  VALUES (v_tenant_id, p_user_id, 'tenant.bootstrap', 'tenant',
          'تجهيز المؤسسة الأولية', 'Initial tenant bootstrap');

  RETURN jsonb_build_object('tenant_id', v_tenant_id, 'ok', true, 'reused', false);
END; $$;

REVOKE ALL ON FUNCTION public.bootstrap_tenant_for_user(uuid, text, text, text, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.bootstrap_tenant_for_user(uuid, text, text, text, numeric, text) TO authenticated;
REVOKE ALL ON FUNCTION public.create_default_settings(uuid, numeric, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_default_settings(uuid, numeric, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.create_default_chart_accounts(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_default_chart_accounts(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.ensure_profile_for_auth_user(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_auth_user(uuid, text) TO authenticated;
