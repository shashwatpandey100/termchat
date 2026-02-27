"use server";

import { db } from "@/lib/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function checkRoomName(name: string): Promise<{ taken: boolean }> {
  const existing = await db.query.rooms.findFirst({
    where: sql`lower(${rooms.name}) = lower(${name.trim()})`,
  });
  return { taken: !!existing };
}
