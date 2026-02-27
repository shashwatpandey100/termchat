"use server";

import { db } from "@/lib/db";
import { rooms } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";

export async function createRoom(formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { error: "Room name and password are required" };
  }

  const existing = await db.query.rooms.findFirst({
    where: sql`lower(${rooms.name}) = lower(${name.trim()})`,
  });

  if (existing) {
    return { error: "Room name unavailable, choose another." };
  }

  const passwordHash = await hashPassword(password);

  const [room] = await db
    .insert(rooms)
    .values({ name: name.trim(), passwordHash })
    .returning();

  redirect(`/room/${room.id}`);
}
