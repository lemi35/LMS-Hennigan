import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        josefin: ["var(--font-josefin-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;