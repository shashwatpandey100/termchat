import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getAblyServer } from "@/lib/ably-server";

export async function POST(request: Request) {
  const { roomId, senderName } = await request.json();

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.roomId, roomId))
    .orderBy(asc(messages.createdAt))
    .limit(50);

  const [joinMsg] = await db
    .insert(messages)
    .values({
      roomId,
      senderName: "[system]",
      content: `${senderName} has joined`,
    })
    .returning();

  const ably = getAblyServer();
  await ably.channels.get(`room:${roomId}`).publish("new-message", joinMsg);

  return NextResponse.json({ history });
}
