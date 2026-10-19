/**
 * POST /api/auth/logout: ends the session by clearing its cookie. Called when the wallet disconnects. The token itself
 * stays valid until it expires (it is not stored anywhere); rotating SESSION_SECRET ends every session at once.
 */
import { NextResponse } from "next/server";
import { rejectCrossSiteRequest } from "~~/services/api/server/http";
import { clearSessionCookie } from "~~/services/api/server/session";

export async function POST(request: Request) {
  const refused = rejectCrossSiteRequest(request, { json: false });
  if (refused) return refused;
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  clearSessionCookie(response);
  return response;
}
