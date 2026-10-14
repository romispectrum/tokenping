import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireActiveAccess } from "~~/services/api/server/access";
import { isAccessActive } from "~~/services/payments/checkAccess";

vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));

beforeEach(() => {
  vi.mocked(isAccessActive).mockReset();
});

describe("requireActiveAccess", () => {
  it("returns null for active access, passing the id through unchanged", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(true);
    expect(await requireActiveAccess("0xAbC", "denied")).toBeNull();
    expect(isAccessActive).toHaveBeenCalledExactlyOnceWith("0xAbC");
  });

  it("returns a 403 with the message otherwise", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    const res = await requireActiveAccess("0xabc", "Active paid access required");
    expect(res && { status: res.status, type: res.headers.get("content-type"), text: await res.text() }).toEqual({
      status: 403,
      type: "application/json",
      text: '{"error":"Active paid access required"}',
    });
  });
});
