import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        viamar: {
          50: '#F2F6FA',
          100: '#E0EAF3',
          200: '#BCD2E5',
          400: '#588FBE',
          500: '#206AA9',
          600: '#1B5C93',
          700: '#185587',
          800: '#12436B',
          900: '#0E3453',
          accent: '#039BE5',
          'link-hover': '#42A5F5',
        },
        app: {
          bg: '#F8F8F8',
          surface: '#FFFFFF',
          'surface-alt': '#FAFAFA',
          border: '#E0E0E0',
          'border-strong': '#D5D5D5',
        },
        ink: {
          DEFAULT: 'rgba(0,0,0,.87)',
          secondary: '#6F6F6F',
          disabled: 'rgba(0,0,0,.38)',
        },
        ok: '#2E7D32',
        warn: '#ED6C02',
        danger: '#C62828',
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg': ['22px', { lineHeight: '30px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'headline-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label-md': ['13px', { lineHeight: '18px', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '700' }],
        'code-serial': ['15px', { lineHeight: '20px', letterSpacing: '0.06em', fontWeight: '700' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '6px',
      },
      boxShadow: {
        panel: '0 2px 6px rgba(0,0,0,.06)',
        modal: '0 8px 24px rgba(0,0,0,.12)',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
} satisfies Config
