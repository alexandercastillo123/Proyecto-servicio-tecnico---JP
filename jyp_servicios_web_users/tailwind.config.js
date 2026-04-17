/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B28FF",
        dark: "#05060A",
        glass: "rgba(255, 255, 255, 0.03)",
        "glass-border": "rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
