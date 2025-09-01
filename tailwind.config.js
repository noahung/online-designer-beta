/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          bg: '#ffffff',
          'bg-secondary': '#f8fafc',
          'bg-tertiary': '#f1f5f9',
          text: '#0f172a',
          'text-secondary': '#475569',
          'text-muted': '#64748b',
          border: '#e2e8f0',
          'border-secondary': '#cbd5e1',
        },
        // Dark mode colors  
        dark: {
          bg: '#0f172a',
          'bg-secondary': '#1e293b',
          'bg-tertiary': '#334155',
          text: '#f8fafc',
          'text-secondary': '#cbd5e1',
          'text-muted': '#94a3b8',
          border: '#334155',
          'border-secondary': '#475569',
        }
      }
    },
  },
  plugins: [],
};
