/**
 * Tells IndexNow (Bing, Seznam, Yandex and the other participating engines) about the site's pages. Run it from the
 * repo root after a deploy that adds or changes pages:
 *
 *   yarn next:indexnow                      # every page in the live sitemap, English and Czech
 *   yarn next:indexnow --since 2026-10-19   # only pages whose sitemap date is on or after that day
 *   yarn next:indexnow --dry-run            # list the URLs, send nothing
 *
 * It reads the key from the live key file (INDEXNOW_KEY in Vercel, served at /indexnow-key.txt) and the URLs from the
 * live https://tokenping.xyz/sitemap.xml, so it needs no local environment and never sends a page that is not
 * deployed. It exits with 1 when any batch is refused. Logic and limits: scripts/indexNow.ts.
 */
import { run } from "~~/scripts/indexNow";

run(process.argv.slice(2)).then(
  code => {
    process.exitCode = code;
  },
  error => {
    console.error(error);
    process.exitCode = 1;
  },
);
