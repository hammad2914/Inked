import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        body:    ['Inter Tight', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
        hand:    ['Caveat', 'cursive'],
      },
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT:              'hsl(var(--sidebar-background))',
          foreground:           'hsl(var(--sidebar-foreground))',
          primary:              'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent:               'hsl(var(--sidebar-accent))',
          'accent-foreground':  'hsl(var(--sidebar-accent-foreground))',
          border:               'hsl(var(--sidebar-border))',
          ring:                 'hsl(var(--sidebar-ring))',
        },
        /* ink palette: the older names map onto it so every screen shares one look */
        pen:      { DEFAULT: '#1D3FD8', done: '#9FB0F2' },
        print:    '#1F2227',
        graphite: '#8C877D',
        wall:     '#D8D4CA',
        paper:    '#FCFBF7',
        rule:     '#D9D4C8',
        indigo:  { DEFAULT: '#1D3FD8', light: '#4A63E0', dark: '#1633B0' },
        violet:  { DEFAULT: '#1F2227', light: '#5E5A52', dark: '#000000' },
        cyan:    { DEFAULT: '#1D3FD8', light: '#4A63E0', dark: '#1633B0' },
        success: { DEFAULT: '#2E7D4F', light: '#4C9A6B', dark: '#21603B' },
        warning: { DEFAULT: '#A8650F', light: '#C98A2E', dark: '#82500C' },
        danger:  { DEFAULT: '#D2381F', light: '#E2604B', dark: '#A82A16' },
        /* surface layers — CSS-var based, theme-aware (rgb triplet for alpha-modifier support) */
        base:     'rgb(var(--color-base-rgb) / <alpha-value>)',
        surface:  'rgb(var(--color-surface-rgb) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated-rgb) / <alpha-value>)',
        /* theme-aware tint (white in dark / dark-slate in light) */
        tint:     'rgb(var(--tint) / <alpha-value>)',
      },
      borderRadius: {
        '2xl': '6px',
        xl:    '5px',
        lg:    '4px',
        md:    '3px',
        sm:    '3px',
        xs:    '2px',
      },
      boxShadow: {
        'glow-sm':  'none',
        'glow':     'none',
        'glow-lg':  'none',
        'card':     '0 14px 26px -22px rgba(50,40,20,.55)',
        'card-hover': '0 18px 30px -20px rgba(50,40,20,.6)',
        'modal':    '0 30px 60px -28px rgba(50,40,20,.6)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'fade-in':         'fade-in 0.25s ease-out both',
        'fade-up':         'fade-up 0.3s ease-out both',
        'scale-in':        'scale-in 0.2s ease-out both',
        'slide-in-left':   'slide-in-left 0.25s ease-out both',
        'pulse-glow':      'pulse-glow 2s ease-in-out infinite',
        shimmer:           'shimmer 1.5s infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
