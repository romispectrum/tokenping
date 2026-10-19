/**
 * `yarn next:indexnow`: tells IndexNow engines about the pages in the live sitemap. Options: `--help`. Setup: the
 * README's IndexNow section. Logic and limits: scripts/indexNow.ts.
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
