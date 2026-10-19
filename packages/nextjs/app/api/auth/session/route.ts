/**
 * GET /api/auth/session: `{ address }`, the signed-in wallet (lowercased) or null. The session cookie is HttpOnly, so
 * this is how the alert settings know whether the connected wallet still has to sign in.
 */
import { NextResponse } from "next/server";
import { getSessionWallet } from "~~/services/api/server/session";

export async function GET(request: Request) {
  return NextResponse.json({ address: getSessionWallet(request) }, { headers: { "Cache-Control": "no-store" } });
}
