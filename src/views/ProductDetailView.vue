<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <span class="text-h5">Detalles del Producto</span>
              <div class="text-subtitle-2 text-grey" v-if="product">ID: {{ product.ID }}</div>
            </div>
            <div class="d-flex justify-end">
              <v-btn
                color="secondary"
                variant="outlined"
                @click="goBack"
                prepend-icon="mdi-arrow-left"
              >
                Volver
              </v-btn>
            </div>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text v-if="loading">
            <div class="d-flex justify-center align-center" style="height: 400px">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            </div>
          </v-card-text>

          <v-card-text v-else-if="product">
            <!-- Información básica y carrusel de imágenes -->
            <v-row>
              <!-- Carrusel de imágenes -->
              <v-col cols="12" md="6">
                <v-carousel
                  v-if="product.Attributes?.pictures && product.Attributes.pictures.length > 0"
                  height="400"
                  hide-delimiters
                  show-arrows="hover"
                >
                  <v-carousel-item
                    v-for="picture in product.Attributes.pictures"
                    :key="picture.id"
                    :src="picture.secure_url || picture.url"
                    cover
                  ></v-carousel-item>
                </v-carousel>
                <v-img
                  v-else
                  src="https://via.placeholder.com/400x400?text=Sin+imagen"
                  height="400"
                  cover
                  class="bg-grey-lighten-2"
                ></v-img>
              </v-col>

              <!-- Información básica -->
              <v-col cols="12" md="6">
                <h2 class="text-h4 mb-4">{{ product.Attributes?.title || 'Sin título' }}</h2>

                <v-list density="compact" class="bg-grey-lighten-5 rounded mb-4">
                  <v-list-item>
                    <v-list-item-title>Precio</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatPrice(product.Attributes?.price || 0) }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Estado</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="product.Attributes?.status === 'active' ? 'success' : 'error'"
                        size="small"
                      >
                        {{ product.Attributes?.status === 'active' ? 'Activo' : 'Inactivo' }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="product.Attributes?.condition">
                    <v-list-item-title>Condición</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ product.Attributes?.condition === 'new' ? 'Nuevo' : 'Usado' }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Cantidad disponible</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ product.Attributes?.available_quantity || 0 }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="product.Attributes?.sold_quantity !== undefined">
                    <v-list-item-title>Cantidad vendida</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ product.Attributes?.sold_quantity || 0 }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Categoría</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ product.Attributes?.category_id || '-' }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="product.Attributes?.warranty">
                    <v-list-item-title>Garantía</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ product.Attributes?.warranty || 'Sin garantía' }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-btn
                  v-if="product.Attributes?.permalink"
                  color="primary"
                  class="mt-2"
                  @click="openInMercadoLibre"
                  prepend-icon="mdi-open-in-new"
                >
                  Ver en Mercado Libre
                </v-btn>
              </v-col>
            </v-row>

            <!-- Pestañas con información detallada -->
            <v-tabs v-model="activeTab" class="mt-6">
              <v-tab value="attributes">Atributos</v-tab>
              <v-tab value="shipping">Envío</v-tab>
              <v-tab
                value="description"
                v-if="
                  product.Attributes?.descriptions && product.Attributes.descriptions.length > 0
                "
                >Descripción</v-tab
              >
              <v-tab value="location" v-if="product.Attributes?.seller_address">Ubicación</v-tab>
              <v-tab value="json">JSON Completo</v-tab>
            </v-tabs>

            <v-window v-model="activeTab" class="mt-2">
              <!-- Atributos -->
              <v-window-item value="attributes">
                <v-card variant="flat">
                  <v-card-text>
                    <v-table
                      v-if="
                        product.Attributes?.attributes && product.Attributes.attributes.length > 0
                      "
                    >
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nombre</th>
                          <th>Valor</th>
                          <th>Grupo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="attr in product.Attributes.attributes" :key="attr.id">
                          <td>{{ attr.id }}</td>
                          <td>{{ attr.name }}</td>
                          <td>
                            <span v-if="attr.value_name">{{ attr.value_name }}</span>
                            <span v-else-if="attr.values && attr.values.length > 0">
                              {{ attr.values.map((v: { name: string }) => v.name).join(', ') }}
                            </span>
                            <span v-else>-</span>
                          </td>
                          <td>{{ attr.attribute_group_name || '-' }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                    <v-alert v-else type="info" class="mt-2">
                      No hay atributos disponibles
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-window-item>

              <!-- Envío -->
              <v-window-item value="shipping">
                <v-card variant="flat">
                  <v-card-text>
                    <v-list density="compact" class="bg-grey-lighten-5 rounded">
                      <v-list-item>
                        <v-list-item-title>Modo de envío</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ product.Attributes?.shipping?.mode || 'No especificado' }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Envío gratis</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            :color="
                              product.Attributes?.shipping?.free_shipping ? 'success' : 'error'
                            "
                            size="small"
                          >
                            {{ product.Attributes?.shipping?.free_shipping ? 'Sí' : 'No' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Retiro en local</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            :color="
                              product.Attributes?.shipping?.local_pick_up ? 'success' : 'error'
                            "
                            size="small"
                          >
                            {{ product.Attributes?.shipping?.local_pick_up ? 'Sí' : 'No' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Retiro en tienda</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            :color="
                              product.Attributes?.shipping?.store_pick_up ? 'success' : 'error'
                            "
                            size="small"
                          >
                            {{ product.Attributes?.shipping?.store_pick_up ? 'Sí' : 'No' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item
                        v-if="
                          product.Attributes?.shipping?.tags &&
                          product.Attributes.shipping.tags.length > 0
                        "
                      >
                        <v-list-item-title>Etiquetas</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip-group>
                            <v-chip
                              v-for="(tag, index) in product.Attributes.shipping.tags"
                              :key="index"
                              size="small"
                              variant="outlined"
                            >
                              {{ tag }}
                            </v-chip>
                          </v-chip-group>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-window-item>

              <!-- Descripción -->
              <v-window-item value="description">
                <v-card variant="flat">
                  <v-card-text>
                    <div
                      v-if="
                        product.Attributes?.descriptions &&
                        product.Attributes.descriptions.length > 0
                      "
                    >
                      <div
                        v-for="(description, index) in product.Attributes.descriptions"
                        :key="index"
                        class="mb-4"
                      >
                        <div
                          class="text-body-1 bg-grey-lighten-5 pa-4 rounded"
                          style="white-space: pre-line"
                        >
                          {{ description }}
                        </div>
                      </div>
                    </div>
                    <v-alert v-else type="info" class="mt-2">
                      No hay descripción disponible
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-window-item>

              <!-- Ubicación -->
              <v-window-item value="location">
                <v-card variant="flat">
                  <v-card-text>
                    <v-list density="compact" class="bg-grey-lighten-5 rounded">
                      <v-list-item v-if="product.Attributes?.seller_address?.address_line">
                        <v-list-item-title>Dirección</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ product.Attributes.seller_address.address_line }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="product.Attributes?.seller_address?.city">
                        <v-list-item-title>Ciudad</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ product.Attributes.seller_address.city.name }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="product.Attributes?.seller_address?.state">
                        <v-list-item-title>Estado/Provincia</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ product.Attributes.seller_address.state.name }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="product.Attributes?.seller_address?.country">
                        <v-list-item-title>País</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ product.Attributes.seller_address.country.name }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="product.Attributes?.seller_address?.zip_code">
                        <v-list-item-title>Código Postal</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ product.Attributes.seller_address.zip_code }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-window-item>

              <!-- JSON Completo -->
              <v-window-item value="json">
                <v-card variant="flat">
                  <v-card-text>
                    <div class="d-flex justify-end mb-2">
                      <v-btn
                        color="primary"
                        variant="text"
                        size="small"
                        @click="copyToClipboard(JSON.stringify(product, null, 2))"
                      >
                        <v-icon start>mdi-content-copy</v-icon>
                        Copiar JSON
                      </v-btn>
                    </div>
                    <div class="json-viewer pa-2 bg-grey-lighten-5 rounded">
                      <pre class="overflow-auto" style="max-height: 400px">{{
                        JSON.stringify(product, null, 2)
                      }}</pre>
                    </div>
                  </v-card-text>
                </v-card>
              </v-window-item>
            </v-window>
          </v-card-text>

          <v-card-text v-else>
            <v-alert type="warning">
              No se encontró información del producto. Por favor, vuelve a la lista de productos e
              intenta nuevamente.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar para notificaciones -->
    <v-snackbar v-model="showNotification" :color="notificationType" timeout="3000">
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showNotification = false"></v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import migrationService from '@/services/migrationService'
import { useAccountStore } from '@/stores/account'

// Interfaces
// Importar la interfaz del servicio de migración
import type { ProductDetail } from '@/services/migrationService'

// Obtener el ID del producto de la URL y el store de cuentas
const route = useRoute()
const accountStore = useAccountStore()

// Estado
const product = ref<ProductDetail | null>(null)
const activeTab = ref('attributes')
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const loading = ref(false)

// Cargar datos del producto directamente desde la API
onMounted(async () => {
  const productId = route.params.id as string
  if (!productId) {
    showNotification.value = true
    notificationMessage.value = 'ID de producto no especificado'
    notificationType.value = 'error'
    return
  }

  const accountId = accountStore.currentAccount?.ID
  if (!accountId) {
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta para ver los detalles del producto'
    notificationType.value = 'error'
    return
  }

  loading.value = true

  try {
    // Obtener los detalles del producto directamente desde la API
    const response = await migrationService.getProductDetail(accountId, productId)

    // Verificar si la respuesta tiene la estructura esperada
    if (response && response.Attributes) {
      product.value = response as ProductDetail
    } else {
      showNotification.value = true
      notificationMessage.value = 'Error en el formato de la respuesta'
      notificationType.value = 'error'
    }
  } catch (error) {
    console.error(`Error al obtener detalles del producto ${productId}:`, error)
    showNotification.value = true
    notificationMessage.value = 'Error al obtener detalles del producto'
    notificationType.value = 'error'
  } finally {
    loading.value = false
  }
})

// Métodos
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price)
}

const openInMercadoLibre = () => {
  if (product.value?.Attributes?.permalink) {
    window.open(product.value.Attributes.permalink, '_blank')
  }
}

// La función goToEditPage ha sido eliminada ya que no se necesita la página de edición

const goBack = () => {
  window.history.back()
}

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification.value = true
      notificationMessage.value = 'Texto copiado al portapapeles'
      notificationType.value = 'success'
    })
    .catch((err) => {
      console.error('Error al copiar texto: ', err)
      showNotification.value = true
      notificationMessage.value = 'Error al copiar texto'
      notificationType.value = 'error'
    })
}
</script>

<style scoped>
.json-viewer {
  font-family: monospace;
  font-size: 14px;
}
</style>
