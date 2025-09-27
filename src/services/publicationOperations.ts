import { migrationService } from '@/services/migrationService'

/**
 * Función para popular un producto específico
 * @param accountId ID de la cuenta
 * @param productId ID del producto a popular
 * @returns Objeto con el resultado de la operación
 */
export const populateProduct = async (
  accountId: number,
  productId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Populate individual - Product ID:', productId, 'Account ID:', accountId)
    
    if (!productId) {
      console.error('ID de producto indefinido o vacío en populate individual')
      return {
        success: false,
        message: 'Error: ID de producto no válido'
      }
    }
    
    // Usar el método correcto del servicio
    const result = await migrationService.updateProductPopulate(accountId, productId)

    if (result && result.success) {
      return {
        success: true,
        message: result.message || 'Publicación populada correctamente'
      }
    } else {
      return {
        success: false,
        message: 'Error al hacer populate de la publicación'
      }
    }
  } catch (err) {
    console.error(`Error al hacer populate del producto ${productId}:`, err)
    return {
      success: false,
      message: 'Error al hacer populate de la publicación'
    }
  }
}

/**
 * Otras operaciones relacionadas con publicaciones pueden agregarse aquí
 */

export default {
  populateProduct
}
