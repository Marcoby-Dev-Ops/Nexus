import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Extended UI state colors
        'primary-subtle': 'hsl(var(--primary-subtle))',
        'primary-hover': 'hsl(var(--primary-hover))',
        'secondary-subtle': 'hsl(var(--secondary-subtle))',
        'muted-subtle': 'hsl(var(--muted-subtle))',
        'muted-hover': 'hsl(var(--muted-hover))',
        'unread-bg': 'hsl(var(--unread-bg))',
        'unread-border': 'hsl(var(--unread-border))',
        'selected-bg': 'hsl(var(--selected-bg))',
        'hover-bg': 'hsl(var(--hover-bg))',
        purple: {
          DEFAULT: 'hsl(var(--purple))',
          foreground: 'hsl(var(--purple-foreground))',
        },
        'gray-alt': {
          DEFAULT: 'hsl(var(--gray-alt))',
          foreground: 'hsl(var(--gray-alt-foreground))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--tertiary-foreground))',
        },
      },
      fontFamily: {
        sans: ['Noto Sans Nexus', 'Noto Sans', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        emphasis: ['Open Sans Nexus', 'Noto Sans Nexus', 'Noto Sans', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Open Sans Nexus', 'Noto Sans Nexus', 'Noto Sans', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        technical: ['Roboto Nexus', 'Open Sans Nexus', 'Noto Sans Nexus', 'Noto Sans', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['14px', '20px'], // Increased from 12px to 14px
        'sm': ['16px', '24px'], // Increased from 14px to 16px
        'base': ['18px', '28px'], // Increased from 16px to 18px
        'lg': ['20px', '28px'], // Increased from 18px to 20px
        'xl': ['24px', '32px'], // Increased from 20px to 24px
        '2xl': ['30px', '36px'], // Increased from 24px to 30px
        '3xl': ['36px', '40px'], // Increased from 30px to 36px
        '4xl': ['48px', '48px'], // Increased from 36px to 48px
        '5xl': ['60px', '60px'], // Increased from 48px to 60px
        '6xl': ['72px', '72px'], // Increased from 60px to 72px
        '7xl': ['96px', '96px'], // Increased from 72px to 96px
        '8xl': ['128px', '128px'], // Increased from 96px to 128px
        '9xl': ['144px', '144px'], // Increased from 128px to 144px
      },
      zIndex: {
        'base': '1',
        'elevated': '10', 
        'sticky': '20',
        'overlay': '30',
        'dropdown': '40',
        'drawer': '50',
        'modal': '60',
        'notification': '70',
        'critical': '80',
        'maximum': '9999',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config

export default config 
