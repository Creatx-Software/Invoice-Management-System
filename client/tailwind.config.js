/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wise brand colors
        wise: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#9fe870',   // Secondary/background color
          400: '#77b34f',   // Hover color
          500: '#4ade80',
          600: '#2d5213',   // Plus mark color
          700: '#15803d',
          800: '#153202',   // Primary color
          900: '#0d1f01',
        },
        // Brand shortcuts
        brand: {
          primary: '#153202',    // Primary color
          secondary: '#9fe870',  // Secondary color
          hover: '#77b34f',      // Hover color
          icon: '#2d5213',       // Icon color
          light: '#f0fdf4',      // Light background
          items: '#edefeb',      // Items section background
          border: '#c3c3c3',     // Default border color
        }
      },
    },
  },
  plugins: [],
}