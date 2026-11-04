import { PACKAGE_ROOT, localeClientFiles, readGenerated } from "./localeClients";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Writes every language's client root and the on-demand roots of the prefixed languages (scripts/localeClients.ts).
// Run it after adding a language to i18n/locales.ts and i18n/localePaths.ts: `yarn locale-clients`.
const main = async () => {
  const files = await localeClientFiles();
  let written = 0;
  for (const [file, text] of Object.entries(files)) {
    if (readGenerated(file) === text) continue;
    mkdirSync(path.dirname(path.join(PACKAGE_ROOT, file)), { recursive: true });
    writeFileSync(path.join(PACKAGE_ROOT, file), text);
    console.log(`wrote ${file}`);
    written += 1;
  }
  console.log(written ? `${written} file(s) written` : "every language's client root is up to date");
};

void main();
