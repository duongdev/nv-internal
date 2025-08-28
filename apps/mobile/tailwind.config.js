const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
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
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
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
      fontFamily: {
        // airbnb: ['AirbnbCereal-Book', 'ui-sans-serif'],
        // 'airbnb-black': ['AirbnbCereal-Black', 'ui-sans-serif'],
        // 'airbnb-bold': ['AirbnbCereal-Bold', 'ui-sans-serif'],
        // 'airbnb-extrabold': ['AirbnbCereal-ExtraBold', 'ui-sans-serif'],
        // 'airbnb-light': ['AirbnbCereal-Light', 'ui-sans-serif'],
        // 'airbnb-medium': ['AirbnbCereal-Medium', 'ui-sans-serif'],
        system: ['Gilroy-Regular', 'ui-sans-serif'],
        gilroy: ['Gilroy-Regular', 'ui-sans-serif'],
        'gilroy-bold': ['Gilroy-Bold', 'ui-sans-serif'],
        'gilroy-medium': ['Gilroy-Medium', 'ui-sans-serif'],
        'gilroy-semibold': ['Gilroy-SemiBold', 'ui-sans-serif'],
        'gilroy-extrabold': ['Gilroy-Black', 'ui-sans-serif'],
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
