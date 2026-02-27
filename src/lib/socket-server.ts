import { Server } from "socket.io";
import { db } from "./db";
import { messages } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/socket-events";

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
) {
  io.on("connection", (socket) => {
    socket.on("join-room", async ({ roomId, senderName }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.senderName = senderName;

      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.roomId, roomId))
        .orderBy(asc(messages.createdAt))
        .limit(50);

      socket.emit("message-history", history);

      // Persist join event to DB and broadcast
      const [joinMsg] = await db
        .insert(messages)
        .values({
          roomId,
          senderName: "[system]",
          content: `${senderName} has joined`,
        })
        .returning();
      socket.to(roomId).emit("new-message", joinMsg);
    });

    socket.on("send-message", async ({ roomId, senderName, content, fileUrl }) => {
      const [saved] = await db
        .insert(messages)
        .values({ roomId, senderName, content, fileUrl: fileUrl ?? null })
        .returning();

      io.to(roomId).emit("new-message", saved);
    });

    socket.on("disconnect", async () => {
      if (socket.data.roomId && socket.data.senderName) {
        // Persist leave event to DB and broadcast
        const [leaveMsg] = await db
          .insert(messages)
          .values({
            roomId: socket.data.roomId,
            senderName: "[system]",
            content: `${socket.data.senderName} has left`,
          })
          .returning();
        socket.to(socket.data.roomId).emit("new-message", leaveMsg);
      }
    });
  });
}
