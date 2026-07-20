/** @type {import('tailwindcss').Config} */
module.exports = {
  // el modo oscuro solo se activa si yo pongo la clase "dark", no automatico
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      colors: {
        // mi paleta real de gia
        "deep-ocean": "#3C5160",
        "ocean-vivo": "#2C4A63",
        "sky": "#A9B5C2",
        "clouds": "#BCC1C4",
        "ivoire": "#FAF8F6",
        "gris-piedra": "#BAB3AE",
        "douche": "#DDD6CE",
        "noyer": "#A9895C",
        "noyer-claro": "#C7A876",
        "mantequilla": "#F0DFA8",

        // fondos del modo oscuro, gris azulado calido
        "noche": "#232830",
        "noche-suave": "#2C323C",
        "noche-borde": "#3A4150",
      },

      keyframes: {
        // el tornillo gira unos grados y vuelve, como si apretaras
        apretarTornillo: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '40%': { transform: 'rotate(14deg)' },
          '70%': { transform: 'rotate(10deg)' },
        },
        // la tuerca sube ligeramente al apretarse
        subirTuerca: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-2px)' },
          '70%': { transform: 'translateY(-1px)' },
        },
      },
      animation: {
        'apretar-tornillo': 'apretarTornillo 4s ease-in-out infinite',
        'subir-tuerca': 'subirTuerca 4s ease-in-out infinite',
      },
    },
  },

  plugins: [],
}