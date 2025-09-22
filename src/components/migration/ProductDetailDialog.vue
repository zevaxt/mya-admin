<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ProductDetail as BaseProductDetail } from '@/services/migrationService'

// Definir interfaces para los atributos extendidos
interface ProductAttribute {
  id: string
  name: string
  value_name?: string
  value_id?: string
  value_struct?: Record<string, unknown>
  values?: Array<{ id?: string; name: string; struct?: Record<string, unknown> }>
  attribute_group_id?: string
  attribute_group_name?: string
}

interface ProductShipping {
  mode?: string
  free_shipping?: boolean
  local_pick_up?: boolean
  store_pick_up?: boolean
  tags?: string[]
  methods?: unknown[]
  dimensions?: unknown
}

interface ProductAttributes {
  id?: string
  title?: string
  price?: number
  status?: string
  condition?: string
  category_id?: string
  domain_id?: string
  warranty?: string
  attributes?: ProductAttribute[]
  shipping?: ProductShipping
  [key: string]: unknown
}

// Extender la interfaz ProductDetail para incluir la propiedad Attributes
interface ProductDetail extends BaseProductDetail {
  Attributes?: ProductAttributes | Record<string, unknown>
  ID?: string
  Status?: boolean
}

// Props
const props = defineProps<{
  modelValue: boolean
  product: ProductDetail
}>()

// Debugging
console.log('ProductDetailDialog props:', { modelValue: props.modelValue, product: props.product })

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// Computed
const dialog = computed(() => props.modelValue)

// Computed con getter y setter para v-model
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Watcher para imprimir cuando cambia el valor del diálogo
watch(() => props.modelValue, (newValue: boolean) => {
  console.log('Dialog modelValue changed:', newValue)
}, { immediate: true })

// Tabs
const activeTab = ref(0)
const innerActiveTab = ref('basic') // Para las pestañas internas

// Métodos
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)
}

const openProductInNewTab = () => {
  // Insertar un guion después de los primeros 3 caracteres (MCO-1233526781)
  const productId = props.product.id
  const formattedId = productId.slice(0, 3) + '-' + productId.slice(3)
  window.open(`https://articulo.mercadolibre.com.co/${formattedId}`, '_blank')
}

// Función para copiar texto al portapapeles
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      // Mostrar alguna notificación de éxito si es necesario
      console.log('Texto copiado al portapapeles')
    })
    .catch(err => {
      console.error('Error al copiar texto: ', err)
    })
}
</script>

<template>
  <!-- Agregar un log para depuración -->
  <div style="display: none;">
    {{ console.log('Dialog value in template:', dialog) }}
    {{ console.log('Product in template:', product) }}
  </div>
  
  <!-- Usar v-model directamente para simplificar -->
  <v-dialog v-model="dialogModel" max-width="900" scrollable>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <span class="text-h6">Detalle del Producto</span>
          <div class="text-subtitle-2 text-grey">ID: {{ product.id }}</div>
        </div>
        <v-btn icon @click="dialogModel = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <h3 class="text-h6 mb-2">{{ product.title }}</h3>

            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Precio</v-list-item-title>
                <v-list-item-subtitle>{{ formatPrice(product.price) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Cantidad disponible</v-list-item-title>
                <v-list-item-subtitle>{{ product.available_quantity }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Categoría</v-list-item-title>
                <v-list-item-subtitle>{{ product.category_id }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Estado</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="
                      product.status === 'active'
                        ? 'success'
                        : product.status === 'paused'
                          ? 'warning'
                          : 'error'
                    "
                    size="small"
                  >
                    {{
                      product.status === 'active'
                        ? 'Activo'
                        : product.status === 'paused'
                          ? 'Pausado'
                          : 'Finalizado'
                    }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-btn
              color="primary"
              class="mt-4"
              @click="openProductInNewTab"
              prepend-icon="mdi-open-in-new"
            >
              Ver en Mercado Libre
            </v-btn>
          </v-col>

          <v-col cols="12" md="6">
            <v-carousel
              v-if="product.pictures && product.pictures.length > 0"
              height="300"
              hide-delimiters
              show-arrows="hover"
            >
              <v-carousel-item
                v-for="picture in product.pictures"
                :key="picture.id"
                :src="picture.url"
                cover
              ></v-carousel-item>
            </v-carousel>

            <v-img
              v-else
              src="https://via.placeholder.com/300x300?text=Sin+imagen"
              height="300"
              cover
              class="bg-grey-lighten-2"
            ></v-img>
          </v-col>
        </v-row>

        <v-tabs v-model="activeTab" class="mt-4">
          <v-tab value="0">Atributos</v-tab>
          <v-tab value="1">Variaciones</v-tab>
          <v-tab value="2">Datos Completos</v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- Atributos -->
          <v-window-item value="0">
            <v-table v-if="product.attributes && product.attributes.length > 0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="attr in product.attributes" :key="attr.id">
                  <td>{{ attr.id }}</td>
                  <td>{{ attr.name }}</td>
                  <td>{{ attr.value_name }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-alert v-else type="info" class="mt-4">
              Este producto no tiene atributos definidos.
            </v-alert>
          </v-window-item>

          <!-- Variaciones -->
          <v-window-item value="1">
            <div v-if="product.variations && product.variations.length > 0">
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="(variation, index) in product.variations"
                  :key="variation.id"
                >
                  <v-expansion-panel-title>
                    <div>
                      <strong>Variación #{{ index + 1 }}</strong>
                      <div class="text-caption">ID: {{ variation.id }}</div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Precio</v-list-item-title>
                        <v-list-item-subtitle>{{
                          formatPrice(variation.price)
                        }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Cantidad disponible</v-list-item-title>
                        <v-list-item-subtitle>{{
                          variation.available_quantity
                        }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>

                    <v-divider class="my-2"></v-divider>

                    <h4 class="text-subtitle-1 mb-2">Combinaciones de atributos</h4>
                    <v-chip
                      v-for="attr in variation.attribute_combinations"
                      :key="attr.id"
                      class="ma-1"
                      color="primary"
                      variant="outlined"
                    >
                      {{ attr.name }}: {{ attr.value_name }}
                    </v-chip>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
            <v-alert v-else type="info" class="mt-4"> Este producto no tiene variaciones. </v-alert>
          </v-window-item>
          <!-- Datos Completos -->
          <v-window-item value="2">
            <v-card variant="flat" class="mt-2">
              <v-card-text>
                <v-expansion-panels variant="accordion">
                  <!-- Información General -->
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon color="primary" class="mr-2">mdi-information-outline</v-icon>
                        <span class="text-subtitle-1">Información General</span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-list density="compact" class="bg-grey-lighten-5 rounded">
                            <v-list-item>
                              <v-list-item-title>ID</v-list-item-title>
                              <v-list-item-subtitle>{{ product.id || '-' }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <v-list-item-title>Título</v-list-item-title>
                              <v-list-item-subtitle>{{ product.title || '-' }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <v-list-item-title>Precio</v-list-item-title>
                              <v-list-item-subtitle>{{ formatPrice(product.price) || '-' }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <v-list-item-title>Estado</v-list-item-title>
                              <v-list-item-subtitle>
                                <v-chip
                                  size="x-small"
                                  :color="product.status === 'active' ? 'success' : 'error'"
                                >
                                  {{ product.status || '-' }}
                                </v-chip>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-list density="compact" class="bg-grey-lighten-5 rounded">
                            <v-list-item>
                              <v-list-item-title>Categoría</v-list-item-title>
                              <v-list-item-subtitle>{{ product.category_id || '-' }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <v-list-item-title>Cantidad disponible</v-list-item-title>
                              <v-list-item-subtitle>{{ product.available_quantity || '-' }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="product.permalink">
                              <v-list-item-title>Enlace</v-list-item-title>
                              <v-list-item-subtitle>
                                <a :href="product.permalink" target="_blank" class="text-decoration-none">
                                  Ver publicación
                                  <v-icon size="small">mdi-open-in-new</v-icon>
                                </a>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <!-- Atributos Extendidos -->
                  <v-expansion-panel v-if="product.Attributes">
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon color="primary" class="mr-2">mdi-format-list-bulleted</v-icon>
                        <span class="text-subtitle-1">Atributos Extendidos</span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-tabs v-model="innerActiveTab">
                        <v-tab value="basic">Básicos</v-tab>
                        <v-tab value="attributes">Atributos</v-tab>
                        <v-tab value="shipping">Envío</v-tab>
                        <v-tab value="other">Otros</v-tab>
                      </v-tabs>
                      
                      <v-window v-model="innerActiveTab">
                        <!-- Básicos -->
                        <v-window-item value="basic">
                          <v-list density="compact" class="bg-grey-lighten-5 rounded mt-2">
                            <v-list-item v-if="product.Attributes.title">
                              <v-list-item-title>Título</v-list-item-title>
                              <v-list-item-subtitle>{{ product.Attributes.title }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="product.Attributes.price">
                              <v-list-item-title>Precio</v-list-item-title>
                              <v-list-item-subtitle>{{ formatPrice(product.Attributes.price) }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="product.Attributes.status">
                              <v-list-item-title>Estado</v-list-item-title>
                              <v-list-item-subtitle>
                                <v-chip
                                  size="x-small"
                                  :color="product.Attributes.status === 'active' ? 'success' : 'error'"
                                >
                                  {{ product.Attributes.status }}
                                </v-chip>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="product.Attributes.condition">
                              <v-list-item-title>Condición</v-list-item-title>
                              <v-list-item-subtitle>{{ product.Attributes.condition }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="product.Attributes.category_id">
                              <v-list-item-title>Categoría</v-list-item-title>
                              <v-list-item-subtitle>{{ product.Attributes.category_id }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="product.Attributes.domain_id">
                              <v-list-item-title>Dominio</v-list-item-title>
                              <v-list-item-subtitle>{{ product.Attributes.domain_id }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="product.Attributes.warranty">
                              <v-list-item-title>Garantía</v-list-item-title>
                              <v-list-item-subtitle>{{ product.Attributes.warranty }}</v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-window-item>
                        
                        <!-- Atributos -->
                        <v-window-item value="attributes">
                          <v-table v-if="product.Attributes.attributes && product.Attributes.attributes.length > 0" class="mt-2">
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
                            No hay atributos extendidos disponibles
                          </v-alert>
                        </v-window-item>
                        
                        <!-- Envío -->
                        <v-window-item value="shipping">
                          <v-card v-if="product.Attributes.shipping" variant="outlined" class="mt-2">
                            <v-card-text>
                              <v-row>
                                <v-col cols="12" md="6">
                                  <v-list density="compact" class="bg-grey-lighten-5 rounded">
                                    <v-list-item>
                                      <v-list-item-title>Modo</v-list-item-title>
                                      <v-list-item-subtitle>{{ product.Attributes.shipping.mode || '-' }}</v-list-item-subtitle>
                                    </v-list-item>
                                    <v-list-item>
                                      <v-list-item-title>Envío gratis</v-list-item-title>
                                      <v-list-item-subtitle>
                                        <v-chip
                                          size="x-small"
                                          :color="product.Attributes.shipping.free_shipping ? 'success' : 'error'"
                                        >
                                          {{ product.Attributes.shipping.free_shipping ? 'Sí' : 'No' }}
                                        </v-chip>
                                      </v-list-item-subtitle>
                                    </v-list-item>
                                  </v-list>
                                </v-col>
                                <v-col cols="12" md="6">
                                  <v-list density="compact" class="bg-grey-lighten-5 rounded">
                                    <v-list-item>
                                      <v-list-item-title>Recogida local</v-list-item-title>
                                      <v-list-item-subtitle>
                                        <v-chip
                                          size="x-small"
                                          :color="product.Attributes.shipping.local_pick_up ? 'success' : 'error'"
                                        >
                                          {{ product.Attributes.shipping.local_pick_up ? 'Sí' : 'No' }}
                                        </v-chip>
                                      </v-list-item-subtitle>
                                    </v-list-item>
                                    <v-list-item>
                                      <v-list-item-title>Recogida en tienda</v-list-item-title>
                                      <v-list-item-subtitle>
                                        <v-chip
                                          size="x-small"
                                          :color="product.Attributes.shipping.store_pick_up ? 'success' : 'error'"
                                        >
                                          {{ product.Attributes.shipping.store_pick_up ? 'Sí' : 'No' }}
                                        </v-chip>
                                      </v-list-item-subtitle>
                                    </v-list-item>
                                  </v-list>
                                </v-col>
                                <v-col cols="12" v-if="product.Attributes.shipping.tags && product.Attributes.shipping.tags.length > 0">
                                  <div class="text-subtitle-2 mb-2">Etiquetas de envío:</div>
                                  <div class="d-flex flex-wrap gap-1">
                                    <v-chip
                                      v-for="(tag, index) in product.Attributes.shipping.tags"
                                      :key="index"
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                    >
                                      {{ tag }}
                                    </v-chip>
                                  </div>
                                </v-col>
                              </v-row>
                            </v-card-text>
                          </v-card>
                          <v-alert v-else type="info" class="mt-2">
                            No hay información de envío disponible
                          </v-alert>
                        </v-window-item>
                        
                        <!-- Otros -->
                        <v-window-item value="other">
                          <div class="json-viewer pa-2 bg-grey-lighten-5 rounded mt-2">
                            <pre class="overflow-auto" style="max-height: 400px">{{ JSON.stringify(product.Attributes, null, 2) }}</pre>
                          </div>
                          <v-btn
                            class="mt-2"
                            color="primary"
                            variant="text"
                            size="small"
                            @click="copyToClipboard(JSON.stringify(product.Attributes, null, 2))"
                          >
                            <v-icon start>mdi-content-copy</v-icon>
                            Copiar JSON
                          </v-btn>
                        </v-window-item>
                      </v-window>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                  
                  <!-- JSON Completo -->
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon color="primary" class="mr-2">mdi-code-json</v-icon>
                        <span class="text-subtitle-1">JSON Completo</span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="json-viewer pa-2 bg-grey-lighten-5 rounded">
                        <pre class="overflow-auto" style="max-height: 400px">{{ JSON.stringify(product, null, 2) }}</pre>
                      </div>
                      <v-btn
                        class="mt-2"
                        color="primary"
                        variant="text"
                        size="small"
                        @click="copyToClipboard(JSON.stringify(product, null, 2))"
                      >
                        <v-icon start>mdi-content-copy</v-icon>
                        Copiar JSON
                      </v-btn>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="dialogModel = false"> Cerrar </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
