import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/db/schema";
import { getAblyServer } from "@/lib/ably-server";

export async function POST(request: Request) {
  const { roomId, senderName, content, fileUrl } = await request.json();

  const [saved] = await db
    .insert(messages)
    .values({ roomId, senderName, content, fileUrl: fileUrl ?? null })
    .returning();

  const ably = getAblyServer();
  await ably.channels.get(`room:${roomId}`).publish("new-message", saved);

  return NextResponse.json(saved);
}
