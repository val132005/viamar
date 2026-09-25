import type { Config } from 'tailwindcss'

/**
 * Sistema visual Viamar.
 *
 * Los nombres heredados (`app-border`, `ink-secondary`, `shadow-panel`,
 * `rounded-lg`…) se conservan a propósito y apuntan a los valores nuevos: así
 * el rediseño alcanza las pantallas que aún no se han recompuesto sin tener
 * que editarlas una por una.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        viamar: {
          50: '#F1F6FB',
          100: '#E1EBF5',
          200: '#C3D8EA',
          300: '#94BAD9',
          400: '#5892C2',
          500: '#206AA9',
          600: '#1B5C93',
          700: '#175079',
          800: '#133F5F',
          900: '#0E3453',
          950: '#08202F',
          accent: '#039BE5',
          'accent-strong': '#0284C7',
          'link-hover': '#42A5F5',
        },

        /* Neutros fríos: conviven con el azul de marca sin ensuciarlo. */
        neutral: {
          0: '#FFFFFF',
          25: '#FBFCFE',
          50: '#F6F8FB',
          100: '#EFF2F7',
          200: '#E3E8EF',
          300: '#CFD7E1',
          400: '#9AA7B6',
          500: '#6B7A8B',
          600: '#4F5E6E',
          700: '#3A4855',
          800: '#26313C',
          900: '#161E26',
        },

        /* Capas de superficie: la profundidad nace aquí, no de las sombras. */
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#FFFFFF',
          subtle: '#F9FBFD',
          sunken: '#F7F9FC',
          hover: '#F2F6FB',
          active: '#E8F0F9',
          selected: '#E4EFF9',
          inverse: '#0E3453',
        },

        /* Alias heredado. */
        app: {
          bg: '#F7F9FC',
          surface: '#FFFFFF',
          'surface-alt': '#F9FBFD',
          border: '#E3E8EF',
          'border-strong': '#CFD7E1',
        },

        /* Texto: cuatro niveles, usados como jerarquía real. */
        ink: {
          DEFAULT: '#17242F',
          secondary: '#566573',
          tertiary: '#86929F',
          disabled: '#A8B2BC',
          brand: '#175079',
        },

        line: {
          subtle: '#EEF1F6',
          DEFAULT: '#E3E8EF',
          strong: '#CFD7E1',
          brand: '#C3D8EA',
        },

        /* Semánticos: solid / text / soft / border para cada rol. */
        success: {
          DEFAULT: '#1F7A34',
          text: '#14602A',
          soft: '#E8F5EC',
          border: '#B6DFC2',
        },
        /* Aviso en pizarra azulada: la marca no tiene amarillos ni naranjas, y el
           rojo queda reservado a lo crítico. */
        warning: {
          DEFAULT: '#4A5D78',
          text: '#33455E',
          soft: '#EEF2F7',
          border: '#C9D3E0',
        },
        critical: {
          DEFAULT: '#C0392F',
          text: '#9B2C24',
          soft: '#FDECEB',
          border: '#F3BFBA',
        },
        info: {
          DEFAULT: '#0C7CC0',
          text: '#0A5E92',
          soft: '#E6F2FB',
          border: '#B3D8F0',
        },

        /* Alias heredados de estado. */
        ok: '#1F7A34',
        warn: '#4A5D78',
        danger: '#C0392F',
      },

      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SFMono-Regular', 'ui-monospace', 'Menlo', 'monospace'],
        /* Tabla de registros del panel: la tipografía de la maqueta aprobada. */
        inter: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        /* Titulares: el salto de peso y tamaño marca el nivel. */
        display: ['26px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl': ['22px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'headline-lg': ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['15px', { lineHeight: '20px', fontWeight: '700' }],
        'headline-sm': ['13px', { lineHeight: '18px', fontWeight: '700' }],

        /* Cifras: para KPIs y totales. */
        'metric-xl': ['30px', { lineHeight: '34px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'metric-lg': ['24px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '700' }],
        metric: ['19px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '700' }],

        /* Cuerpo. */
        'body-lg': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'body-xs': ['12px', { lineHeight: '16px', fontWeight: '400' }],

        /* Etiquetas: sin mayúsculas forzadas. */
        'label-lg': ['13px', { lineHeight: '18px', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '600' }],

        /* Eyebrow: único lugar donde se admiten mayúsculas. */
        overline: ['11px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '700' }],

        'code-serial': ['13px', { lineHeight: '18px', letterSpacing: '0.04em', fontWeight: '600' }],
      },

      /* Radios contenidos: empresarial contemporáneo, nunca pastilla. */
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '10px',
        xl: '14px',
        '2xl': '16px',
      },

      /* Elevación mínima: la jerarquía es de color, no de sombra. */
      boxShadow: {
        xs: '0 1px 2px rgba(22,30,38,.04)',
        sm: '0 1px 2px rgba(22,30,38,.04), 0 1px 3px rgba(22,30,38,.06)',
        md: '0 2px 4px -1px rgba(22,30,38,.05), 0 4px 12px -2px rgba(22,30,38,.08)',
        lg: '0 8px 16px -4px rgba(22,30,38,.08), 0 16px 32px -8px rgba(22,30,38,.12)',
        focus: '0 0 0 3px rgba(32,106,169,.18)',
        'focus-danger': '0 0 0 3px rgba(192,57,47,.18)',

        /* Alias heredados, ahora discretos. */
        panel: '0 1px 2px rgba(22,30,38,.04), 0 1px 3px rgba(22,30,38,.06)',
        lift: '0 2px 4px -1px rgba(22,30,38,.05), 0 4px 12px -2px rgba(22,30,38,.08)',
        modal: '0 8px 16px -4px rgba(22,30,38,.08), 0 16px 32px -8px rgba(22,30,38,.12)',
        glow: '0 0 0 3px rgba(32,106,169,.18)',
        'brand-btn': '0 1px 2px rgba(22,30,38,.04)',
      },

      /* Escala de 4px. */
      spacing: {
        px: '1px',
        0.5: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },

      height: {
        control: '32px',
        'control-sm': '28px',
        'control-md': '36px',
        'control-lg': '40px',
        topbar: '56px',
        row: '44px',
      },

      width: {
        sidebar: '236px',
        control: '32px',
        'control-sm': '28px',
        'control-md': '36px',
        'control-lg': '40px',
      },

      transitionDuration: {
        instant: '80ms',
        fast: '130ms',
        DEFAULT: '180ms',
      },

      transitionTimingFunction: {
        brand: 'cubic-bezier(0.2, 0.6, 0.3, 1)',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },

      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.2,0.6,0.3,1) both',
        rise: 'fade-in 180ms cubic-bezier(0.2,0.6,0.3,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config
