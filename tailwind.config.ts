import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213D",
        cream: "#FCF8F6",
        cloud: "#F7F9FC",
        teal: "#0F9D8C",
        tealDeep: "#0B7A6C",
        gold: "#F2A93B",
        coral: "#FF6B6B",
        slate: "#5C6784",
        line: "#EAE6E2",
        panel: "#0F1522",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl2: "22px",
      },
    },
  },
  plugins: [],
};
export default config;
