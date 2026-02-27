"use server";

import { db } from "@/lib/db";
import { rooms } from "@/db/schema";
import { sql } from "drizzle-orm";
import { comparePassword } from "@/lib/password";
import { createRoomToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function joinRoom(formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { error: "Room name and password are required" };
  }

  const room = await db.query.rooms.findFirst({
    where: sql`lower(${rooms.name}) = lower(${name.trim()})`,
  });

  if (!room) {
    return { error: "Room not found. Check the name and try again." };
  }

  const valid = await comparePassword(password, room.passwordHash);
  if (!valid) {
    return { error: "Invalid password." };
  }

  const token = await createRoomToken(room.id);
  const cookieStore = await cookies();
  cookieStore.set(`room-auth-${room.id}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: `/room/${room.id}`,
  });

  redirect(`/room/${room.id}`);
}
