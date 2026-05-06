/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfaef',
          100: '#faf3d0',
          200: '#f4e59d',
          300: '#ecd262',
          400: '#e3bc37',
          500: '#d4a01e',
          600: '#b87d16',
          700: '#8f5b15',
          800: '#754818',
          900: '#643d19',
          950: '#391f09',
        },
        onyx: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#1a1a1a',
        },
        ivory: '#faf8f4',
        champagne: '#f7e7ce',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        accent: ['"Cormorant Garamond"', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #d4a01e 0%, #e3bc37 50%, #b87d16 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        'luxury-gradient': 'linear-gradient(160deg, #1a1a1a 0%, #3d3d3d 40%, #1a1a1a 100%)',
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
        'gold': '0 0 20px rgba(212,160,30,0.3)',
        'luxury': '0 25px 50px rgba(0,0,0,0.4)',
        'soft': '0 4px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
