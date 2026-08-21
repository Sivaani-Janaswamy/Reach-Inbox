/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1DB954',
          'green-light': '#E7F6EC',
          'green-text': '#15803D',
        },
        amber: {
          DEFAULT: '#F59E0B',
          light: '#FEF3E2',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          500: '#6B7280',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
};
