import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Konnexy Frente de Caixa',
    short_name: 'Konnexy PDV',
    description: 'Sistema de Frente de Caixa com funcionamento offline',
    start_url: '/pdv',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#09090b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
