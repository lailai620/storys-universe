/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 織光主色系 — 溫暖金色
        "primary": "#f4c025",
        "primary-light": "#fcd34d",
        "primary-dark": "#d4a017",
        "primary-foreground": "#1c180d",

        // 背景色
        "background-light": "#f8f8f5",
        "background-dark": "#221e10",

        // 面板/卡片
        "surface-light": "#ffffff",
        "surface-dark": "#2d281a",

        // 文字
        "text-primary-light": "#1c180d",
        "text-primary-dark": "#fcfbf8",
        "text-secondary-light": "#6b5c30",
        "text-secondary-dark": "#c4b78a",

        // 邊框
        "border-light": "#e8e0c8",
        "border-dark": "#483c23",

        // 功能色
        "success": "#10b981",
        "warning": "#f59e0b",
        "danger": "#ef4444",
        "info": "#6c2bee",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "Noto Sans TC", "sans-serif"],
        "body": ["Noto Sans TC", "Plus Jakarta Sans", "sans-serif"],
        "serif": ["Noto Serif TC", "serif"],
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "full": "9999px",
      },
      boxShadow: {
        "soft": "0 4px 20px -2px rgba(244, 192, 37, 0.15)",
        "glow": "0 0 15px rgba(244, 192, 37, 0.3)",
        "glow-lg": "0 0 30px rgba(244, 192, 37, 0.4)",
        "card": "0 4px 16px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "shimmer": "shimmer 2s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(244, 192, 37, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(244, 192, 37, 0.5), 0 0 60px rgba(244, 192, 37, 0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}