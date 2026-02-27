import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../db/schema";

neonConfig.webSocketConstructor = ws;

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

function createDb(): DB {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(pool, { schema });
}

// Lazy proxy — the real Pool is created on first property access,
// by which time dotenv/Next.js has loaded env vars.
export const db: DB = new Proxy({} as DB, {
  get(_, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
