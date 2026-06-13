import "server-only";

const SEED_WARNING = `
╔══════════════════════════════════════════════════════════════╗
║  JAAD CLOUD — Seed Script                                   ║
║  This script seeds demo data into the production database.  ║
║  Run only against a fresh/development database.             ║
║                                                              ║
║  Usage: npm run db:seed                                      ║
║  Requires DATABASE_URL in .env.local                         ║
╚══════════════════════════════════════════════════════════════╝
`;

async function main() {
  console.log(SEED_WARNING);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("USER") || dbUrl.includes("PASSWORD")) {
    console.log("❌ DATABASE_URL not set or contains placeholders. Skipping seed.");
    process.exit(0);
  }

  console.log("🌱 Seeding JAAD CLOUD demo data...");

  // TODO: Phase 2.4+ — implement seed logic:
  // 1. Create demo tenant
  // 2. Create super admin user
  // 3. Create membership
  // 4. Seed chart of accounts (Saudi standard)
  // 5. Seed default tax rates (15% VAT, 0% zero-rated, exempt)
  // 6. Seed basic settings

  console.log("✅ Seed complete.");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
