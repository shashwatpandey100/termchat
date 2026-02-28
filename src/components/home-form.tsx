"use client";

import { createRoom } from "@/actions/create-room";
import { joinRoom } from "@/actions/join-room";
import { checkRoomName } from "@/actions/check-room-name";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { TerminalInput } from "./terminal-input";

type Step =
  | "menu"
  | "create-name"
  | "create-password"
  | "join-name"
  | "join-password";

const MENU_OPTIONS = ["Create Room", "Join Room"] as const;

export function HomeForm() {
  const [step, setStep] = useState<Step>("menu");
  const [menuIndex, setMenuIndex] = useState(0);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Server actions
  const [createState, createAction, createPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await createRoom(formData)) ?? null;
    },
    null
  );

  const [joinState, joinAction, joinPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await joinRoom(formData)) ?? null;
    },
    null
  );

  const isPending = createPending || joinPending || isCheckingName;

  // On create error reset to name step so user can pick a different name
  useEffect(() => {
    if (createState?.error) {
      setName("");
      setPassword("");
      setStep("create-name");
    }
  }, [createState]);

  // On join error, decide whether to reset to name or stay at password
  useEffect(() => {
    if (!joinState?.error) return;
    if (joinState.error.toLowerCase().includes("not found")) {
      // Bad room name — go back to name step
      setName("");
      setPassword("");
      setStep("join-name");
    } else {
      // Wrong password — stay at password step, clear value
      setPassword("");
    }
  }, [joinState]);

  // Focus menu when returning to it
  useEffect(() => {
    if (step === "menu") {
      setTimeout(() => menuRef.current?.focus(), 0);
    }
  }, [step]);

  // ── Keyboard handler for Escape (go back one level) ─────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (step === "create-name" || step === "join-name") {
        setName("");
        setNameError(null);
        setStep("menu");
      } else if (step === "create-password") {
        setPassword("");
        setStep("create-name");
      } else if (step === "join-password") {
        setPassword("");
        setStep("join-name");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step]);

  // ── Menu ─────────────────────────────────────────────────────────────────
  function handleMenuKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      setMenuIndex((i) => (i === 0 ? 1 : 0));
    } else if (e.key === "Enter") {
      setNameError(null);
      if (menuIndex === 0) {
        setName("");
        setPassword("");
        setStep("create-name");
      } else {
        setName("");
        setPassword("");
        setStep("join-name");
      }
    }
  }

  // ── Create flow ──────────────────────────────────────────────────────────
  async function handleCreateName() {
    if (!name.trim() || isCheckingName) return;
    setIsCheckingName(true);
    setNameError(null);
    try {
      const { taken } = await checkRoomName(name.trim());
      if (taken) {
        setNameError("Room name unavailable, choose another.");
      } else {
        setPassword("");
        setStep("create-password");
      }
    } finally {
      setIsCheckingName(false);
    }
  }

  function handleCreatePassword() {
    if (!password.trim() || isPending) return;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("password", password);
    startTransition(() => createAction(formData));
  }

  // ── Join flow ────────────────────────────────────────────────────────────
  function handleJoinName() {
    if (name.trim()) {
      setPassword("");
      setStep("join-password");
    }
  }

  function handleJoinPassword() {
    if (!password.trim() || isPending) return;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("password", password);
    startTransition(() => joinAction(formData));
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-1 text-sm font-mono">
      {/* ── MENU ── */}
      {step === "menu" && (
        <div
          ref={menuRef}
          tabIndex={0}
          onKeyDown={handleMenuKey}
          className="outline-none space-y-1"
        >
          <p className="text-gray-400 mb-3">Select an option:</p>
          {MENU_OPTIONS.map((opt, i) => (
            <div
              key={opt}
              className="flex items-center gap-2 cursor-pointer select-none py-1"
              onClick={() => {
                setMenuIndex(i);
                setNameError(null);
                setName("");
                setPassword("");
                if (i === 0) setStep("create-name");
                else setStep("join-name");
              }}
            >
              <span className="w-3 text-terminal-green">
                {i === menuIndex ? ">" : " "}
              </span>
              <span
                className={
                  i === menuIndex
                    ? "text-white"
                    : "text-gray-500"
                }
              >
                {opt}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE ROOM ── */}
      {(step === "create-name" || step === "create-password") && (
        <div className="space-y-1">
          <p className="text-gray-400 mb-2">$ create-room</p>

          <TerminalInput
            value={name}
            onChange={(v) => {
              setName(v);
              setNameError(null);
            }}
            onSubmit={handleCreateName}
            prompt="Room name:  "
            disabled={isPending || step === "create-password"}
            autoFocus={step === "create-name"}
          />

          {isCheckingName && (
            <p className="text-gray-500">Checking availability…</p>
          )}

          {nameError && (
            <p className="text-red-400">{nameError}</p>
          )}

          {step === "create-password" && (
            <TerminalInput
              value={password}
              onChange={setPassword}
              onSubmit={handleCreatePassword}
              prompt="Password:"
              type="password"
              disabled={isPending}
              autoFocus
            />
          )}

          {createState?.error && step === "create-name" && (
            <p className="text-red-400">{createState.error}</p>
          )}

          {createPending && (
            <p className="text-gray-500">Creating room…</p>
          )}

          <p
            className="text-gray-600 pt-2 text-md cursor-pointer select-none hover:text-gray-400"
            onClick={() => {
              setName("");
              setPassword("");
              setNameError(null);
              if (step === "create-password") setStep("create-name");
              else setStep("menu");
            }}
          >
            ← back
          </p>
        </div>
      )}

      {/* ── JOIN ROOM ── */}
      {(step === "join-name" || step === "join-password") && (
        <div className="space-y-1">
          <p className="text-gray-400 mb-2">$ join-room</p>

          <TerminalInput
            value={name}
            onChange={setName}
            onSubmit={handleJoinName}
            prompt="Room name:"
            disabled={isPending || step === "join-password"}
            autoFocus={step === "join-name"}
          />

          {step === "join-password" && (
            <TerminalInput
              value={password}
              onChange={setPassword}
              onSubmit={handleJoinPassword}
              prompt="Password:"
              type="password"
              disabled={isPending}
              autoFocus
            />
          )}

          {joinState?.error && (
            <p className="text-red-400">{joinState.error}</p>
          )}

          {joinPending && (
            <p className="text-gray-500">Joining room___</p>
          )}

          <p
            className="text-gray-600 pt-1 text-md cursor-pointer select-none hover:text-gray-400"
            onClick={() => {
              setName("");
              setPassword("");
              if (step === "join-password") setStep("join-name");
              else setStep("menu");
            }}
          >
            ← back
          </p>
        </div>
      )}
    </div>
  );
}
