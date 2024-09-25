// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable dark mode using the 'class' strategy
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      // iOS-Inspired Font Family
      fontFamily: {
        'ios': ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      // Customize Colors
      colors: {
        'primary': '#1E293B',      // Dark Blue (Tailwind Gray-800)
        'secondary': '#F9FAFB',    // Light Gray (Tailwind Gray-50)
        'accent': '#14B8A6',       // Teal-500
        'text-primary': '#FFFFFF', // White for text in dark mode
        'text-secondary': '#D1D5DB', // Tailwind Gray-300 for secondary text
      },
      // Background Animation (Twinkling Stars)
      keyframes: {
        twinkling: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        twinkling: 'twinkling 2s infinite',
      },
    },
  },
  plugins: [],
};
