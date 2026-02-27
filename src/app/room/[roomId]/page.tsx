import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyRoomToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Chat } from "./chat";
import { PasswordPrompt } from "@/components/password-prompt";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(`room-auth-${roomId}`)?.value;
  const isAuthed = token ? await verifyRoomToken(token, roomId) : false;

  if (!isAuthed) {
    return <PasswordPrompt roomId={roomId} roomName={room.name} />;
  }

  return <Chat roomId={roomId} roomName={room.name} />;
}
