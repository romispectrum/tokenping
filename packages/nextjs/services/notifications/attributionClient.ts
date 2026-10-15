import { apiUrl, readApiError } from "~~/services/api/apiClient";

const ATTRIBUTION_PATH = "/api/attribution";

/**
 * Browser client for POST /api/attribution. Sends the trimmed wallet address as the wallet reports it (the paid-access
 * check takes it unchanged; the server lowercases it for storage). Throws the server's error message on failure.
 */
export async function submitAttributionAnswer(userId: string, answer: string): Promise<void> {
  const res = await fetch(apiUrl(ATTRIBUTION_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: userId.trim(), answer }),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to send your answer"));
}
