import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        // Disrupt brand
        mint: {
          DEFAULT: '#74f0bd',
          50: '#edfdf5',
          100: '#d4fae7',
          200: '#acf4d3',
          300: '#74f0bd',
          400: '#3de0a0',
          500: '#15c785',
          600: '#0aa26c',
          700: '#098259',
          800: '#0b6648',
          900: '#0a543d',
        },
        dark: {
          DEFAULT: '#262626',
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#262626',
        },
        chart: {
          '1': '#74f0bd',
          '2': '#3de0a0',
          '3': '#15c785',
          '4': '#0aa26c',
          '5': '#098259',
        },
        /** Client + login theme (smart A.R.S.E) — keep dashboard on mint/dark + Inter */
        arse: {
          cyan: '#00ffff',
          pink: '#ff00e6',
          black: '#000000',
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-dm-serif)'],
        'arse-smart': ['var(--font-vintage-goods)', 'cursive'],
        'arse-title': ['var(--font-raleway)', 'system-ui', 'sans-serif'],
        'arse-body': ['var(--font-dm-sans-arse)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
