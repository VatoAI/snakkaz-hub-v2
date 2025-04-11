/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        snakkaz: {
          blue: '#2563eb',    // Blå farge fra logoen
          red: '#dc2626',     // Rød farge fra logoen
          dark: '#000000',    // Ren sort bakgrunn
          darker: '#0A0A0A',  // Litt lysere sort for kontrast
          light: '#f8fafc',   // Lys tekst
        },
        cyberdark: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        cybergold: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        cyberblue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      backgroundImage: {
        'gradient-snakkaz': 'linear-gradient(135deg, rgba(37, 99, 235, 0.8) 0%, rgba(220, 38, 38, 0.8) 100%)',
        'gradient-snakkaz-hover': 'linear-gradient(135deg, rgba(29, 78, 216, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
        'gradient-snakkaz-dark': 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
        'gradient-snakkaz-border': 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)',
        'gradient-snakkaz-glow': 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
      },
      boxShadow: {
        'snakkaz': '0 0 20px rgba(37, 99, 235, 0.1), 0 0 40px rgba(220, 38, 38, 0.05)',
        'snakkaz-hover': '0 0 30px rgba(37, 99, 235, 0.2), 0 0 60px rgba(220, 38, 38, 0.1)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "gradient-shift": {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
            filter: 'brightness(1) saturate(1)'
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            filter: 'brightness(1.2) saturate(1.2)'
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-shift": "gradient-shift 3s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 