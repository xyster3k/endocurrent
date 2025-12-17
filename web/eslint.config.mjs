import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

export default defineConfig([
  ...next,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
]);
