<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductDetail } from '@/services/migrationService'

// Props
const props = defineProps<{
  modelValue: boolean
  product: ProductDetail
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Tabs
const activeTab = ref(0)

// Métodos
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)
}

const openProductInNewTab = () => {
  window.open(`https://articulo.mercadolibre.com.ar/${props.product.id}`, '_blank')
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    max-width="900"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <span class="text-h6">Detalle del Producto</span>
          <div class="text-subtitle-2 text-grey">ID: {{ product.id }}</div>
        </div>
        <v-btn icon @click="dialog = false">
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
                    :color="product.status === 'active' ? 'success' : product.status === 'paused' ? 'warning' : 'error'"
                    size="small"
                  >
                    {{ product.status === 'active' ? 'Activo' : product.status === 'paused' ? 'Pausado' : 'Finalizado' }}
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
            <v-alert
              v-else
              type="info"
              class="mt-4"
            >
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
                        <v-list-item-subtitle>{{ formatPrice(variation.price) }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Cantidad disponible</v-list-item-title>
                        <v-list-item-subtitle>{{ variation.available_quantity }}</v-list-item-subtitle>
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
            <v-alert
              v-else
              type="info"
              class="mt-4"
            >
              Este producto no tiene variaciones.
            </v-alert>
          </v-window-item>
        </v-window>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="dialog = false"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
