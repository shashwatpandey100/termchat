import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../db/schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

function createDb(): DB {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

// Lazy proxy — the real connection is created on first property access,
// by which time Next.js has loaded env vars.
export const db: DB = new Proxy({} as DB, {
  get(_, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
