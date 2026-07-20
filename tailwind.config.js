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
        // el tornillo gira mas marcado, como si apretaras de verdad
        apretarTornillo: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '35%': { transform: 'rotate(30deg)' },
          '60%': { transform: 'rotate(24deg)' },
          '80%': { transform: 'rotate(28deg)' },
        },
        // la tuerca sube mas al apretarse
        subirTuerca: {
          '0%, 100%': { transform: 'translateY(0)' },
          '35%': { transform: 'translateY(-5px)' },
          '60%': { transform: 'translateY(-3px)' },
          '80%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'apretar-tornillo': 'apretarTornillo 3s ease-in-out infinite',
        'subir-tuerca': 'subirTuerca 3s ease-in-out infinite',
      },

    },
  },

  plugins: [],
}