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
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

