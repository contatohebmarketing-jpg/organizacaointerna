import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada no print: creme, serifa, acento verde/teal
        cream: {
          DEFAULT: "#FBF8F2", // fundo dos painéis
          50: "#FDFBF7",
          100: "#F7F2E9",
          200: "#EFE8DA",
          300: "#E4D9C5",
        },
        cork: "#C7B79A", // fundo texturizado atrás do painel
        ink: {
          DEFAULT: "#2B2A27",
          soft: "#5C574E",
          muted: "#9B9486",
        },
        teal: {
          DEFAULT: "#1F6E5B", // barras / acento principal
          dark: "#165546",
          light: "#5FA593",
        },
        leaf: "#35A66A", // verde de sucesso (100%)
        line: "#ECE6DA", // bordas dos cards
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(43,42,39,0.04), 0 1px 12px rgba(43,42,39,0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
