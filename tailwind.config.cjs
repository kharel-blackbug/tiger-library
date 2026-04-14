/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mist:    { DEFAULT: '#f4f7f5', 50: '#f9fbfa', 100: '#f4f7f5', 200: '#e6ede9', 300: '#d0ddd5' },
        bamboo:  { DEFAULT: '#4a7c6e', light: '#6b9e90', dark: '#2d5a50', deeper: '#1e3d38' },
        slate:   { DEFAULT: '#6b8fa0', light: '#8aafc0', dark: '#4a6e80', deeper: '#2d4a5a' },
        stone:   { DEFAULT: '#7a8c88', light: '#9aaca8', dark: '#5a6c68' },
        ink:     { DEFAULT: '#2d4a3e', light: '#4a7c6e', muted: '#5a7a70' },
        fog:     { DEFAULT: '#e8f0ec', light: '#f0f5f2', dark: '#d0ddd8' },
        parchment: '#f7f9f8',
        cedar:   '#8a5a48',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"EB Garamond"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-up':  'fadeUp 0.3s ease both',
        'fade-in':  'fadeIn 0.2s ease',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4,0,0.2,1)',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
      },
      boxShadow: {
        card:       '0 1px 3px rgba(45,74,62,0.08), 0 1px 2px rgba(45,74,62,0.04)',
        'card-hover':'0 8px 24px rgba(45,74,62,0.12), 0 2px 6px rgba(45,74,62,0.06)',
        drawer:     '-4px 0 32px rgba(45,74,62,0.12)',
        modal:      '0 20px 60px rgba(45,74,62,0.2)',
      },
    },
  },
  plugins: [],
}
