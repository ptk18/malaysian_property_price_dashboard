import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  nextPlugin.configs["core-web-vitals"],
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  globalIgnores([
    ".next/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
