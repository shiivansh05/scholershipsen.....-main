/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mist: {
          DEFAULT: '#E6EDEF',
          dark: '#D9E3E6',
          light: '#EFF4F5',
        },
        paper: {
          DEFAULT: '#F6F9F9',
          card: '#FFFFFF',
          hover: '#EFF4F5',
        },
        ink: {
          DEFAULT: '#12262E',
          light: '#253E47',
          dark: '#0A171D',
        },
        steel: {
          DEFAULT: '#6B8794',
          light: '#98ADB8',
          dark: '#48606B',
          faint: '#D2DDE1',
        },
        petrol: {
          DEFAULT: '#0F4C5C',
          hover: '#0A3844',
          light: '#1B6579',
          subtle: '#E5F1F4',
        },
        harbor: {
          DEFAULT: '#0A2A33',
          surface: '#0F3642',
          border: '#1A4856',
          muted: '#133945',
        },
        signal: {
          DEFAULT: '#E0452B',
          dark: '#B8321B',
          subtle: '#FDEDEA',
        },
        amber: {
          DEFAULT: '#E8A02A',
          dark: '#BA7A16',
          subtle: '#FEF6E8',
        },
        sea: {
          DEFAULT: '#2F9E8F',
          dark: '#21786D',
          subtle: '#EAF7F5',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Public Sans"', 'sans-serif'],
      },
      fontSize: {
        '12': ['12px', '16px'],
        '14': ['14px', '20px'],
        '16': ['16px', '24px'],
        '20': ['20px', '28px'],
        '28': ['28px', '34px'],
        '44': ['44px', '52px'],
      },
      boxShadow: {
        'panel': '0 2px 8px -2px rgba(15, 76, 92, 0.08), 0 1px 3px 0 rgba(15, 76, 92, 0.04)',
        'elevated': '0 8px 24px -4px rgba(15, 76, 92, 0.12), 0 2px 6px -1px rgba(15, 76, 92, 0.06)',
        'floating': '0 20px 40px -8px rgba(15, 76, 92, 0.20), 0 4px 12px -2px rgba(15, 76, 92, 0.10)',
        'harbor-glow': '0 0 24px -4px rgba(15, 76, 92, 0.4)',
      },
    },
  },
  plugins: [],
}
