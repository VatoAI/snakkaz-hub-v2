
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
        // Add cyberpunk theme colors
        cyberblue: {
          50: "hsl(var(--cyberblue-50))",
          100: "hsl(var(--cyberblue-100))",
          200: "hsl(var(--cyberblue-200))",
          300: "hsl(var(--cyberblue-300))",
          400: "hsl(var(--cyberblue-400))",
          500: "hsl(var(--cyberblue-500))",
          600: "hsl(var(--cyberblue-600))",
          700: "hsl(var(--cyberblue-700))",
          800: "hsl(var(--cyberblue-800))",
          900: "hsl(var(--cyberblue-900))",
          950: "hsl(var(--cyberblue-950))",
        },
        cyberdark: {
          50: "hsl(var(--cyberdark-50))",
          100: "hsl(var(--cyberdark-100))",
          200: "hsl(var(--cyberdark-200))",
          300: "hsl(var(--cyberdark-300))",
          400: "hsl(var(--cyberdark-400))",
          500: "hsl(var(--cyberdark-500))",
          600: "hsl(var(--cyberdark-600))",
          700: "hsl(var(--cyberdark-700))",
          800: "hsl(var(--cyberdark-800))",
          900: "hsl(var(--cyberdark-900))",
          950: "hsl(var(--cyberdark-950))",
        },
        cybergold: {
          50: "hsl(var(--cybergold-50))",
          100: "hsl(var(--cybergold-100))",
          200: "hsl(var(--cybergold-200))",
          300: "hsl(var(--cybergold-300))",
          400: "hsl(var(--cybergold-400))",
          500: "hsl(var(--cybergold-500))",
          600: "hsl(var(--cybergold-600))",
          700: "hsl(var(--cybergold-700))",
          800: "hsl(var(--cybergold-800))",
          900: "hsl(var(--cybergold-900))",
          950: "hsl(var(--cybergold-950))",
        },
        cyberred: {
          50: "hsl(var(--cyberred-50))",
          100: "hsl(var(--cyberred-100))",
          200: "hsl(var(--cyberred-200))",
          300: "hsl(var(--cyberred-300))",
          400: "hsl(var(--cyberred-400))",
          500: "hsl(var(--cyberred-500))",
          600: "hsl(var(--cyberred-600))",
          700: "hsl(var(--cyberred-700))",
          800: "hsl(var(--cyberred-800))",
          900: "hsl(var(--cyberred-900))",
          950: "hsl(var(--cyberred-950))",
        },
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
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradient: {
          "0%, 100%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        gradient: "gradient 8s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
