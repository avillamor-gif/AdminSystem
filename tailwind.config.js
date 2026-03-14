/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // II Admin System color palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Sidebar white theme
        sidebar: {
          DEFAULT: '#ffffff',
          hover: '#f3f4f6',
          active: '#e5e7eb',
        },
        // Update accent colors to blue theme
        blue: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
        // Legacy orange colors (for gradual migration)
        orange: {
          DEFAULT: '#ff7e15',
          light: '#ff9b40',
          dark: '#e06a08',
        },
        // Brand orange (exact)
        brand: {
          DEFAULT: '#ff7e15',
          light: '#ff9b40',
          dark: '#e06a08',
          50:  '#fff4ec',
          100: '#ffe5cc',
          200: '#ffc999',
          300: '#ffad66',
          400: '#ff9133',
          500: '#ff7e15',
          600: '#e06a08',
          700: '#b85506',
        },
      },
    },
  },
  plugins: [],
}
