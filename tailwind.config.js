/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./src/**/*.{html,js,vue}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          ...colors.indigo,
        },
        slate: {
          50: '#f8fafc',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

