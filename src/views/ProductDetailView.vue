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
                <div
                  v-if="product.Attributes?.pictures && product.Attributes.pictures.length > 0"
                  class="position-relative"
                >
                  <!-- Imagen principal -->
                  <div
                    class="d-flex justify-center align-center"
                    style="min-height: 300px; max-height: 400px;"
                  >
                    <v-img
                      v-if="currentPicture"
                      :src="currentPicture.secure_url || currentPicture.url"
                      height="auto"
                      width="auto"
                      max-height="400"
                      max-width="100%"
                      contain
                      class="mx-auto image-no-bg"
                      eager
                      :alt="`Imagen ${currentImageIndex + 1} del producto ${product.Attributes.title || 'sin título'}`"
                    >
                      <template v-slot:placeholder>
                        <v-row class="fill-height ma-0" align="center" justify="center">
                          <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        </v-row>
                      </template>
                    </v-img>
                  </div>

                  <!-- Controles de navegación -->
                  <div
                    class="d-flex justify-space-between align-center position-absolute"
                    style="top: 50%; transform: translateY(-50%); width: 100%"
                  >
                    <v-btn
                      icon="mdi-chevron-left"
                      variant="text"
                      size="large"
                      color="primary"
                      @click="prevImage"
                      :disabled="currentImageIndex === 0"
                    ></v-btn>
                    <v-btn
                      icon="mdi-chevron-right"
                      variant="text"
                      size="large"
                      color="primary"
                      @click="nextImage"
                      :disabled="currentImageIndex === product.Attributes.pictures.length - 1"
                    ></v-btn>
                  </div>

                  <!-- Miniaturas de navegación -->
                  <div class="d-flex justify-center mt-3 overflow-x-auto" style="max-width: 100%">
                    <div
                      v-for="(picture, i) in product.Attributes.pictures"
                      :key="i"
                      class="mx-1 thumbnail-container"
                      :class="{ 'active-thumbnail': currentImageIndex === i }"
                      @click="selectImage(i)"
                    >
                      <v-img
                        :src="picture.secure_url || picture.url"
                        width="50"
                        height="50"
                        cover
                        class="rounded"
                      ></v-img>
                    </div>
                  </div>

                  <!-- Contador de imágenes -->
                  <div class="text-center mt-2 text-caption">
                    Imagen {{ currentImageIndex + 1 }} de {{ product.Attributes.pictures.length }}
                  </div>
                </div>
                <v-img
                  v-else
                  src="https://via.placeholder.com/400x400?text=Sin+imagen"
                  height="auto"
                  max-height="400"
                  max-width="100%"
                  contain
                  class="mx-auto image-no-bg"
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
                    <div class="d-flex justify-space-between align-center mb-2">
                      <div class="d-flex align-center">
                        <v-switch
                          v-model="jsonReadOnly"
                          label="Solo lectura"
                          color="primary"
                          hide-details
                          density="compact"
                          class="mt-0 mr-4"
                        ></v-switch>
                        
                        <!-- Controles de zoom -->
                        <div class="d-flex align-center">
                          <v-btn
                            icon
                            size="small"
                            variant="text"
                            color="grey-darken-1"
                            @click="decreaseFontSize"
                            :disabled="fontSize <= 10"
                          >
                            <v-icon>mdi-magnify-minus</v-icon>
                            <v-tooltip activator="parent" location="bottom">Disminuir tamaño de fuente</v-tooltip>
                          </v-btn>
                          
                          <span class="text-caption mx-2">{{ fontSize }}px</span>
                          
                          <v-btn
                            icon
                            size="small"
                            variant="text"
                            color="grey-darken-1"
                            @click="increaseFontSize"
                            :disabled="fontSize >= 24"
                          >
                            <v-icon>mdi-magnify-plus</v-icon>
                            <v-tooltip activator="parent" location="bottom">Aumentar tamaño de fuente</v-tooltip>
                          </v-btn>
                        </div>
                      </div>
                      <div>
                        <v-btn
                          color="success"
                          variant="text"
                          size="small"
                          class="mr-2"
                          :disabled="jsonReadOnly"
                          @click="applyJsonChanges"
                        >
                          <v-icon start>mdi-content-save</v-icon>
                          Aplicar cambios
                        </v-btn>
                        <v-btn
                          color="info"
                          variant="text"
                          size="small"
                          class="mr-2"
                          @click="toggleFullscreen"
                        >
                          <v-icon start>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
                          {{ isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa' }}
                        </v-btn>
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
                    </div>
                    <div v-if="isFullscreen" class="fullscreen-backdrop" @click.self="toggleFullscreen"></div>
                    <div 
                      :class="[
                        'json-editor rounded', 
                        { 'fullscreen-editor': isFullscreen }
                      ]"
                      style="position: relative;"
                      :style="{
                        height: isFullscreen ? 'calc(100vh - 120px)' : '500px',
                        border: '1px solid #e0e0e0',
                        position: isFullscreen ? 'fixed' : 'relative',
                        top: isFullscreen ? '64px' : 'auto',
                        left: isFullscreen ? '0' : 'auto',
                        right: isFullscreen ? '0' : 'auto',
                        zIndex: isFullscreen ? '1000' : 'auto',
                        width: isFullscreen ? 'calc(100% - 32px)' : 'auto',
                        margin: isFullscreen ? '0 16px' : '0',
                        backgroundColor: 'white',
                        padding: isFullscreen ? '16px' : '0',
                      }"
                    >
                      <!-- Botón de cierre en modo pantalla completa -->
                      <v-btn
                        v-if="isFullscreen"
                        icon
                        color="error"
                        variant="elevated"
                        size="default"
                        class="close-fullscreen-btn"
                        @click="toggleFullscreen"
                      >
                        <v-icon size="large" color="white">mdi-close</v-icon>
                      </v-btn>
                      
                      <!-- Controles de zoom en modo pantalla completa -->
                      <div v-if="isFullscreen" class="fullscreen-zoom-controls">
                        <v-btn
                          icon
                          size="small"
                          color="primary"
                          variant="flat"
                          class="mr-2"
                          @click="decreaseFontSize"
                          :disabled="fontSize <= 10"
                        >
                          <v-icon>mdi-magnify-minus</v-icon>
                        </v-btn>
                        
                        <span class="text-caption font-weight-medium px-2 py-1 bg-grey-lighten-3 rounded">{{ fontSize }}px</span>
                        
                        <v-btn
                          icon
                          size="small"
                          color="primary"
                          variant="flat"
                          class="ml-2"
                          @click="increaseFontSize"
                          :disabled="fontSize >= 24"
                        >
                          <v-icon>mdi-magnify-plus</v-icon>
                        </v-btn>
                      </div>
                      
                      <MonacoEditor
                        v-model:value="jsonContent"
                        :options="{
                          language: 'json',
                          readOnly: jsonReadOnly,
                          automaticLayout: true,
                          minimap: { enabled: true },
                          scrollBeyondLastLine: false,
                          theme: 'vs',
                          fontSize: fontSize,
                          tabSize: 2,
                        }"
                        @change="handleEditorChange"
                        style="height: 100%; width: 100%;"
                      />
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
    
    <!-- Ya no necesitamos un overlay separado, lo manejaremos dentro del editor -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import migrationService from '@/services/migrationService'
import { useAccountStore } from '@/stores/account'
import MonacoEditor from '@guolao/vue-monaco-editor'

// Interfaces
// Importar la interfaz del servicio de migración
import type { ProductDetail } from '@/services/migrationService'

// Obtener el ID del producto de la URL y el store de cuentas
const route = useRoute()
const accountStore = useAccountStore()

// Estado
const product = ref<ProductDetail | null>(null)
const activeTab = ref('attributes')
const currentImageIndex = ref(0)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const loading = ref(false)

// Variables para el editor JSON
const jsonContent = ref('')
const jsonReadOnly = ref(true)
const originalJson = ref('')
const isFullscreen = ref(false) // Estado para controlar el modo pantalla completa
const fontSize = ref(14) // Estado para controlar el tamaño de la fuente

// Imagen actual basada en el índice
const currentPicture = computed(() => {
  if (!product.value?.Attributes?.pictures || product.value.Attributes.pictures.length === 0) {
    return null
  }
  return product.value.Attributes.pictures[currentImageIndex.value] || null
})

// Cargar datos del producto directamente desde la API
onMounted(async () => {
  const productId = route.params.id as string
  const accountId = accountStore.currentAccount?.ID

  if (!accountId) {
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta primero'
    notificationType.value = 'warning'
    loading.value = false
    return
  }

  try {
    const response = await migrationService.getProductDetail(accountId, productId)
    product.value = response

    // Inicializar el contenido del editor JSON
    if (product.value) {
      jsonContent.value = JSON.stringify(product.value, null, 2)
      originalJson.value = jsonContent.value // Guardar el JSON original
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

// Observar cambios en el producto para actualizar el editor JSON
watch(() => product.value, (newProduct) => {
  if (newProduct) {
    jsonContent.value = JSON.stringify(newProduct, null, 2)
  }
})

// Métodos
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price)
}

// Funciones para la navegación de imágenes
const selectImage = (index: number) => {
  if (
    product.value?.Attributes?.pictures &&
    index >= 0 &&
    index < product.value.Attributes.pictures.length
  ) {
    currentImageIndex.value = index
  }
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (
    product.value?.Attributes?.pictures &&
    currentImageIndex.value < product.value.Attributes.pictures.length - 1
  ) {
    currentImageIndex.value++
  }
}

const openInMercadoLibre = () => {
  if (product.value?.Attributes?.permalink) {
    window.open(product.value.Attributes.permalink, '_blank')
  }
}

// Funciones para el editor JSON
const handleEditorChange = (value: string) => {
  // Esta función se llama cada vez que cambia el contenido del editor
  jsonContent.value = value
}

const applyJsonChanges = () => {
  try {
    // Intentar parsear el JSON para validarlo
    const updatedProduct = JSON.parse(jsonContent.value)

    // Actualizar el producto con los cambios
    product.value = updatedProduct

    // Mostrar notificación de éxito
    showNotification.value = true
    notificationMessage.value = 'Cambios aplicados correctamente'
    notificationType.value = 'success'
  } catch (error) {
    // Mostrar notificación de error si el JSON no es válido
    showNotification.value = true
    notificationMessage.value = 'Error en el formato JSON: ' + (error instanceof Error ? error.message : 'Error desconocido')
    notificationType.value = 'error'
  }
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

// Función para alternar el modo de pantalla completa
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  // Ajustar el tamaño de la fuente cuando se cambia entre modo normal y pantalla completa
  if (isFullscreen.value && fontSize.value < 16) {
    // Guardar el tamaño actual para restaurarlo cuando se salga de pantalla completa
    fontSize.value = Math.max(fontSize.value + 2, 16)
  }
}

// Funciones para controlar el tamaño de la fuente
const increaseFontSize = () => {
  // Limitar el tamaño máximo de la fuente a 24px
  if (fontSize.value < 24) {
    fontSize.value += 2
  }
}

const decreaseFontSize = () => {
  // Limitar el tamaño mínimo de la fuente a 10px
  if (fontSize.value > 10) {
    fontSize.value -= 2
  }
}
</script>

<style scoped>
.thumbnail-container {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.thumbnail-container:hover {
  border-color: #1976d2;
  transform: scale(1.05);
}

.active-thumbnail {
  border-color: #1976d2;
  box-shadow: 0 0 5px rgba(25, 118, 210, 0.5);
}

.image-no-bg {
  background: transparent !important;
}

.image-no-bg :deep(.v-img__img) {
  object-fit: contain !important;
}

.position-relative {
  background: transparent !important;
}
</style>

<style scoped>
.json-viewer {
  font-family: monospace;
  font-size: 14px;
}

.fullscreen-editor {
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.fullscreen-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.close-fullscreen-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  opacity: 1 !important;
  border: 2px solid white !important;
}

.fullscreen-zoom-controls {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1001;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
