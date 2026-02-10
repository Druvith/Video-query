// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // "Darkroom" Palette
        'canvas': '#1C1917',        // Warm Black / Espresso
        'panel': '#292524',         // Dark Stone
        'surface': '#44403C',       // Lighter Stone for inputs/borders
        'overlay': 'rgba(12, 10, 9, 0.9)', // Deep overlay
        
        'text-main': '#E7E5E4',     // Warm Grey / Oatmeal
        'text-muted': '#A8A29E',    // Muted Stone
        
        'border-subtle': '#44403C', // Subtle separator
        'border-focus': '#EA580C',  // Burnt Orange

        'accent-primary': '#EA580C', // Burnt Orange / Rust
        'accent-primary-hover': '#C2410C',
        'accent-secondary': '#57534E',
        'accent-success': '#4D7C0F', // Muted Green
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.2)',
        'hover': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(234, 88, 12, 0.15)',
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
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
};