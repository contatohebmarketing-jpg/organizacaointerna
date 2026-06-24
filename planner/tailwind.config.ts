import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Visual clean/minimalista: branco, off-white, cinzas claros
        canvas: "#F1F2F4", // fundo da janela (cinza muito claro)
        surface: "#FFFFFF", // cards / painel
        offwhite: "#FAFAFB", // sidebar / faixas
        ink: {
          DEFAULT: "#1F2328", // texto principal
          soft: "#5B6470",
          muted: "#8A929C",
        },
        line: "#E7E8EB", // bordas
        line2: "#EFF0F2", // bordas/linhas mais sutis (grade do calendário)
        accent: {
          DEFAULT: "#2F6FE0", // azul de seleção / "hoje"
          soft: "#E8F0FD",
        },
        progress: "#1F9D6B", // verde discreto de progresso (prazos da semana)
        danger: "#D64545",
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04)",
        pop: "0 8px 28px rgba(16,24,40,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
