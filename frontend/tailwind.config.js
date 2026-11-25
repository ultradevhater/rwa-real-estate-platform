/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        jakarta: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
      },
      colors: {
        brand: {
          50: "#fbf6f6",
          100: "#f6eded",
          200: "#edd2d2",
          500: "#b91c1c",
          600: "#991b1b",
          700: "#7f1d1d",
          800: "#601414",
          900: "#450e0e",
        },
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
      },
    },
  },
  plugins: [],
};
