import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "dist/**", ".cache/**", ".vite/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "module", globals: globals.browser },
    rules: { "no-unused-vars": ["error", { caughtErrors: "none" }] },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { sourceType: "module", globals: globals.node },
  },
];
