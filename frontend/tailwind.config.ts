import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: "#D5F34A",
          50: "#F9FDE6",
          100: "#F3FCC8",
          200: "#EAF898",
          300: "#DFF568",
          400: "#D5F34A",
          500: "#B8D924",
          600: "#8FA816",
        },
        sage: {
          DEFAULT: "#DCE6D4",
          50: "#F6F8F4",
          100: "#ECF1E9",
          200: "#DCE6D4",
          300: "#C4D4B8",
          400: "#A8BF99",
        },
        freshBg: "#F7F7F2",
        freshCard: "#FFFFFF",
        freshBorder: "#E7E9E0",
        freshText: {
          primary: "#171916",
          secondary: "#73776D",
          muted: "#9CA194",
        },
        freshSuccess: "#258A54",
        freshWarning: "#D69A30",
        freshError: "#D94B45",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(23, 25, 22, 0.04), 0 1px 2px -1px rgba(23, 25, 22, 0.04)",
        card: "0 4px 20px -2px rgba(23, 25, 22, 0.05)",
        floating: "0 12px 32px -4px rgba(23, 25, 22, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
