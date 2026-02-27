import { NextResponse } from "next/server";
import { getAblyServer } from "@/lib/ably-server";

export async function GET() {
  const ably = getAblyServer();
  const tokenRequest = await ably.auth.createTokenRequest({
    capability: { "*": ["subscribe", "publish"] },
  });
  return NextResponse.json(tokenRequest);
}
