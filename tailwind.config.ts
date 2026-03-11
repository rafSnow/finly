import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EBF2FF',
          100: '#C3D8FF',
          500: '#1A56DB',
          600: '#1548C2',
          700: '#0F3A9E',
          900: '#0A2464',
        },
        success: {
          100: '#DEF7EC',
          500: '#0E9F6E',
        },
        danger: {
          100: '#FDE8E8',
          500: '#E02424',
        },
        warning: {
          100: '#FDF6B2',
          500: '#C27803',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          600: '#4B5563',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
