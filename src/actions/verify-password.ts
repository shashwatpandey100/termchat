"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword } from "@/lib/password";
import { createRoomToken } from "@/lib/auth";

export async function verifyPassword(roomId: string, password: string) {
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) return { error: "Room not found" };

  const valid = await comparePassword(password, room.passwordHash);
  if (!valid) return { error: "Invalid password" };

  const token = await createRoomToken(roomId);
  const cookieStore = await cookies();
  cookieStore.set(`room-auth-${roomId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: `/room/${roomId}`,
  });

  return { success: true };
}
