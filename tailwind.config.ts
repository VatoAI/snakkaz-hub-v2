
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
        theme: {
          50: "#f6f8fd",
          100: "#f1f4fc",
          200: "#e5ebf9",
          300: "#d1dcf5",
          400: "#b3c5ef",
          500: "#8aa5e6",
          600: "#6684dc",
          700: "#4a66cd",
          800: "#3d52b0",
          900: "#354790",
          950: "#232d54",
        },
        // Add cyberpunk theme colors with direct color values
        cyberblue: {
          50: "#e6f7ff",
          100: "#b3e0ff",
          200: "#80caff",
          300: "#4db3ff",
          400: "#1a9dff",
          500: "#0088ff",
          600: "#006bb3",
          700: "#004d80",
          800: "#00304d",
          900: "#00121a",
          950: "#000a0d",
        },
        cyberdark: {
          50: "#f5f5f5",
          100: "#e6e6e6",
          200: "#cccccc",
          300: "#b3b3b3",
          400: "#999999",
          500: "#808080",
          600: "#666666",
          700: "#4d4d4d",
          800: "#333333",
          900: "#1a1a1a",
          950: "#0a0a0a",
        },
        cybergold: {
          50: "#fff9e6",
          100: "#ffedb3",
          200: "#ffe180",
          300: "#ffd54d",
          400: "#ffc91a",
          500: "#e6b300",
          600: "#b38a00",
          700: "#806200",
          800: "#4d3a00",
          900: "#1a1300",
          950: "#0d0a00",
        },
        cyberred: {
          50: "#ffe6e6",
          100: "#ffb3b3",
          200: "#ff8080",
          300: "#ff4d4d",
          400: "#ff1a1a",
          500: "#e60000",
          600: "#b30000",
          700: "#800000",
          800: "#4d0000",
          900: "#1a0000",
          950: "#0d0000",
        },
      },
      boxShadow: {
        'neon-blue': '0 0 5px theme(colors.cyberblue.400), 0 0 20px theme(colors.cyberblue.500)',
        'neon-gold': '0 0 5px theme(colors.cybergold.400), 0 0 20px theme(colors.cybergold.500)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px theme(colors.cyberblue.400), 0 0 20px theme(colors.cyberblue.500)' },
          '50%': { boxShadow: '0 0 10px theme(colors.cyberblue.400), 0 0 30px theme(colors.cyberblue.500)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s infinite',
        'spin-slow': 'spin-slow 10s linear infinite',
        'gradient': 'gradient 8s ease infinite',
        fadeIn: "fadeIn 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
