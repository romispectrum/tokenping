import { PACKAGE_ROOT, localeRouteFiles, readGenerated } from "./localeRoutes";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Writes every language's route group and client root (scripts/localeRoutes.ts). Run it after adding a language to
// i18n/locales.ts and i18n/routes.ts: `yarn locale-routes`.
const main = async () => {
  const files = await localeRouteFiles();
  let written = 0;
  for (const [file, text] of Object.entries(files)) {
    if (readGenerated(file) === text) continue;
    mkdirSync(path.dirname(path.join(PACKAGE_ROOT, file)), { recursive: true });
    writeFileSync(path.join(PACKAGE_ROOT, file), text);
    console.log(`wrote ${file}`);
    written += 1;
  }
  console.log(written ? `${written} file(s) written` : "every language's routes are up to date");
};

void main();
