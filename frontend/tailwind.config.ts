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
        heading: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
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
        /* brand tokens */
        indigo:  { DEFAULT: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
        violet:  { DEFAULT: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
        cyan:    { DEFAULT: '#06B6D4', light: '#22D3EE', dark: '#0891B2' },
        success: { DEFAULT: '#10B981', light: '#34D399', dark: '#059669' },
        warning: { DEFAULT: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
        danger:  { DEFAULT: '#EF4444', light: '#F87171', dark: '#DC2626' },
        /* surface layers — CSS-var based, theme-aware (rgb triplet for alpha-modifier support) */
        base:     'rgb(var(--color-base-rgb) / <alpha-value>)',
        surface:  'rgb(var(--color-surface-rgb) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated-rgb) / <alpha-value>)',
        /* theme-aware tint (white in dark / dark-slate in light) */
        tint:     'rgb(var(--tint) / <alpha-value>)',
      },
      borderRadius: {
        '2xl': '16px',
        xl:    '12px',
        lg:    '10px',
        md:    '8px',
        sm:    '6px',
        xs:    '4px',
      },
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(99,102,241,0.25)',
        'glow':     '0 0 20px rgba(99,102,241,0.30), 0 0 40px rgba(99,102,241,0.10)',
        'glow-lg':  '0 0 40px rgba(99,102,241,0.35), 0 0 80px rgba(99,102,241,0.15)',
        'card':     '0 4px 24px rgba(0,0,0,0.35)',
        'card-hover': '0 8px 32px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.3)',
        'modal':    '0 24px 64px rgba(0,0,0,0.6)',
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
