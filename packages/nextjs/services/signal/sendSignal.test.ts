import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSignalMessage } from "~~/services/signal/sendSignal";

const fetchMock = vi.fn();

const invalidUsername = (username: string) =>
  `Invalid Signal username "${username}". Expected format: alice.42 (find yours in Signal → Settings → Profile)`;

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("SIGNAL_API_URL", "https://signal.example");
  vi.stubEnv("SIGNAL_SENDER_NUMBER", " +14155550123 ");
  vi.stubEnv("SIGNAL_API_TOKEN", " relay-token ");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sendSignalMessage", () => {
  it("posts the bare username to /v2/send with the trimmed sender number and relay token", async () => {
    expect(await sendSignalMessage({ to: "alice.42", message: "HF alert" })).toStrictEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("https://signal.example/v2/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer relay-token" },
      body: '{"message":"HF alert","number":"+14155550123","recipients":["alice.42"]}',
    });
  });

  it.each([
    [" alice.42 ", "alice.42"],
    ["@alice.42", "alice.42"],
    ["u:alice.42", "alice.42"],
    ["u:@alice.42", "alice.42"],
    [" @ursula.42", "ursula.42"],
    // Only the literal "u:" / "@" prefixes are stripped, not a leading "u" (B3.1).
    ["ursula.42", "ursula.42"],
    ["@uma.01", "uma.01"],
    ["uu.10", "uu.10"],
  ])("normalizes %j to %j", async (to, expected) => {
    await sendSignalMessage({ to, message: "m" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).recipients).toEqual([expected]);
  });

  it.each([
    ["", ""],
    ["   ", ""],
    ["alice", "alice"],
    ["@alice", "alice"],
    ["_alice.42", "_alice.42"],
    ["alice.4", "alice.4"],
    ["@ alice", " alice"],
    // The value that is validated is the value that would be sent: whitespace after a prefix or a second prefix
    // makes it invalid instead of reaching the Signal API.
    ["@ alice.42", " alice.42"],
    ["u: alice.42", " alice.42"],
    ["@\talice.42", "\talice.42"],
    [" @ alice.42", " alice.42"],
    ["@ @alice.42", " @alice.42"],
    ["@@alice.42", "@alice.42"],
    ["u:u:alice.42", "u:alice.42"],
  ])("rejects %j (reported as %j) before checking the configuration", async (to, reported) => {
    vi.stubEnv("SIGNAL_API_URL", "");
    expect(await sendSignalMessage({ to, message: "m" })).toStrictEqual({
      success: false,
      error: invalidUsername(reported),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["the API URL is missing", "SIGNAL_API_URL", ""],
    ["the sender number is missing", "SIGNAL_SENDER_NUMBER", undefined],
    ["the sender number is blank", "SIGNAL_SENDER_NUMBER", "   "],
    ["the relay token is missing", "SIGNAL_API_TOKEN", undefined],
    ["the relay token is blank", "SIGNAL_API_TOKEN", "   "],
  ])("reports not configured when %s", async (_label, envName, value) => {
    vi.stubEnv(envName, value);
    expect(await sendSignalMessage({ to: "alice.42", message: "m" })).toStrictEqual({
      success: false,
      error: "Signal service not configured (SIGNAL_API_URL, SIGNAL_SENDER_NUMBER or SIGNAL_API_TOKEN missing)",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["https://signal.example/", "https://signal.example/v2/send"],
    ["https://signal.example//", "https://signal.example//v2/send"],
    ["https://signal.example/base", "https://signal.example/base/v2/send"],
  ])("strips one trailing slash from %j", async (apiUrl, expectedUrl) => {
    vi.stubEnv("SIGNAL_API_URL", apiUrl);
    await sendSignalMessage({ to: "alice.42", message: "m" });
    expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl);
  });

  it("reports the status and body of a failed response", async () => {
    fetchMock.mockResolvedValue(new Response("Bad Request: unknown user", { status: 400 }));
    expect(await sendSignalMessage({ to: "alice.42", message: "m" })).toStrictEqual({
      success: false,
      error: "Signal API responded with 400: Bad Request: unknown user",
    });
  });

  it("uses an empty body when reading a failed response throws", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, text: () => Promise.reject(new Error("stream")) });
    expect(await sendSignalMessage({ to: "alice.42", message: "m" })).toStrictEqual({
      success: false,
      error: "Signal API responded with 503: ",
    });
  });

  it.each([
    ["the error message", new Error("connect ECONNREFUSED"), "connect ECONNREFUSED"],
    ["a fallback for a non-Error", "nope", "Unknown error calling Signal API"],
  ])("returns %s when fetch throws", async (_label, thrown, expected) => {
    fetchMock.mockRejectedValue(thrown);
    expect(await sendSignalMessage({ to: "alice.42", message: "m" })).toStrictEqual({
      success: false,
      error: expected,
    });
  });
});
