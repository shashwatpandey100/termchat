"use client";

import { createRoom } from "@/actions/create-room";
import { useActionState, useState } from "react";
import { TerminalInput } from "./terminal-input";

export function CreateRoomForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"name" | "password">("name");

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createRoom(formData);
      return result ?? null;
    },
    null
  );

  function handleNameSubmit() {
    if (name.trim()) setStep("password");
  }

  function handlePasswordSubmit() {
    if (!password.trim()) return;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("password", password);
    formAction(formData);
  }

  return (
    <div className="space-y-1 text-sm">
      <p className="text-gray-200">$ create-room</p>
      <p className="text-gray-400">Enter room details below.</p>
      <p>&nbsp;</p>

      <TerminalInput
        value={name}
        onChange={setName}
        onSubmit={handleNameSubmit}
        prompt="Room name:&nbsp;"
        disabled={isPending || step === "password"}
        autoFocus
      />

      {step === "password" && (
        <TerminalInput
          value={password}
          onChange={setPassword}
          onSubmit={handlePasswordSubmit}
          prompt="Password:&nbsp;&nbsp;"
          type="password"
          disabled={isPending}
          autoFocus
        />
      )}

      {state?.error && (
        <p className="text-terminal-red">{state.error}</p>
      )}

      {isPending && (
        <p className="text-gray-400">Creating room...</p>
      )}
    </div>
  );
}
