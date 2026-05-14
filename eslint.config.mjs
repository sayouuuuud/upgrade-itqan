import nextConfig from "eslint-config-next"
import nextPlugin from "@next/eslint-plugin-next"

export default [
  { ignores: [".next/**", "node_modules/**", "out/**"] },
  ...nextConfig,
  {
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
]
