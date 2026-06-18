import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

// Full Saudi chart of accounts — hierarchical
const SEED_ACCOUNTS = [
  // === 1 الأصول ===
  { number: "1", name_ar: "الأصول", type: "assets", kind: "header", is_system: true, cash_flow: "none" },
  { number: "11", name_ar: "الأصول المتداولة", type: "assets", kind: "group", parent_number: "1", is_system: true, cash_flow: "none" },
  { number: "111", name_ar: "النقد وما يعادله", type: "assets", kind: "group", parent_number: "11", cash_flow: "operating", expense_claim_category: "النقد وما يعادله" },
  { number: "1111", name_ar: "الخزينة", type: "assets", kind: "posting", parent_number: "111", cash_flow: "cash", payment_enabled: true, purpose: "cash" },
  { number: "1112", name_ar: "المصروفات النثرية", type: "assets", kind: "posting", parent_number: "111", cash_flow: "cash", payment_enabled: true },
  { number: "1113", name_ar: "الحساب البنكي", type: "assets", kind: "posting", parent_number: "111", cash_flow: "cash", payment_enabled: true, purpose: "bank" },
  { number: "112", name_ar: "العملاء", type: "assets", kind: "posting", parent_number: "11", is_system: true, cash_flow: "operating", purpose: "receivables", expense_claim_category: "العملاء" },
  { number: "113", name_ar: "سلف الموظفين", type: "assets", kind: "posting", parent_number: "11", cash_flow: "operating" },
  { number: "114", name_ar: "مصروفات مدفوعة مقدمًا", type: "assets", kind: "posting", parent_number: "11", cash_flow: "operating" },
  { number: "115", name_ar: "إدارة المخزون", type: "assets", kind: "group", parent_number: "11", cash_flow: "operating" },
  { number: "1151", name_ar: "المستودع الرئيسي", type: "assets", kind: "posting", parent_number: "115", cash_flow: "operating", purpose: "inventory" },
  { number: "12", name_ar: "الأصول غير المتداولة", type: "assets", kind: "group", parent_number: "1", cash_flow: "none" },
  { number: "121", name_ar: "الأصول الثابتة", type: "assets", kind: "group", parent_number: "12", cash_flow: "investing" },
  { number: "1211", name_ar: "آلات ومعدات", type: "assets", kind: "posting", parent_number: "121", cash_flow: "investing" },
  { number: "1212", name_ar: "مجمع الإهلاك التراكمي", type: "assets", kind: "posting", parent_number: "121", cash_flow: "investing" },

  // === 2 الالتزامات ===
  { number: "2", name_ar: "الالتزامات", type: "liabilities", kind: "header", is_system: true, cash_flow: "none" },
  { number: "21", name_ar: "الالتزامات المتداولة", type: "liabilities", kind: "group", parent_number: "2", cash_flow: "none" },
  { number: "211", name_ar: "الموردون", type: "liabilities", kind: "posting", parent_number: "21", is_system: true, cash_flow: "operating", purpose: "payables", expense_claim_category: "الموردين" },
  { number: "212", name_ar: "ضريبة القيمة المضافة", type: "liabilities", kind: "posting", parent_number: "21", is_system: true, cash_flow: "operating", purpose: "vat", expense_claim_category: "القيمة المضافة" },
  { number: "213", name_ar: "إيراد غير مكتسب", type: "liabilities", kind: "posting", parent_number: "21", cash_flow: "operating" },
  { number: "214", name_ar: "رواتب مستحقة غير مدفوعة", type: "liabilities", kind: "posting", parent_number: "21", cash_flow: "operating" },
  { number: "215", name_ar: "مكافآت نهاية الخدمة", type: "liabilities", kind: "posting", parent_number: "21", cash_flow: "operating" },
  { number: "216", name_ar: "قرض من المالك", type: "liabilities", kind: "posting", parent_number: "21", cash_flow: "financing" },
  { number: "217", name_ar: "تعويضات الموظفين", type: "liabilities", kind: "posting", parent_number: "21", cash_flow: "operating" },
  { number: "218", name_ar: "زكاة مستحقة الدفع", type: "liabilities", kind: "posting", parent_number: "21", cash_flow: "operating" },
  { number: "219", name_ar: "ضريبة السلع الانتقائية المستحقة", type: "liabilities", kind: "posting", parent_number: "21", cash_flow: "operating" },
  { number: "22", name_ar: "الالتزامات غير المتداولة", type: "liabilities", kind: "group", parent_number: "2", cash_flow: "none" },

  // === 3 حقوق الملكية ===
  { number: "3", name_ar: "حقوق الملكية", type: "equity", kind: "header", is_system: true, cash_flow: "none" },
  { number: "31", name_ar: "حقوق ملكية من رصيد افتتاحي", type: "equity", kind: "group", parent_number: "3", cash_flow: "none" },
  { number: "311", name_ar: "إزاحة الرصيد الافتتاحي", type: "equity", kind: "posting", parent_number: "31", is_system: true, cash_flow: "none" },
  { number: "32", name_ar: "حقوق ملكية المالك", type: "equity", kind: "group", parent_number: "3", cash_flow: "financing" },
  { number: "321", name_ar: "رأس المال", type: "equity", kind: "posting", parent_number: "32", is_system: true, cash_flow: "financing", expense_claim_category: "رأس المال" },
  { number: "322", name_ar: "المسحوبات", type: "equity", kind: "posting", parent_number: "32", cash_flow: "financing" },
  { number: "33", name_ar: "الأرباح المحتجزة", type: "equity", kind: "group", parent_number: "3", cash_flow: "none" },
  { number: "331", name_ar: "الأرباح المحتجزة", type: "equity", kind: "posting", parent_number: "33", is_system: true, cash_flow: "none", expense_claim_category: "الأرباح المحتجزة" },
  { number: "34", name_ar: "الدخل الشامل الآخر المتراكم", type: "equity", kind: "group", parent_number: "3", cash_flow: "none" },
  { number: "341", name_ar: "أرباح وخسائر غير محققة متراكمة", type: "equity", kind: "posting", parent_number: "34", cash_flow: "none" },
  { number: "35", name_ar: "رأس المال الإضافي المدفوع", type: "equity", kind: "posting", parent_number: "3", cash_flow: "financing" },

  // === 4 الإيراد ===
  { number: "4", name_ar: "الإيرادات", type: "revenue", kind: "header", is_system: true, cash_flow: "none" },
  { number: "41", name_ar: "دخل", type: "revenue", kind: "group", parent_number: "4", cash_flow: "operating" },
  { number: "411", name_ar: "مبيعات أخرى", type: "revenue", kind: "posting", parent_number: "41", cash_flow: "operating", purpose: "sales" },
  { number: "412", name_ar: "خصم", type: "revenue", kind: "posting", parent_number: "41", cash_flow: "operating" },
  { number: "413", name_ar: "إيرادات خدمات تسويق", type: "revenue", kind: "posting", parent_number: "41", cash_flow: "operating" },
  { number: "414", name_ar: "خدمات تصميم جرافيكي", type: "revenue", kind: "posting", parent_number: "41", cash_flow: "operating" },
  { number: "415", name_ar: "إيرادات إعلانات", type: "revenue", kind: "posting", parent_number: "41", cash_flow: "operating" },
  { number: "416", name_ar: "إيرادات تطوير البرمجيات", type: "revenue", kind: "posting", parent_number: "41", cash_flow: "operating" },
  { number: "417", name_ar: "إيرادات الطباعة والتعبئة والتغليف", type: "revenue", kind: "posting", parent_number: "41", cash_flow: "operating" },
  { number: "42", name_ar: "إيرادات أخرى", type: "revenue", kind: "posting", parent_number: "4", cash_flow: "operating" },

  // === 5 المصروفات ===
  { number: "5", name_ar: "المصروفات", type: "expenses", kind: "header", is_system: true, cash_flow: "none" },
  { number: "51", name_ar: "تكاليف المبيعات", type: "expenses", kind: "group", parent_number: "5", cash_flow: "operating" },
  { number: "511", name_ar: "تكلفة البضاعة المباعة", type: "expenses", kind: "posting", parent_number: "51", cash_flow: "operating", purpose: "cogs" },
  { number: "52", name_ar: "المصروفات التشغيلية", type: "expenses", kind: "group", parent_number: "5", cash_flow: "operating", expense_claim_category: "المصروفات العامة والإدارية" },
  { number: "521", name_ar: "اللوازم المكتبية", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "5211", name_ar: "دين معدوم", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "5212", name_ar: "رواتب وأجور الموظفين", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "5213", name_ar: "الوجبات والترفيه", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "522", name_ar: "الإصلاحات والصيانة", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "523", name_ar: "الإعلان والتسويق", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "524", name_ar: "الرسوم الإضافية البنكية والمصاريف", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "525", name_ar: "رسوم بطاقات الائتمان", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "526", name_ar: "تكاليف السفر", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "527", name_ar: "مصروفات الهاتف", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "528", name_ar: "البرامج والأدوات", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "529", name_ar: "مصروف الإيجار", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "5210", name_ar: "مصروفات الماء والكهرباء", type: "expenses", kind: "posting", parent_number: "52", cash_flow: "operating" },
  { number: "53", name_ar: "المصروفات غير التشغيلية", type: "expenses", kind: "group", parent_number: "5", cash_flow: "operating" },
  { number: "531", name_ar: "خسارة أو ربح في صرف العملات", type: "expenses", kind: "posting", parent_number: "53", cash_flow: "operating" },
  { number: "532", name_ar: "أرباح وخسائر غير محققة", type: "expenses", kind: "posting", parent_number: "53", cash_flow: "operating" },
  { number: "533", name_ar: "غير مصنف", type: "expenses", kind: "posting", parent_number: "53", cash_flow: "operating" },
  { number: "534", name_ar: "مصاريف الإهلاك", type: "expenses", kind: "posting", parent_number: "53", cash_flow: "operating" },
  { number: "535", name_ar: "المصاريف الأخرى", type: "expenses", kind: "posting", parent_number: "53", cash_flow: "operating" },
];

export async function POST() {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if accounts already exist for this tenant
    const { count } = await supabase.from("accounts").select("id", { count: "exact", head: true }).eq("tenant_id", user.id);
    if (count && count > 0) {
      return NextResponse.json({ message: "Accounts already exist", count });
    }

    const uid = user.id;
    const idMap: Record<string, string> = {};

    // First pass: insert all accounts without parent (we'll map parent by number)
    const inserted: Array<{ id: string; number: string }> = [];

    for (const acc of SEED_ACCOUNTS) {
      const { parent_number, ...insertData } = acc;
      const { data, error } = await supabase.from("accounts").insert({
        ...insertData,
        tenant_id: uid,
        status: "active",
        payment_enabled: insertData.payment_enabled || false,
        is_system: insertData.is_system || false,
      }).select("id,number").single();

      if (error) {
        // If duplicate number, skip
        if (error.code === "23505") continue;
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      inserted.push({ id: data!.id, number: acc.number });
      idMap[acc.number] = data!.id;
    }

    // Second pass: update parent references
    for (const acc of SEED_ACCOUNTS) {
      if (acc.parent_number && idMap[acc.number]) {
        const parentId = idMap[acc.parent_number];
        if (parentId) {
          await supabase.from("accounts").update({ parent: parentId }).eq("id", idMap[acc.number]);
        }
      }
    }

    return NextResponse.json({ success: true, count: inserted.length });
  });
}
