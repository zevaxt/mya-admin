/**
 * Configuración de autenticación
 * Este archivo contiene las configuraciones relacionadas con la autenticación y sesiones
 */

export const AUTH_CONFIG = {
  /**
   * Tiempo en milisegundos antes de que expire el token para intentar renovarlo
   * Por defecto: 8 horas (28800000 ms)
   * 
   * Valores comunes:
   * - 15 minutos: 900000
   * - 30 minutos: 1800000
   * - 1 hora: 3600000
   * - 4 horas: 14400000
   * - 8 horas: 28800000
   * - 12 horas: 43200000
   */
  TOKEN_REFRESH_THRESHOLD_MS: 28800000, // 8 horas en milisegundos

  /**
   * Tiempo mínimo en milisegundos antes de que expire el token para mostrar advertencias
   * Por defecto: 1 hora (3600000 ms)
   */
  TOKEN_WARNING_THRESHOLD_MS: 3600000, // 1 hora en milisegundos

  /**
   * Intervalo en milisegundos para verificar el estado del token
   * Por defecto: 30 minutos (1800000 ms)
   * 
   * Valores comunes:
   * - 5 minutos: 300000
   * - 15 minutos: 900000
   * - 30 minutos: 1800000
   * - 60 minutos: 3600000
   */
  TOKEN_CHECK_INTERVAL_MS: 1800000, // 30 minutos
}

export default AUTH_CONFIG
