<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Gestión de Migraciones</h1>

        <v-alert v-if="!hasAccount" type="warning" class="mb-4">
          Selecciona una cuenta para ver los productos disponibles para migración.
        </v-alert>

        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
          {{ error }}
        </v-alert>

        <v-card>
          <v-tabs
            v-model="activeTab"
            @update:model-value="handleTabChange"
            bg-color="grey-lighten-4"
            slider-color="primary"
            class="tabs-with-separators"
            show-arrows
          >
            <v-tab
              value="0"
              :color="activeTab === 0 ? 'primary' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="primary">mdi-format-list-bulleted</v-icon>
              PUBLICACIONES
            </v-tab>
            <v-tab
              value="1"
              :color="activeTab === 1 ? 'warning' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="warning">mdi-alert-circle-outline</v-icon>
              Publicaciones Huérfanas
            </v-tab>
            <v-tab
              value="2"
              :color="activeTab === 2 ? 'info' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="info">mdi-database-import-outline</v-icon>
              Publicaciones Faltantes
            </v-tab>
            <v-tab
              value="3"
              :color="activeTab === 3 ? 'error' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="error">mdi-database-remove</v-icon>
              PUBLICACIONES DEPRECADAS
            </v-tab>
          </v-tabs>

          <v-card-text>
            <!-- Componentes de pestañas -->
            <PublicationsTab 
              v-if="activeTab === 0" 
              @error="handleError"
              @show-product-detail="handleShowProductDetail"
            />
            
            <OrphanPublicationsTab 
              v-if="activeTab === 1" 
              @error="handleError"
            />
            
            <MissingPublicationsTab 
              v-if="activeTab === 2" 
              @error="handleError"
            />
            
            <DeprecatedPublicationsTab 
              v-if="activeTab === 3" 
              @error="handleError"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Usar el componente ProductDetailDialog -->
    <ProductDetailDialog
      v-if="selectedProduct"
      v-model="showProductDetail"
      :product="selectedProduct"
    />
    
    <!-- Diálogo de carga mientras se obtienen los detalles del producto -->
    <v-dialog :model-value="showProductDetail && !selectedProduct" persistent max-width="300">
      <v-card>
        <v-card-text class="text-center pa-4">
          <v-progress-circular indeterminate color="primary" class="mb-3"></v-progress-circular>
          <div>Cargando detalles del producto...</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="showProductDetail = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'
import type { ProductDetail as BaseProductDetail } from '@/services/migrationService'

// Extender la interfaz ProductDetail para incluir la propiedad Attributes
interface ProductDetail extends BaseProductDetail {
  Attributes?: Record<string, unknown>
  ID?: string
  Status?: boolean
}
import PublicationsTab from '@/views/migrations/PublicationsTab.vue'
import OrphanPublicationsTab from '@/views/migrations/OrphanPublicationsTab.vue'
import MissingPublicationsTab from '@/views/migrations/MissingPublicationsTab.vue'
import DeprecatedPublicationsTab from '@/views/migrations/DeprecatedPublicationsTab.vue'
import ProductDetailDialog from '@/components/migration/ProductDetailDialog.vue'

// Stores
const accountStore = useAccountStore()

// Estado
const activeTab = ref<number>(0)
const error = ref<string | null>(null)
const showProductDetail = ref(false)
const selectedProduct = ref<ProductDetail | null>(null)

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const hasAccount = computed(() => !!currentAccount.value)

// Manejar cambio de pestaña
const handleTabChange = (tabIndex: unknown) => {
  const index = Number(tabIndex)
  activeTab.value = index
}

// Manejar error desde los componentes hijos
const handleError = (errorMessage: string | null) => {
  error.value = errorMessage
}

// Manejar visualización de detalles del producto
const handleShowProductDetail = (product: ProductDetail | null) => {
  console.log('handleShowProductDetail called with product:', product)
  console.log('Tipo de product:', product ? typeof product : 'null')
  
  if (product === null) {
    // Si el producto es null, mostrar el diálogo de carga
    console.log('Mostrando diálogo de carga (product === null)')
    selectedProduct.value = null
    showProductDetail.value = true
  } else if (!product) {
    // Si el producto es undefined o falsy, mostrar un mensaje de error
    console.error('Producto inválido:', product)
    selectedProduct.value = null
    showProductDetail.value = false
    error.value = 'Error: Datos de producto inválidos'
  } else {
    // Si el producto tiene datos, mostrar el diálogo con los detalles
    console.log('Mostrando diálogo con detalles, product:', product)
    console.log('Propiedades del producto:', Object.keys(product))
    selectedProduct.value = product
    showProductDetail.value = true
    console.log('After setting selectedProduct:', { showProductDetail: showProductDetail.value, selectedProduct: selectedProduct.value })
  }
}

// Esta función se ha movido al componente ProductDetailDialog
</script>

<style scoped>
.v-tab {
  min-height: 48px;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.tab-with-border::after {
  content: '';
  position: absolute;
  right: -2px;
  top: 30%;
  height: 40%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.1);
}

.v-tab--selected {
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.7);
}

.tabs-with-separators :deep(.v-slide-group__content) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.v-tabs-slider {
  height: 3px;
}
</style>
