import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213D",
        cloud: "#F7F9FC",
        teal: "#2EC4B6",
        tealDeep: "#1F9E92",
        gold: "#FFB627",
        coral: "#FF6B6B",
        slate: "#5C6784",
        line: "#E7EAF3",
      },
      fontFamily: {
        display: ["Baloo 2", "sans-serif"],
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
