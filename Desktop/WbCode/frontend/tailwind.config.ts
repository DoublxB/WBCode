import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4c6ef5',
        accent: '#ff6b6b',
        success: '#2ecc71'
      }
    }
  },
  plugins: []
} satisfies Config;



