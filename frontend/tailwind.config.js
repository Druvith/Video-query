// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'canvas': '#FDFBF7',
        'panel': '#F4F1EA',
        'overlay': 'rgba(44, 36, 27, 0.85)',
        'text-main': '#2C241B',
        'text-muted': '#6B5E51',
        'border-subtle': '#D8D0C5',
        'border-focus': '#C05640',
        'accent-primary': '#C05640',
        'accent-primary-hover': '#A0402C',
        'accent-secondary': '#4A6C6F',
        'accent-success': '#5D7052',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(44, 36, 27, 0.06)',
        'hover': '0 8px 30px rgba(44, 36, 27, 0.12)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};