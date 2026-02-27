import Ably from "ably";

let _ably: Ably.Rest | null = null;

export function getAblyServer(): Ably.Rest {
  if (!_ably) {
    _ably = new Ably.Rest(process.env.ABLY_API_KEY!);
  }
  return _ably;
}
