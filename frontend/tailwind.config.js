/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Blue accent — Fresha-inspired
        gold: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#037aff',
          600: '#0066d6',
          700: '#0055b3',
          800: '#004494',
          900: '#003377',
          950: '#001a4a',
        },
        // Neutral gray scale
        onyx: {
          50:  '#f7f8f9',
          100: '#f0f2f4',
          200: '#e9ecef',
          300: '#ced4da',
          400: '#a0a8b3',
          500: '#6b7585',
          600: '#4a5568',
          700: '#2d3748',
          800: '#1a202c',
          900: '#0d1619',
          950: '#070e11',
        },
        ivory: '#ffffff',
        champagne: '#f7f8f9',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient':   'linear-gradient(135deg, #037aff 0%, #60a5fa 100%)',
        'dark-gradient':   'linear-gradient(135deg, #0d1619 0%, #1a202c 100%)',
        'luxury-gradient': 'linear-gradient(160deg, #ffffff 0%, #f7f8f9 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.5s ease forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(-20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      boxShadow: {
        'gold':    '0 0 0 3px rgba(3,122,255,0.15)',
        'luxury':  '0 4px 24px rgba(0,0,0,0.10)',
        'soft':    '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
