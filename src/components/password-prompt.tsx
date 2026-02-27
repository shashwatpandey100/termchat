"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPassword } from "@/actions/verify-password";
import { TerminalWindow } from "./terminal-window";
import { TerminalInput } from "./terminal-input";

export function PasswordPrompt({
  roomId,
  roomName,
}: {
  roomId: string;
  roomName: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const result = await verifyPassword(roomId, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
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
      <TerminalWindow title={`termchat — ${roomName}`} className="h-full w-full md:h-[85vh] md:w-[90vw]">
        <div className="p-5 text-sm space-y-1">
          <p className="text-gray-300">
            $ connect --room &quot;{roomName}&quot;
          </p>
          <p className="text-gray-300">Connecting to {roomName}...</p>
          <p className="text-terminal-red">
            Access denied. This room is password protected.
          </p>
          <p>&nbsp;</p>

          {error && (
            <p className="text-terminal-red">
              Authentication failed. Try again.
            </p>
          )}

          <div className="-mt-6">
          {loading ? (
            <p className="text-gray-500">Authenticating...</p>
          ) : (
            <TerminalInput
              value={password}
              onChange={setPassword}
              onSubmit={handleSubmit}
              prompt="Password:"
              type="password"
              autoFocus
            />
          )}
          </div>
        </div>
      </TerminalWindow>
    </main>
  );
}
