/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")], // ✅ THIS LINE FIXES YOUR ERROR

  theme: {
    extend: {
      colors: {
        backg: "#F5F5F5",
      },
    },
  },

  plugins: [],
};