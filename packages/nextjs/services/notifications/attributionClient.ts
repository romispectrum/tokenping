import { apiError, apiUrl } from "~~/services/api/apiClient";

const ATTRIBUTION_PATH = "/api/attribution";

/**
 * Browser client for POST /api/attribution: the answer is stored for the signed-in wallet (the session cookie).
 * Throws the server's error message on failure, SignInRequiredError without a session.
 */
export async function submitAttributionAnswer(answer: string): Promise<void> {
  const res = await fetch(apiUrl(ATTRIBUTION_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) throw await apiError(res, "Failed to send your answer");
}
