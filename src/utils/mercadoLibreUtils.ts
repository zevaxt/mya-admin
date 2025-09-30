/**
 * Utilidades para interactuar con Mercado Libre
 */

/**
 * Abre una publicación de Mercado Libre en una nueva pestaña
 * @param productId ID de la publicación (ej: MCO123456789)
 */
export const openInMercadoLibre = (productId: string): void => {
  if (!productId) return
  
  // Obtener el código de país (primeros 3 caracteres)
  const siteId = productId.substring(0, 3).toLowerCase()
  
  // Obtener el ID numérico (resto del string)
  const numericId = productId.substring(3)
  
  // Construir la URL según el formato de Mercado Libre
  let url: string
  
  // Diferentes países tienen diferentes formatos de URL
  switch (siteId) {
    case 'mco': // Colombia
      url = `https://articulo.mercadolibre.com.co/${siteId}-${numericId}`
      break
    case 'mla': // Argentina
      url = `https://articulo.mercadolibre.com.ar/${siteId}-${numericId}`
      break
    case 'mlm': // México
      url = `https://articulo.mercadolibre.com.mx/${siteId}-${numericId}`
      break
    case 'mlb': // Brasil
      url = `https://produto.mercadolivre.com.br/${siteId}-${numericId}`
      break
    case 'mlc': // Chile
      url = `https://articulo.mercadolibre.cl/${siteId}-${numericId}`
      break
    case 'mpe': // Perú
      url = `https://articulo.mercadolibre.com.pe/${siteId}-${numericId}`
      break
    case 'mlu': // Uruguay
      url = `https://articulo.mercadolibre.com.uy/${siteId}-${numericId}`
      break
    case 'mlv': // Venezuela
      url = `https://articulo.mercadolibre.com.ve/${siteId}-${numericId}`
      break
    case 'mpa': // Panamá
      url = `https://articulo.mercadolibre.com.pa/${siteId}-${numericId}`
      break
    case 'mrd': // República Dominicana
      url = `https://articulo.mercadolibre.com.do/${siteId}-${numericId}`
      break
    case 'mec': // Ecuador
      url = `https://articulo.mercadolibre.com.ec/${siteId}-${numericId}`
      break
    case 'mcr': // Costa Rica
      url = `https://articulo.mercadolibre.co.cr/${siteId}-${numericId}`
      break
    default:
      // URL genérica para otros países
      url = `https://${siteId}.mercadolibre.com/MLM-${numericId}`
  }
  
  // Abrir en nueva pestaña
  window.open(url, '_blank')
}

/**
 * Formatea un ID de producto para mostrar en la interfaz
 * @param productId ID de la publicación (ej: MCO123456789)
 * @returns ID formateado (ej: MCO-123456789)
 */
export const formatProductId = (productId: string): string => {
  if (!productId || productId.length < 4) return productId
  return `${productId.substring(0, 3)}-${productId.substring(3)}`
}
