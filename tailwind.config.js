/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        stage: {
          DEFAULT: "#43208f",
          light: "#6a3ad1",
          dark: "#241056",
          gold: "#c7a24a",
          amber: "#f2d28a",
          cream: "#faf6ee",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        "warm-sm": "0 1px 2px rgba(36, 16, 86, 0.05)",
        warm: "0 1px 3px rgba(36, 16, 86, 0.06), 0 4px 14px -6px rgba(36, 16, 86, 0.14)",
        "warm-lg":
          "0 2px 6px rgba(36, 16, 86, 0.05), 0 14px 32px -12px rgba(36, 16, 86, 0.22)",
        "warm-xl":
          "0 4px 10px rgba(36, 16, 86, 0.06), 0 24px 56px -16px rgba(36, 16, 86, 0.3)",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "Cambria", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-from-top": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-150%)" },
          "100%": { transform: "translateX(150%)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(200,162,74,0.25)",
          },
          "50%": {
            boxShadow: "0 0 0 8px rgba(200,162,74,0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.25s ease-out",
        "accordion-up": "accordion-up 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.25s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.2s ease-out",
        shimmer: "shimmer 2.2s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
      backgroundImage: {
        "stage-gradient": "linear-gradient(135deg, #241056 0%, #43208f 45%, #6a3ad1 100%)",
        "stage-gradient-soft": "linear-gradient(150deg, #43208f 0%, #6a3ad1 60%, #8b5cf6 100%)",
        "gold-gradient": "linear-gradient(135deg, #f2d28a 0%, #c7a24a 100%)",
        "gold-gradient-soft": "linear-gradient(135deg, rgba(242,210,138,0.25) 0%, rgba(199,162,74,0.12) 100%)",
        "mesh-pattern":
          "radial-gradient(circle at 18% 0%, rgba(67,32,143,0.07) 0%, transparent 62%), radial-gradient(circle at 82% 0%, rgba(199,162,74,0.07) 0%, transparent 62%), radial-gradient(circle at 50% 110%, rgba(36,16,86,0.06) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};
