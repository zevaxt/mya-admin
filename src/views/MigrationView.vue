<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
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
            class="tabs-with-separators sticky-tabs"
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
              Huérfanas
            </v-tab>
            <v-tab
              value="2"
              :color="activeTab === 2 ? 'info' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="info">mdi-database-import-outline</v-icon>
              Faltantes
            </v-tab>
            <v-tab
              value="3"
              :color="activeTab === 3 ? 'primary' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="primary">mdi-sync</v-icon>
              SINCRONIZACIONES
            </v-tab>
            <v-tab
              value="4"
              :color="activeTab === 4 ? 'error' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="error">mdi-database-remove</v-icon>
              DEPRECADAS
            </v-tab>
          </v-tabs>

          <v-card-text>
            <!-- Componentes de pestañas -->
            <PublicationsTab v-if="activeTab === 0" @error="handleError" />

            <OrphanPublicationsTab v-if="activeTab === 1" @error="handleError" />

            <MissingPublicationsTab v-if="activeTab === 2" @error="handleError" />

            <SyncRelationsTab v-if="activeTab === 3" @error="handleError" />

            <DeprecatedPublicationsTab v-if="activeTab === 4" @error="handleError" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- El diálogo de detalles del producto ha sido eliminado -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'
import PublicationsTab from '@/views/migrations/PublicationsTab.vue'
import OrphanPublicationsTab from '@/views/migrations/OrphanPublicationsTab.vue'
import MissingPublicationsTab from '@/views/migrations/MissingPublicationsTab.vue'
import SyncRelationsTab from '@/views/migrations/SyncRelationsTab.vue'
import DeprecatedPublicationsTab from '@/views/migrations/DeprecatedPublicationsTab.vue'

// Stores
const accountStore = useAccountStore()

// Estado
const activeTab = ref<number>(0)
const error = ref<string | null>(null)

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

.v-tabs-slider {
  height: 3px;
}

.tabs-with-separators :deep(.v-slide-group__content) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: var(--v-theme-surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
