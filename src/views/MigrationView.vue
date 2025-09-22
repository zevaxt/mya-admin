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

    <!-- Diálogo de detalles del producto -->
    <v-dialog v-model="showProductDetail" max-width="800">
      <v-card v-if="selectedProduct">
        <v-card-title class="text-h5">
          Detalles de la publicación {{ selectedProduct.id }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-img
                v-if="selectedProduct.pictures && selectedProduct.pictures.length > 0"
                :src="selectedProduct.pictures[0].url"
                height="300"
                contain
                class="bg-grey-lighten-3 rounded"
              ></v-img>
              <div v-else class="d-flex justify-center align-center bg-grey-lighten-3 rounded" style="height: 300px">
                <v-icon size="100" color="grey-lighten-1">mdi-image-off</v-icon>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-title>Título</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedProduct.title }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Precio</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedProduct.price }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Cantidad disponible</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedProduct.available_quantity }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Categoría</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedProduct.category_id }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Estado</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="
                        selectedProduct.status === 'active'
                          ? 'success'
                          : selectedProduct.status === 'paused'
                            ? 'warning'
                            : 'error'
                      "
                      size="small"
                    >
                      {{
                        selectedProduct.status === 'active'
                          ? 'Activo'
                          : selectedProduct.status === 'paused'
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
                @click="openProductInNewTab(selectedProduct.id)"
                prepend-icon="mdi-open-in-new"
              >
                Ver en Mercado Libre
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showProductDetail = false"> Cerrar </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'
import type { ProductDetail } from '@/services/migrationService'
import PublicationsTab from '@/views/migrations/PublicationsTab.vue'
import OrphanPublicationsTab from '@/views/migrations/OrphanPublicationsTab.vue'
import MissingPublicationsTab from '@/views/migrations/MissingPublicationsTab.vue'
import DeprecatedPublicationsTab from '@/views/migrations/DeprecatedPublicationsTab.vue'

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
const handleShowProductDetail = (product: ProductDetail) => {
  selectedProduct.value = product
  showProductDetail.value = true
}

// Abrir producto en nueva pestaña
const openProductInNewTab = (productId: string) => {
  // Insertar un guion después de los primeros 3 caracteres (MCO-1233526781)
  const formattedId = productId.slice(0, 3) + '-' + productId.slice(3)
  window.open(`https://articulo.mercadolibre.com.co/${formattedId}`, '_blank')
}
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
