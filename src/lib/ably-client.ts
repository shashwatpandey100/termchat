"use client";

import Ably from "ably";

let _ably: Ably.Realtime | null = null;

export function getAblyClient(): Ably.Realtime {
  if (!_ably || _ably.connection.state === "closed" || _ably.connection.state === "failed") {
    _ably = new Ably.Realtime({
      authUrl: "/api/ably/token",
      autoConnect: false,
    });
  }
  return _ably;
}
