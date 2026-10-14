import { createHash, timingSafeEqual } from "crypto";
import "server-only";

const sha256 = (value: string) => new Uint8Array(createHash("sha256").update(value).digest());

/** Constant-time string comparison. Hashing first gives equal-length buffers, so not even the length leaks. */
export const safeEqual = (provided: string, expected: string) => timingSafeEqual(sha256(provided), sha256(expected));

/** Whether the request carries exactly `Authorization: Bearer <secret>`, compared in constant time. */
export const hasBearerSecret = (request: Request, secret: string) =>
  safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
