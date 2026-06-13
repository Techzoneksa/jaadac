-- ============================================================================
-- JAAD CLOUD — Phase 1.7 — Planned Tenant Bootstrap RPC
-- ============================================================================
-- This SQL is a planned migration. It will be applied via the Supabase
-- migration tool once Lovable Cloud / Supabase is enabled. Placed here to
-- keep the source of truth visible while DATA_MODE remains "demo".
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_default_chart_of_accounts(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (tenant_id, code, name_ar, name_en, type, is_system)
  VALUES
    (p_tenant_id, '1000', 'الأصول',         'Assets',      'asset',     true),
    (p_tenant_id, '1100', 'النقدية والبنوك', 'Cash & Bank', 'asset',     true),
    (p_tenant_id, '1200', 'العملاء',         'Receivables', 'asset',     true),
    (p_tenant_id, '2000', 'الالتزامات',     'Liabilities', 'liability', true),
    (p_tenant_id, '2100', 'الموردون',        'Payables',    'liability', true),
    (p_tenant_id, '2200', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', true),
    (p_tenant_id, '3000', 'حقوق الملكية',   'Equity',      'equity',    true),
    (p_tenant_id, '4000', 'الإيرادات',       'Revenue',     'revenue',   true),
    (p_tenant_id, '5000', 'المصروفات',       'Expenses',    'expense',   true)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_tenant_for_user(
  p_user_id   uuid,
  p_name_ar   text,
  p_name_en   text,
  p_currency  text DEFAULT 'SAR',
  p_vat_rate  numeric DEFAULT 0.15,
  p_locale    text DEFAULT 'ar'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  INSERT INTO public.tenants (name_ar, name_en, default_currency, locale)
  VALUES (p_name_ar, p_name_en, p_currency, p_locale)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.profiles (id, full_name)
  VALUES (p_user_id, COALESCE(p_name_en, p_name_ar))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_tenants (user_id, tenant_id)
  VALUES (p_user_id, v_tenant_id) ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, v_tenant_id, 'owner'::app_role) ON CONFLICT DO NOTHING;

  INSERT INTO public.tenant_settings (tenant_id, vat_rate, default_currency, locale)
  VALUES (v_tenant_id, p_vat_rate, p_currency, p_locale)
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO public.numbering_settings (tenant_id, doc_type, prefix, next_number)
  VALUES
    (v_tenant_id, 'invoice',    'INV-', 1),
    (v_tenant_id, 'quotation',  'QUO-', 1),
    (v_tenant_id, 'receipt',    'REC-', 1),
    (v_tenant_id, 'payment',    'PAY-', 1)
  ON CONFLICT DO NOTHING;

  PERFORM public.seed_default_chart_of_accounts(v_tenant_id);

  INSERT INTO public.audit_logs (tenant_id, user_id, action, entity_type, description_ar, description_en)
  VALUES (v_tenant_id, p_user_id, 'tenant.bootstrap', 'tenant',
          'تجهيز المؤسسة الأولية', 'Initial tenant bootstrap');

  RETURN jsonb_build_object('tenant_id', v_tenant_id, 'ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_tenant_for_user(uuid, text, text, text, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.bootstrap_tenant_for_user(uuid, text, text, text, numeric, text) TO authenticated;
