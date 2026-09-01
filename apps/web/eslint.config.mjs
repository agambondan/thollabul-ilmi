import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
    {
        ignores: [
            ".next/**",
            "**/.next/**",
            "node_modules/**",
            "**/node_modules/**",
            "next-env.d.ts",
            "out/**",
            "build/**",
        ],
    },
    {
        extends: [...nextCoreWebVitals],
        rules: {
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/static-components": "off",
            "react-hooks/immutability": "off",
        },
    },
    {
        files: ["**/__tests__/**", "**/*.test.js"],
        rules: {
            "react/display-name": "off",
            "react-hooks/exhaustive-deps": "off",
        },
    },
    {
        files: ["**/components/**", "**/app/**"],
        rules: {
            "react-hooks/exhaustive-deps": "warn",
        },
    },
]);
