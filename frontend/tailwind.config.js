export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#1a56db', 600: '#1e429f', 700: '#1e3a8a', 800: '#1e3050', 900: '#0f172a' },
        accent: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' }
      },
      fontFamily: { poppins: ['Poppins', 'sans-serif'] },
      borderRadius: { '2xl': '16px', '3xl': '24px' },
      animation: { 'float': 'float 6s ease-in-out infinite', 'slide-up': 'slideUp 0.5s ease-out', 'fade-in': 'fadeIn 0.5s ease-out' },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
        slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } }
      }
    }
  },
  plugins: []
}
