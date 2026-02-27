import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/db/schema";
import { getAblyServer } from "@/lib/ably-server";

export async function POST(request: Request) {
  const { roomId, senderName } = await request.json();

  const [leaveMsg] = await db
    .insert(messages)
    .values({
      roomId,
      senderName: "[system]",
      content: `${senderName} has left`,
    })
    .returning();

  const ably = getAblyServer();
  await ably.channels.get(`room:${roomId}`).publish("new-message", leaveMsg);

  return NextResponse.json(leaveMsg);
}
