/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: { light: '#1f7a33', DEFAULT: '#1b6e2e', dark: '#10491f' },
        navy: { light: '#1c3566', DEFAULT: '#142a52', dark: '#10203f', deep: '#0c1830' },
        gold: { light: '#ffe9a8', DEFAULT: '#ffd24a', dark: '#c79a2e', trim: '#e7c95a' },
        rarity: { legendary: '#ffd24a', epic: '#a855f7', rare: '#3b82f6', common: '#94a3b8' },
        stat: { matches: '#5b9bff', goals: '#ffd24a', assists: '#34d399', tackles: '#a78bfa', saves: '#22d3ee', cleanSheets: '#2dd4bf' },
      },
      fontFamily: {
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
