/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '3rem' } },
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Warm neutral scale. The name "obsidian" is kept so existing pages (checkout, orders,
        // profile, admin) pick up the new look without being rewritten.
        obsidian: {
          50: '#f6f5f0', 100: '#e9e8e0', 200: '#d2d1c7', 300: '#b0afa4', 400: '#8b8a80',
          500: '#66655d', 600: '#45443f', 700: '#2c2c28', 750: '#222220', 800: '#191917',
          850: '#131311', 900: '#0b0b0a', 950: '#050504',
        },
        // Brand accent (signal coral). Also kept under the legacy "gold" name.
        gold: {
          50: '#fff4ef', 100: '#ffe3d7', 200: '#ffc6b0', 300: '#ffa07f', 400: '#ff8159',
          500: '#ff6a3d', 600: '#e8501f', 700: '#bf3f17', 800: '#8e3014', 900: '#5d2010',
        },
        accent: { DEFAULT: 'rgb(var(--accent) / <alpha-value>)' },
        cream: '#f4f1ea',
        ink: '#0b0b0a',
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        gold: '0 8px 30px -8px rgba(255,106,61,0.35)',
        'gold-lg': '0 14px 44px -10px rgba(255,106,61,0.45)',
        card: '0 1px 2px rgba(0,0,0,.4), 0 8px 24px -8px rgba(0,0,0,.5)',
        'card-hover': '0 2px 4px rgba(0,0,0,.4), 0 24px 48px -16px rgba(0,0,0,.7)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06)',
        pill: '0 1px 2px rgba(0,0,0,.3), 0 4px 14px rgba(0,0,0,.28)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-600px 0' }, '100%': { backgroundPosition: '600px 0' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'marquee-rev': { from: { transform: 'translateX(-50%)' }, to: { transform: 'translateX(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.94)' }, to: { opacity: 1, transform: 'scale(1)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        ping2: { '0%': { transform: 'scale(1)', opacity: 0.6 }, '80%,100%': { transform: 'scale(2.4)', opacity: 0 } },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite linear',
        marquee: 'marquee 40s linear infinite',
        'marquee-rev': 'marquee-rev 48s linear infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        ping2: 'ping2 1.8s cubic-bezier(0,0,0.2,1) infinite',
      },
    },
  },
  plugins: [],
};
