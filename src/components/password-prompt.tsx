"use client";

import { useState } from "react";
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

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const result = await verifyPassword(roomId, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Hard reload so the browser sends the newly set cookie with the request.
      // router.refresh() is unreliable on mobile — it doesn't always include
      // cookies set during the preceding Server Action.
      window.location.reload();
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
            <p className="text-terminal-red mt-4">
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
