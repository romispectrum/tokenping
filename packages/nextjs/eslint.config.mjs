import { FlatCompat } from "@eslint/eslintrc";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Vendored Scaffold-ETH 2 code is kept as upstream ships it, including its `any` usages and interfaces
// (types/abitype augments abitype's `Register`, which only an interface can do).
const SE2_BOILERPLATE = [
  "app/blockexplorer/**",
  "app/debug/**",
  "components/scaffold-eth/**",
  "contracts/**",
  "hooks/scaffold-eth/**",
  "types/abitype/**",
  "utils/scaffold-eth/**",
];

export default defineConfig([
  {
    plugins: {
      prettier: prettierPlugin,
    },
    extends: compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

    rules: {
      "prettier/prettier": [
        "warn",
        {
          endOfLine: "auto",
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
  {
    files: SE2_BOILERPLATE,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
    },
  },
]);
