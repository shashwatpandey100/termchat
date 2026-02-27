import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createRoomToken(roomId: string): Promise<string> {
  return new SignJWT({ roomId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyRoomToken(
  token: string,
  roomId: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.roomId === roomId;
  } catch {
    return false;
  }
}
