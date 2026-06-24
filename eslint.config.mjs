import nextConfig from "eslint-config-next"
import nextPlugin from "@next/eslint-plugin-next"

export default [
  { ignores: [".next/**", "node_modules/**", "out/**"] },
  ...nextConfig,
  {
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]
