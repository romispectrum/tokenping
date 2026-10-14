const path = require("path");

// `next lint` lints `--file` targets IN ADDITION to `eslint.dirs` from next.config.ts, while `--dir` replaces those
// dirs (and accepts file paths), so passing staged files as `--dir` keeps the hook limited to the staged files.
const buildNextEslintCommand = (filenames) =>
  `yarn next:lint --fix --dir ${filenames
    .map((f) => path.relative(path.join("packages", "nextjs"), f))
    .join(" --dir ")}`;

const checkTypesNextCommand = () => "yarn next:check-types";

const buildHardhatEslintCommand = (filenames) =>
  `yarn hardhat:lint-staged --fix ${filenames
    .map((f) => path.relative(path.join("packages", "hardhat"), f))
    .join(" ")}`;

module.exports = {
  "packages/nextjs/**/*.{ts,tsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  "packages/hardhat/**/*.{ts,tsx}": [buildHardhatEslintCommand],
};
