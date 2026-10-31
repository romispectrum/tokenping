import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Nội dung mang tính giáo dục, không phải lời khuyên tài chính. Cảnh báo giúp giảm rủi ro, nhưng không ngăn được việc thanh lý.";

// "(truy cập ngày 29 tháng 10 năm 2026)"
const FETCHED_DATE = /(?:^|[\s(])truy cập ngày \d{1,2} tháng \d{1,2} năm \d{4}(?!\d)/u;

// Vietnamese copy that must not appear, on top of the English list. The English list's claims, in Vietnamese.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /không bao giờ (?:bị )?thanh lý/iu, reason: "guarantee: 'không bao giờ bị thanh lý'" },
  { pattern: /không bao giờ (?:bỏ lỡ|bỏ sót)/iu, reason: "guarantee: 'không bao giờ bỏ lỡ'" },
  { pattern: /thời gian thực/iu, reason: "'thời gian thực' (alerts are checked every 5 minutes)" },
  {
    pattern: /(?:cảnh báo|thông báo|tin nhắn) (?:tức thì|tức thời|ngay lập tức)/iu,
    reason: "'cảnh báo tức thì' (alerts are checked every 5 minutes)",
  },
  { pattern: /đa giao thức/iu, reason: "'đa giao thức' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:luôn |cố định )?(?:là|bằng) (?:50 ?%|0,5\b|một nửa)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:cho|mỗi) 30 ngày/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Vietnamese "free"; "không mất phí" and "không cần thanh toán" are fine.
  { pattern: /miễn phí/iu, reason: "'miễn phí' must not appear: write 'không mất phí' or 'không cần thanh toán'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Nguồn",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "truy cập ngày <d> tháng <m> năm <yyyy>",
  freeWords: /miễn phí/iu,
  bannedPatterns: BANNED_PATTERNS,
};
