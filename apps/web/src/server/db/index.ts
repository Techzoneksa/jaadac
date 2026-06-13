import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  if (
    url.includes("USER") ||
    url.includes("PASSWORD") ||
    url === "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
  ) {
    throw new Error("DATABASE_URL contains placeholder values — set a real connection string in .env.local");
  }
  return url;
}

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const url = getDbUrl();
    const client = postgres(url, { prepare: false });
    db = drizzle(client);
  }
  return db;
}

export * from "./schema";
