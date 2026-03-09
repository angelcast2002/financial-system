/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#f4f6fb',
          surface: '#ffffff',
          'surface-soft': '#f7f8fc',
          border: '#e8ecf6',
          ink: '#2f3a63',
          muted: '#95a0bf',
          primary: '#2f35f5',
          'primary-soft': '#66a8ff',
          accent: '#6ddfc7',
          success: '#43d39e',
          warning: '#f2b84b',
          danger: '#ff7c9c'
        }
      },
      boxShadow: {
        'app-card': '0 12px 30px rgba(32, 52, 146, 0.08)',
        'app-soft': '0 6px 14px rgba(46, 58, 99, 0.06)'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    },
  },
  plugins: [],
}