// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#212121', // tono principal, fuerte y neutro (puede usarse como base o textos)
          secondary: '#7F7F7F', // gris oscuro para contraste secundario
          accent: '#A1A1A1', // gris medio para destacar elementos (botones, iconos)
          error: '#8B0A1A', // rojo binotinto más oscuro y no tan brinllante
          info: '#64748B', // gris claro, buen apoyo para secciones informativas
          success: '#8BC34A', // verde pastel, un poco más claro que el éxito, pero no tanto como el warning)
          warning: '#bf9000', // gris muy claro, como fondo de avisos
        },
      },
    },
  },
})
