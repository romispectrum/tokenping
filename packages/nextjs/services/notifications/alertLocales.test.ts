import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { LOCALES } from "~~/i18n/locales";

// The database checks which language codes an alert may be saved with (packages/supabase/migrations). A language the
// app ships must be allowed there, or saving an alert from its pages fails at deploy time.
const MIGRATIONS = path.resolve(__dirname, "../../../supabase/migrations");

it("lets the database store every language the site ships, for the page and for each channel", () => {
  const latest = readdirSync(MIGRATIONS)
    .filter(file => /alert_locales?\.sql$/.test(file))
    .sort()
    .at(-1)!;
  const sql = readFileSync(path.join(MIGRATIONS, latest), "utf8");

  for (const column of ["locale", "email_locale", "signal_locale", "telegram_locale"]) {
    const list = sql.match(new RegExp(`\\(${column} in \\(([^)]*)\\)\\)|\\b${column} in \\(([^)]*)\\)\\)`))!;
    const allowed = (list[1] ?? list[2]).split(",").map(code => code.trim().replace(/'/g, ""));
    expect(allowed, `${latest}: ${column}`).toEqual(expect.arrayContaining([...LOCALES]));
  }
});
