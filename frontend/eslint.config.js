import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["dist/**/*", "build/**/*", "legacy/**/*", "node_modules/**/*"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "unused-imports": await import("eslint-plugin-unused-imports"),
      import: importPlugin
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.app.json"
        }
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "import/no-unresolved": "error"
    }
  },
  {
    plugins: {
      react,
      "react-hooks": reactHooks,
      prettier
    },
    languageOptions: {
      globals: {
        React: "writable"
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-irregular-whitespace": "off",
      "prettier/prettier": "error",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-console": "warn",
      "no-debugger": "warn",
      "react/display-name": "warn"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];
