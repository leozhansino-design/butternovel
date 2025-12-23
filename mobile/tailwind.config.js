/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#8B5CF6",
        secondary: "#F59E0B",
        background: "#FFFFFF",
        surface: "#F3F4F6",
        text: "#1F2937",
        "text-secondary": "#6B7280",
      },
    },
  },
  plugins: [],
};
