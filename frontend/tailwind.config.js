/** @type {import('tailwindcss').Config} */
export default {
  // Scan all JS/JSX files for Tailwind class names
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Distinctive font pairing: Outfit (display) + DM Mono (mono accents)
        sans:  ['"Outfit"', 'sans-serif'],
        mono:  ['"DM Mono"', 'monospace'],
      },
      colors: {
        // Warm amber-tinted dark theme
        ink:   '#1a1612',
        paper: '#f5f0e8',
        amber: {
          DEFAULT: '#d97706',
          light:   '#fbbf24',
          dark:    '#92400e',
        },
        ash:   '#3d3530',
      },
      boxShadow: {
        'card': '4px 4px 0px 0px #1a1612',
        'card-hover': '6px 6px 0px 0px #1a1612',
      },
    },
  },
  plugins: [],
};
