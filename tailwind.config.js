/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./admin.html", "./briefing-cta.html", "./assets/js/app.js", "./assets/js/admin.js"],
  theme: {
    extend: {
      colors: {
        base: "#0a0a0a",
        ink: "#f0f0f0",
        neon: "#00ff88",
        "neon-dark": "#00cc6a",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
