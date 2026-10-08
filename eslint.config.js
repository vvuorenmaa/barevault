import eslintJs from "@eslint/js";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(
  { ignores: ["dist", "node_modules"] },
  eslintJs.configs.recommended,
  ...typescriptEslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // The engine is generic roguelike mechanics and must stay unaware of BareVault content (ADR-0002).
    files: ["src/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/game", "**/game/**"],
              message: "src/engine must not import from src/game (see ADR-0002).",
            },
          ],
        },
      ],
    },
  },
);
