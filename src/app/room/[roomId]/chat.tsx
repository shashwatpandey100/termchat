"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { TerminalWindow } from "@/components/terminal-window";
import { TerminalInput } from "@/components/terminal-input";
import type { Message } from "@/db/schema";

interface SystemMessage {
  type: "system";
  id: string;
  content: string;
  createdAt: Date;
}

type ChatEntry = (Message & { type?: "message" }) | SystemMessage;

function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url);
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export function Chat({ roomId, roomName }: { roomId: string; roomName: string }) {
  const [nickname, setNicknameRaw] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    type: "image" | "video";
    name: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore saved nickname after hydration
  useEffect(() => {
    const saved = sessionStorage.getItem(`termchat-nick-${roomId}`);
    if (saved) setNicknameRaw(saved);
  }, [roomId]);

  function setNickname(name: string) {
    sessionStorage.setItem(`termchat-nick-${roomId}`, name);
    setNicknameRaw(name);
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [entries, preview, scrollToBottom]);

  useEffect(() => {
    if (!nickname) return;

    const socket = getSocket();
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", { roomId, senderName: nickname });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("message-history", (messages) => {
      setEntries(messages.map((m) => ({ ...m, type: "message" as const })));
    });

    socket.on("new-message", (message) => {
      setEntries((prev) => [...prev, { ...message, type: "message" }]);
    });

    // Join/leave events are now persisted to DB and arrive via "new-message"

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, [nickname, roomId]);

  async function handleFileUpload(file: File) {
    const sysId = `sys-${Date.now()}-uploading`;
    setEntries((prev) => [
      ...prev,
      {
        type: "system",
        id: sysId,
        content: `Uploading ${file.name}...`,
        createdAt: new Date(),
      },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Remove the "Uploading..." message
      setEntries((prev) => prev.filter((e) => !("id" in e && e.id === sysId)));

      const socket = getSocket();
      socket.emit("send-message", {
        roomId,
        senderName: nickname,
        content: file.name,
        fileUrl: data.url,
      });
    } catch {
      setEntries((prev) => prev.map((e) => ("id" in e && e.id === sysId ? { ...e, content: `Upload failed: ${file.name}` } : e)));
    }
  }

  function handleCommand(value: string) {
    const trimmed = value.trim();

    if (trimmed === "/upload") {
      fileInputRef.current?.click();
      return true;
    }

    if (trimmed === "/copy") {
      navigator.clipboard.writeText(window.location.href);
      setEntries((prev) => [
        ...prev,
        {
          type: "system",
          id: `sys-${Date.now()}-copy`,
          content: "Link copied to clipboard.",
          createdAt: new Date(),
        },
      ]);
      return true;
    }

    if (trimmed === "/clear") {
      setEntries([]);
      return true;
    }

    if (trimmed === "/close") {
      setPreview(null);
      return true;
    }

    if (trimmed === "/help") {
      setEntries((prev) => [
        ...prev,
        {
          type: "system",
          id: `sys-${Date.now()}-help`,
          content: "/upload — send a file  |  /copy — copy room link  |  /clear — clear screen  |  /close — close preview  |  /help — show commands",
          createdAt: new Date(),
        },
      ]);
      return true;
    }

    return false;
  }

  function handleSend() {
    if (!input.trim()) return;

    if (handleCommand(input)) {
      setInput("");
      return;
    }

    if (!connected) return;

    const socket = getSocket();
    socket.emit("send-message", {
      roomId,
      senderName: nickname,
      content: input.trim(),
    });
    setInput("");
  }

  function handleNicknameSubmit() {
    if (nicknameInput.trim()) setNickname(nicknameInput.trim());
  }

  function handleTerminalClick() {
    inputRef.current?.focus();
  }

  function openPreview(url: string, name: string, type: "image" | "video") {
    setPreview({ url, name, type });
  }

  function renderMessageContent(msg: Message) {
    if (!msg.fileUrl) {
      return <span className="text-gray-200">{msg.content}</span>;
    }

    const url = msg.fileUrl;

    if (isImageUrl(url)) {
      return (
        <span className="block mt-2.5">
          <span className="text-gray-400 text-xs">{msg.content}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={msg.content}
            className="mt-2 mb-4 max-w-xl cursor-pointer hover:border-white/30 transition-colors"
            loading="lazy"
            onClick={(e) => {
              e.stopPropagation();
              openPreview(url, msg.content, "image");
            }}
          />
        </span>
      );
    }

    if (isVideoUrl(url)) {
      return (
        <span className="block mt-1">
          <span className="text-gray-400 text-xs">
            {msg.content}{" "}
            <span
              className="text-terminal-cyan cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                openPreview(url, msg.content, "video");
              }}
            >
              [expand]
            </span>
          </span>
          <video src={url} controls className="mt-1 max-w-xs rounded border border-white/10" />
        </span>
      );
    }

    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-terminal-cyan underline">
        {msg.content} ↗
      </a>
    );
  }

  return (
    <main
      style={{
        backgroundImage: "url(/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="h-screen flex items-center justify-center p-0 md:p-4"
    >
      <TerminalWindow title={`termchat — ${roomName}`} className="flex flex-col h-full w-full md:h-[85vh] md:w-[90vw]">
        {!nickname ? (
          <div className="p-5 text-sm space-y-1">
            <p className="text-gray-200">$ join --room &quot;{roomName}&quot;</p>
            <p className="text-gray-200">Authenticated successfully.</p>
            <p>&nbsp;</p>
            <TerminalInput value={nicknameInput} onChange={setNicknameInput} onSubmit={handleNicknameSubmit} prompt="Enter nickname:" autoFocus maxLength={20} />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 cursor-text" onClick={handleTerminalClick}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />

            {/* Preview overlay */}
            {preview && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
                  {preview.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview.url} alt={preview.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <video src={preview.url} controls autoPlay className="max-w-full max-h-full" />
                  )}
                </div>
                <div className="px-4 py-1 text-gray-500 text-xs">{preview.name}</div>
                <div className="px-4 py-2 border-t border-white/5 shrink-0 cursor-pointer" onClick={() => setPreview(null)}>
                  <div className="flex items-center">
                    <span className="text-gray-500 text-sm">press enter or click to close&nbsp;</span>
                    <span className="inline-block w-[0.6em] h-[1.1em] bg-white/90 cursor-blink" />
                  </div>
                  <input
                    autoFocus
                    className="absolute opacity-0 w-0 h-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        setPreview(null);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Messages — hidden when preview is open */}
            {!preview && (
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 min-h-0">
                <p className="text-gray-500 text-xs mb-1">{connected ? `Connected to ${roomName} as ${nickname}. Type /help for commands.` : "Reconnecting..."}</p>

                {entries.map((entry) => {
                  if (entry.type === "system") {
                    const sys = entry as SystemMessage;
                    return (
                      <p key={sys.id} className="text-gray-500 text-xs">
                        <span className="text-gray-600">{formatTime(sys.createdAt)}</span>
                        {"  "}* {sys.content}
                      </p>
                    );
                  }

                  const msg = entry as Message;

                  // System messages from DB (join/leave events)
                  if (msg.senderName === "[system]") {
                    return (
                      <p key={msg.id} className="text-gray-500 text-xs">
                        <span className="text-gray-600">{formatTime(msg.createdAt)}</span>
                        {"  "}* {msg.content}
                      </p>
                    );
                  }

                  const isOwn = msg.senderName === nickname;

                  return (
                    <div key={msg.id} className="text-sm">
                      <span className="text-gray-600 text-xs">{formatTime(msg.createdAt)}</span>
                      {"  "}
                      <span className={isOwn ? "text-terminal-amber" : "text-terminal-cyan"}>{msg.senderName}</span>
                      <span className="text-gray-500"> &gt; </span>
                      {renderMessageContent(msg)}
                    </div>
                  );
                })}

                {/* Input line — inline as last line of terminal */}
                <TerminalInput value={input} onChange={setInput} onSubmit={handleSend} prompt={`${nickname}>\u00a0`} promptClassName="text-terminal-green text-sm" disabled={!connected} autoFocus inputRef={inputRef} />

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </TerminalWindow>
    </main>
  );
}
