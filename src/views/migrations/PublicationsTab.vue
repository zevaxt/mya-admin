<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">PUBLICACIONES</h3>
        <p class="text-caption text-grey">Publicaciones registradas en el sistema</p>
      </div>
      <div class="d-flex gap-2">
        <v-menu v-if="hasAccount">
          <template v-slot:activator="{ props }">
            <v-btn
              color="success"
              variant="outlined"
              v-bind="props"
              class="mr-2"
              size="small"
              :loading="processingPopulateAll"
              :disabled="processingPopulateAll"
            >
              <v-icon start>mdi-database-import</v-icon>
              Populate todas
              <v-icon end>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="confirmPopulateAllProducts(false)">
              <v-list-item-title>Todas las publicaciones</v-list-item-title>
            </v-list-item>
            <v-list-item @click="confirmPopulateAllProducts(true)">
              <v-list-item-title>Solo publicaciones sin atributos</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          color="primary"
          variant="outlined"
          @click="loadProductIds"
          :loading="loading"
          size="small"
        >
          <v-icon start>mdi-refresh</v-icon>
          Refrescar
        </v-btn>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filter-container mb-4">
      <v-row>
        <v-col cols="12" md="3">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="Filtrar por estado"
            variant="outlined"
            density="comfortable"
            @update:model-value="handleStatusFilterChange"
            :color="statusFilter ? 'primary' : undefined"
            :bg-color="statusFilter ? 'primary-lighten-5' : undefined"
          >
            <template v-slot:append-inner>
              <v-icon
                v-if="statusFilter"
                color="primary"
                @click.stop="
                  () => {
                    statusFilter = ''
                    handleStatusFilterChange()
                  }
                "
                >mdi-close</v-icon
              >
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="syncActiveFilter"
            :items="booleanFilterOptions"
            item-title="title"
            item-value="value"
            label="Filtrar por Sync Activo"
            variant="outlined"
            density="comfortable"
            @update:model-value="handleSyncActiveFilterChange"
            :color="syncActiveFilter ? 'primary' : undefined"
            :bg-color="syncActiveFilter ? 'primary-lighten-5' : undefined"
          >
            <template v-slot:append-inner>
              <v-icon
                v-if="syncActiveFilter"
                color="primary"
                @click.stop="
                  () => {
                    syncActiveFilter = ''
                    handleSyncActiveFilterChange()
                  }
                "
                >mdi-close</v-icon
              >
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="catalogActiveFilter"
            :items="booleanFilterOptions"
            item-title="title"
            item-value="value"
            label="Filtrar por Catálogo Activo"
            variant="outlined"
            density="comfortable"
            @update:model-value="handleCatalogActiveFilterChange"
            :color="catalogActiveFilter ? 'primary' : undefined"
            :bg-color="catalogActiveFilter ? 'primary-lighten-5' : undefined"
          >
            <template v-slot:append-inner>
              <v-icon
                v-if="catalogActiveFilter"
                color="primary"
                @click.stop="
                  () => {
                    catalogActiveFilter = ''
                    handleCatalogActiveFilterChange()
                  }
                "
                >mdi-close</v-icon
              >
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3" class="d-flex justify-end align-center gap-2">
          <v-btn
            v-if="hasActiveFilters || searchQuery"
            color="secondary"
            variant="outlined"
            @click="clearAllFilters"
            class="mr-2"
            size="small"
          >
            <v-icon start>mdi-filter-remove</v-icon>
            Limpiar filtros
          </v-btn>
        </v-col>
      </v-row>

      <!-- La barra de búsqueda ahora está integrada en el encabezado de la columna ID -->
    </div>

    <!-- Mensaje de filtrado y botón de columnas -->
    <div class="d-flex justify-space-between align-center mb-2">
      <div v-if="filteredMessage" class="d-flex align-center">
        <v-chip color="info" variant="outlined" size="small" class="mr-2">
          <v-icon start size="small">mdi-filter</v-icon>
          {{ filteredMessage }}
        </v-chip>
        <v-btn
          size="x-small"
          icon
          variant="text"
          color="grey"
          @click="clearAllFilters"
          v-if="hasActiveFilters"
        >
          <v-icon size="small">mdi-close</v-icon>
          <v-tooltip activator="parent" location="top">Limpiar filtros</v-tooltip>
        </v-btn>
      </div>

      <!-- Botón para gestionar columnas visibles -->
      <v-menu v-model="showColumnsMenu" :close-on-content-click="false" location="bottom" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn size="small" variant="outlined" color="secondary" v-bind="props">
            <v-icon start>mdi-eye-settings</v-icon>
            Columnas
          </v-btn>
        </template>

        <v-card min-width="300" max-width="400" class="elevation-8">
          <v-card-title class="text-subtitle-1 d-flex align-center pa-3">
            <span>Columnas visibles</span>
            <v-spacer></v-spacer>
            <v-btn icon size="small" @click="showColumnsMenu = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text style="max-height: 300px; overflow-y: auto" class="pa-0">
            <v-list density="compact">
              <v-list-item
                v-for="column in allColumns.filter((col) => !col.required && col.title)"
                :key="column.key"
              >
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="visibleColumns"
                    :value="column.key"
                    :disabled="column.required"
                    hide-details
                    density="compact"
                    @click="toggleColumnVisibility(column.key)"
                  ></v-checkbox>
                </template>
                <v-list-item-title class="text-body-2">{{ column.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-3">
            <v-btn color="primary" variant="text" size="small" @click="selectDefaultColumns"
              >Por defecto</v-btn
            >
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" size="small" @click="resetColumns"
              >Mostrar todas</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-menu>
    </div>

    <!-- Tabla de IDs de productos -->
    <div class="position-relative">
      <v-data-table
        ref="dataTable"
        v-model="selectedItems"
        :headers="productIdsHeaders"
        :items="filteredProductIds"
        :loading="loading"
        :items-per-page="itemsPerPage"
        class="elevation-1 rounded-lg"
        :no-data-text="
          hasAccount
            ? 'No hay productos disponibles'
            : 'Selecciona una cuenta para ver los productos'
        "
        show-select
        item-value="ID"
      >
        <!-- Template para el encabezado personalizado de la columna ID -->
        <template #[`header.ID`]="{ column }">
          <div
            class="d-flex align-center header-content"
            style="position: relative; min-width: 150px"
          >
            <!-- Contenedor con posición absoluta para evitar cambios en el layout -->
            <div style="position: absolute; width: 100%; z-index: 1">
              <v-fade-transition>
                <div
                  v-if="!showIdSearch"
                  class="d-flex align-center sortable-header"
                  @click="handleSort(column.key || '')"
                >
                  <span class="mr-2">{{ column.title }}</span>
                  <!-- Icono de ordenamiento (similar al que usa Vuetify internamente) -->
                  <v-icon
                    v-if="column.sortable"
                    size="x-small"
                    :icon="getSortIcon(column)"
                    class="sort-icon"
                    :class="{ 'visible-on-hover': !isSorted(column) }"
                  ></v-icon>
                  <v-btn
                    icon="mdi-magnify"
                    size="x-small"
                    variant="text"
                    color="primary"
                    class="ml-2"
                    @click.stop="activateSearch"
                  ></v-btn>
                </div>
              </v-fade-transition>
            </div>

            <!-- Contenedor con posición absoluta para la caja de búsqueda -->
            <div style="position: absolute; width: 100%; z-index: 2">
              <v-fade-transition>
                <v-text-field
                  v-if="showIdSearch"
                  v-model="searchQuery"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Buscar ID"
                  class="search-field"
                  clearable
                  ref="searchInput"
                  @update:model-value="handleSearchQueryChange"
                  @click:clear="clearSearchQuery"
                  @blur="handleSearchBlur"
                  @keydown.esc="deactivateSearch"
                  @click.stop
                ></v-text-field>
              </v-fade-transition>
            </div>

            <!-- Espacio invisible para mantener el ancho de la columna -->
            <div style="height: 1px; visibility: hidden">
              <div style="width: 150px"></div>
            </div>
          </div>
        </template>

        <!-- Columna de precio eliminada -->

        <template #[`item.SyncActive`]="{ item }">
          <div class="d-flex align-center justify-center w-100">
            <v-switch
              v-model="item.SyncActive"
              color="success"
              hide-details
              density="compact"
              :loading="processingSyncActiveId === item.ID"
              :disabled="processingSyncActiveId === item.ID"
              @click.stop="toggleSyncActive(item.ID, item.SyncActive)"
              class="ma-0 pa-0"
            ></v-switch>
          </div>
        </template>

        <template #[`item.CatalogActive`]="{ item }">
          <v-chip :color="item.CatalogActive ? 'success' : 'error'" size="small">
            {{ item.CatalogActive ? 'Sí' : 'No' }}
          </v-chip>
        </template>

        <template #[`item.Status`]="{ item }">
          <v-chip :color="getStatusColor(item.StatusML)" size="small" class="text-capitalize">
            {{ item.StatusML || (item.Status ? 'active' : 'inactive') }}
          </v-chip>
        </template>

        <template #[`item.IsPopulate`]="{ item }">
          <v-chip :color="item.IsPopulate ? 'success' : 'grey'" size="small">
            {{ item.IsPopulate ? 'Sí' : 'No' }}
          </v-chip>
        </template>

        <template #[`item.updated_at`]="{ item }">
          {{ formatDate(item.updated_at) }}
        </template>

        <template #[`item.ExtUpdatedAt`]="{ item }">
          {{ item.ExtUpdatedAt ? formatDate(item.ExtUpdatedAt) : 'No disponible' }}
        </template>

        <template #[`item.ExtCreatedAt`]="{ item }">
          {{ item.ExtCreatedAt ? formatDate(item.ExtCreatedAt) : 'No disponible' }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="text-left">
            <v-menu location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  size="small"
                  color="grey-darken-1"
                  variant="text"
                  v-bind="props"
                  :disabled="loading"
                >
                  <v-icon>mdi-menu</v-icon>
                </v-btn>
              </template>

              <v-list density="compact">
                <!-- Ver detalles -->
                <v-list-item @click="viewProductDetail(item.ID)" :disabled="loading">
                  <template v-slot:prepend>
                    <v-icon color="primary" size="small">mdi-eye</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Ver detalles</v-list-item-title>
                </v-list-item>

                <!-- Eliminar publicación -->
                <v-list-item
                  @click="confirmDeleteProduct(item.ID)"
                  :disabled="loading || processingDeleteId === item.ID"
                >
                  <template v-slot:prepend>
                    <v-icon color="error" size="small" v-if="processingDeleteId !== item.ID"
                      >mdi-delete</v-icon
                    >
                    <v-progress-circular
                      v-else
                      indeterminate
                      size="16"
                      color="error"
                      class="mr-2"
                    ></v-progress-circular>
                  </template>
                  <v-list-item-title class="text-body-2">Eliminar publicación</v-list-item-title>
                </v-list-item>

                <!-- Populate -->
                <v-list-item
                  @click="confirmPopulateProduct(item.ID)"
                  :disabled="loading || processingPopulateId === item.ID"
                >
                  <template v-slot:prepend>
                    <v-icon color="success" size="small" v-if="processingPopulateId !== item.ID"
                      >mdi-database-import</v-icon
                    >
                    <v-progress-circular
                      v-else
                      indeterminate
                      size="16"
                      color="success"
                      class="mr-2"
                    ></v-progress-circular>
                  </template>
                  <v-list-item-title class="text-body-2">Populate</v-list-item-title>
                </v-list-item>

                <!-- Ver en Mercado Libre -->
                <v-list-item @click="openProductInNewTab(item.ID)">
                  <template v-slot:prepend>
                    <v-icon color="info" size="small">mdi-open-in-new</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Ver en Mercado Libre</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>

        <!-- No usamos el slot bottom para poder tener un paginador fijo -->
        <template #bottom> </template>
      </v-data-table>

      <!-- Paginador fijo -->
      <div class="pagination-fixed">
        <div class="d-flex align-center w-100 px-4 py-2 bg-white">
          <div class="d-flex align-center">
            <v-btn
              color="error"
              variant="outlined"
              size="small"
              :disabled="selectedItems.length === 0"
              @click="deleteSelectedItems"
              class="me-4"
            >
              <v-icon start>mdi-delete</v-icon>
              Eliminar {{ selectedItems.length }} seleccionadas
            </v-btn>

            <v-btn
              color="success"
              variant="outlined"
              size="small"
              :disabled="selectedItems.length === 0 || processingPopulateMultiple"
              @click="confirmPopulateSelectedItems"
              :loading="processingPopulateMultiple"
              class="me-4"
            >
              <v-icon start>mdi-database-import</v-icon>
              Populate {{ selectedItems.length }} seleccionadas
            </v-btn>
            <div class="text-caption text-grey me-4">
              {{
                totalProductIds > 0
                  ? `${(page - 1) * itemsPerPage + 1}-${Math.min(
                      page * itemsPerPage,
                      totalProductIds,
                    )} de ${totalProductIds}`
                  : '0-0 de 0'
              }}
            </div>
          </div>
          <div class="d-flex align-center me-4">
            <span class="text-caption me-2">Registros por página:</span>
            <v-select
              v-model="itemsPerPage"
              :items="itemsPerPageOptions"
              variant="outlined"
              density="compact"
              class="items-per-page-select"
              hide-details
              @update:model-value="handleItemsPerPageChange"
            ></v-select>
          </div>
          <v-pagination
            v-model="page"
            :length="Math.ceil(totalProductIds / itemsPerPage)"
            @update:model-value="handlePageChange"
            :disabled="loading"
            :total-visible="5"
            show-first
            show-last
            class="pagination-centered flex-grow-1"
            density="comfortable"
            rounded="circle"
            active-color="primary"
          ></v-pagination>
        </div>
      </div>
    </div>

    <!-- Diálogo de confirmación -->
    <v-dialog v-model="showConfirmDialog" max-width="450" content-class="elevation-0">
      <v-card class="rounded-lg" elevation="3">
        <v-card-title class="text-subtitle-1 pa-4 pb-0">
          {{ confirmDialogTitle }}
        </v-card-title>

        <v-card-text class="pa-4">
          <p class="text-body-2 text-medium-emphasis">{{ confirmDialogMessage }}</p>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            size="small"
            @click="showConfirmDialog = false"
            >Cancelar</v-btn
          >
          <v-btn
            color="primary"
            variant="text"
            size="small"
            @click="
              async () => {
                showConfirmDialog = false
                await confirmDialogAction()
              }
            "
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de progreso para populate múltiple -->
    <v-dialog v-model="showProgressDialog" persistent max-width="450" content-class="elevation-0">
      <v-card class="rounded-lg" elevation="3">
        <v-card-title class="text-subtitle-1 pa-4 pb-0">
          {{ progressDialogTitle }}
        </v-card-title>

        <v-card-text class="pa-4">
          <p class="text-body-2 text-medium-emphasis mb-4">{{ progressDialogMessage }}</p>

          <div
            class="progress-container pa-3 rounded-lg"
            style="background: rgba(0, 0, 0, 0.02); position: relative"
          >
            <v-progress-linear
              v-model="progressValue"
              color="primary"
              height="6"
              rounded
              bg-opacity="0.1"
            ></v-progress-linear>
            <div class="text-caption text-center mt-2" style="color: rgba(0, 0, 0, 0.6)">
              {{ Math.ceil(progressValue) }}%
            </div>
          </div>

          <div class="d-flex justify-space-between mt-3 text-caption text-medium-emphasis">
            <span>Procesados: {{ processedCount }} de {{ totalItemsToProcess }}</span>
            <span>Exitosos: {{ successCount }}</span>
          </div>
        </v-card-text>

        <v-divider v-if="!isProcessing"></v-divider>

        <v-card-actions v-if="!isProcessing" class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" size="small" @click="showProgressDialog = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Notificación de éxito o error -->
    <v-snackbar v-model="showNotification" :color="notificationType" :timeout="3000" location="top">
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showNotification = false"></v-btn>
      </template>
    </v-snackbar>

    <!-- Overlay de resultados de populate -->
    <v-overlay
      v-model="showResultsOverlay"
      class="align-center justify-center"
      persistent
      :scrim="true"
      scrim-class="bg-white"
      :opacity="0.3"
    >
      <v-card class="pa-3" min-width="600" max-width="800" elevation="8" rounded="lg">
        <v-card-title class="d-flex align-center py-2 px-3">
          <span class="text-subtitle-2 font-weight-medium">
            {{ resultsMessage }}
          </span>

          <!-- Botón de cerrar -->
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            size="small"
            color="grey-darken-1"
            @click="showResultsOverlay = false"
          ></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-3">
          <!-- Resultados del populate en formato minimalista -->
          <div
            class="d-flex align-center mb-3 pa-2"
            style="background: rgba(76, 175, 80, 0.05); border-left: 3px solid #4caf50"
          >
            <v-icon color="success" size="small" class="mr-2">mdi-check</v-icon>
            <span class="text-caption"
              >{{ successCount }} publicaciones procesadas correctamente</span
            >
          </div>

          <div v-if="failedCount > 0" class="mb-4">
            <div
              class="d-flex align-center mb-2 pa-2"
              style="background: rgba(244, 67, 54, 0.05); border-left: 3px solid #f44336"
            >
              <v-icon color="error" size="small" class="mr-2">mdi-close</v-icon>
              <span class="text-caption">{{ failedCount }} publicaciones fallaron</span>
            </div>

            <!-- Mostrar los detalles de los errores en una tabla minimalista -->
            <div v-if="errorResults.length > 0" class="mt-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-body-2">Detalles de los errores:</div>
                <div class="d-flex align-center">
                  <v-btn
                    size="small"
                    variant="outlined"
                    color="grey-darken-1"
                    prepend-icon="mdi-content-copy"
                    @click="copyAllErrorsToClipboard"
                    class="mr-2"
                    density="comfortable"
                  >
                    Copiar todos
                  </v-btn>
                  <span class="text-caption">{{ errorResults.length }} errores</span>
                </div>
              </div>

              <v-data-table
                :headers="[
                  { title: '#', key: 'index', width: '30px' },
                  { title: 'ID', key: 'id', width: '120px' },
                  { title: 'Resumen', key: 'summary' },
                  { title: '', key: 'actions', width: '40px', sortable: false },
                ]"
                :items="
                  errorResults.map((item, idx) => ({
                    index: idx + 1,
                    id: item.id,
                    summary: item.message
                      ? item.message.substring(0, 100) + (item.message.length > 100 ? '...' : '')
                      : 'Error desconocido',
                    error: item,
                  }))
                "
                density="compact"
                hover
                class="error-table text-caption"
              >
                <template #item.actions="{ item }">
                  <v-btn
                    icon
                    size="x-small"
                    color="grey-darken-1"
                    variant="text"
                    @click="viewErrorDetails(item.error)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Ver detalles</v-tooltip>
                  </v-btn>
                </template>
              </v-data-table>
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-2">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            size="small"
            @click="showResultsOverlay = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-overlay>

    <!-- Diálogo para mostrar detalles completos del error -->
    <v-dialog v-model="showErrorDialog" max-width="650" scrollable content-class="bg-overlay-minimal">
      <v-card class="rounded-lg" elevation="8">
        <v-card-title class="d-flex align-center py-2 px-3">
          <span class="text-subtitle-2">Detalle del error</span>
          <v-spacer></v-spacer>
          <v-btn
            prepend-icon="mdi-content-copy"
            variant="outlined"
            density="comfortable"
            size="small"
            color="grey-darken-1"
            @click="copyErrorToClipboard(selectedError)"
            class="mr-2"
          >
            Copiar
          </v-btn>
          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            size="small"
            color="grey-darken-1"
            @click="showErrorDialog = false"
          >
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-3">
          <div class="d-flex flex-column">
            <!-- Resumen del error -->
            <div
              class="mb-3 pa-3"
              style="background: rgba(244, 67, 54, 0.05); border-left: 3px solid #f44336"
            >
              <p class="text-body-2 mb-0">
                {{
                  typeof selectedError === 'string'
                    ? selectedError
                    : selectedError?.message || 'Error desconocido'
                }}
              </p>
            </div>

            <!-- Detalles completos del error -->
            <div class="mt-2">
              <p class="text-caption mb-1">Detalles completos:</p>
              <pre
                class="error-details pa-3 rounded bg-grey-lighten-5 overflow-x-auto"
                style="max-height: 300px; font-size: 12px; line-height: 1.5"
                >{{ formatErrorDetails(selectedError) }}</pre
              >
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" size="small" @click="showErrorDialog = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- El menú desplegable está ahora en la barra de herramientas -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import { migrationService } from '@/services/migrationService'
import { compareService } from '@/services/compareService'
import * as publicationOperations from '@/services/publicationOperations'
import { openInMercadoLibre } from '@/utils/mercadoLibreUtils'
import type { ProductId } from '@/services/migrationService'

const router = useRouter()

// Emits
// No hay emisiones de eventos

// Stores
const accountStore = useAccountStore()

// Estado
const loading = ref(false)
const error = ref<string | null>(null)
const productIds = ref<ProductId[]>([])
const statusFilter = ref('')
const syncActiveFilter = ref<string>('')
const catalogActiveFilter = ref<string>('')
const searchQuery = ref('')
const totalProductIds = ref(0)
const page = ref(1)
const itemsPerPage = ref(100)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const processingPopulateId = ref<string | null>(null)
const processingDeleteId = ref<string | null>(null)
const processingSyncActiveId = ref<string | null>(null)
const processingPopulateMultiple = ref<boolean>(false)
const processingPopulateAll = ref<boolean>(false)

// Estado para el diálogo de confirmación
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogAction = ref<() => Promise<void>>(() => Promise.resolve())

// Estado para el diálogo de progreso
const showProgressDialog = ref(false)
const progressDialogTitle = ref('')
const progressDialogMessage = ref('')
const progressValue = ref(0)
const processedCount = ref(0)
const successCount = ref(0)
const failedCount = ref(0)
const totalItemsToProcess = ref(0)
const isProcessing = ref(false)

// Definir la interfaz para el tipo de error
interface ErrorResult {
  id: string
  success: boolean
  message: string
  Code?: string
  Status?: number
  TecnicalDetails?: string
  [key: string]: any // Para otros campos que puedan venir en el error
}

// Estado para el overlay de resultados
const showResultsOverlay = ref(false)
const resultsMessage = ref('')
const populateHasErrors = ref(false)
const errorResults = ref<ErrorResult[]>([])

// Estado para el diálogo de error
const showErrorDialog = ref(false)
const selectedError = ref<ErrorResult | null>(null)

// Opciones para items por página
const itemsPerPageOptions = [10, 25, 50, 100, 250, 500, 1000]

// Opciones de filtro
const statusOptions = [
  { title: 'Todos', value: '' },
  { title: 'Activo', value: 'active' },
  { title: 'Inactivas', value: 'inactive' },
  { title: 'Pausado', value: 'paused' },
  { title: 'Finalizado', value: 'closed' },
]

const booleanFilterOptions = [
  { title: 'Todos', value: '' },
  { title: 'Sí', value: 'true' },
  { title: 'No', value: 'false' },
]

// Estado para los elementos seleccionados
const selectedItems = ref<ProductId[]>([])

// Estado para el menú de columnas visibles
const showColumnsMenu = ref(false)

// Definición de todas las columnas disponibles
const allColumns = [
  { title: '', key: 'select', sortable: false, required: true },
  {
    title: 'ID',
    key: 'ID',
    sortable: true,
    filterable: true,
    required: true,
  },
  { title: 'Sync', key: 'SyncActive', sortable: true, class: 'text-center', required: false },
  { title: 'Catálogo', key: 'CatalogActive', sortable: true, required: false },
  { title: 'Estado', key: 'Status', sortable: true, required: false },
  { title: 'Populate', key: 'IsPopulate', sortable: true, required: false },
  { title: 'F. Populated', key: 'updated_at', sortable: true, required: false },
  { title: 'F. Updated', key: 'ExtUpdatedAt', sortable: true, required: false },
  { title: 'F. Created', key: 'ExtCreatedAt', sortable: true, required: false },
  { title: '', key: 'actions', sortable: false, required: true },
]

// Definir las columnas que se mostrarán por defecto
const defaultColumns = [
  'select', // Siempre incluir la columna de selección
  'ID',
  'SyncActive',
  'CatalogActive',
  'Status',
  'StatusML',
  'actions', // Siempre incluir la columna de acciones
]

// Estado para las columnas visibles (inicialmente las columnas por defecto)
const visibleColumns = ref<string[]>([])

// Cabeceras de tabla para IDs de productos (filtradas según las columnas visibles)
const productIdsHeaders = computed(() => {
  return allColumns.filter((col) => visibleColumns.value.includes(col.key) || col.required)
})

// Estado para el filtro de búsqueda en la tabla
const showIdSearch = ref(false)

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

// Verificar si hay filtros activos
const hasActiveFilters = computed(() => {
  return (
    statusFilter.value !== '' ||
    syncActiveFilter.value !== '' ||
    catalogActiveFilter.value !== '' ||
    searchQuery.value !== ''
  )
})

// Mensaje de resultados filtrados
const filteredMessage = computed(() => {
  if (!hasActiveFilters.value || !productIds.value.length) return ''

  const total = productIds.value.length
  const filtered = filteredProductIds.value.length

  return `Mostrando ${filtered} de ${total} publicaciones`
})

// Filtrar IDs de productos
const filteredProductIds = computed(() => {
  let filtered = [...productIds.value]

  // Filtrar por estado
  if (statusFilter.value) {
    const filterValue = statusFilter.value.toLowerCase()

    if (filterValue === 'active') {
      // Filtrar solo los productos con estado 'active'
      filtered = filtered.filter(
        (item) =>
          item.StatusML?.toLowerCase() === 'active' ||
          (item.StatusML === undefined && item.Status === true),
      )
    } else if (filterValue === 'inactive') {
      // Filtrar todos los productos con estado diferente a 'active'
      filtered = filtered.filter(
        (item) =>
          item.StatusML?.toLowerCase() !== 'active' &&
          !(item.StatusML === undefined && item.Status === true),
      )
    } else if (filterValue === 'paused') {
      // Filtrar solo los productos con estado 'paused'
      filtered = filtered.filter((item) => item.StatusML?.toLowerCase() === 'paused')
    } else if (filterValue === 'closed') {
      // Filtrar solo los productos con estado 'closed'
      filtered = filtered.filter((item) => item.StatusML?.toLowerCase() === 'closed')
    }
  }

  // Filtrar por Sync Activo
  if (syncActiveFilter.value) {
    const isActive = syncActiveFilter.value === 'true' ? true : false
    filtered = filtered.filter((item) => item.SyncActive === isActive)
  }

  // Filtrar por Catálogo Activo
  if (catalogActiveFilter.value) {
    const isActive = catalogActiveFilter.value === 'true' ? true : false
    filtered = filtered.filter((item) => item.CatalogActive === isActive)
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((item) => {
      return item.ID.toLowerCase().includes(query)
    })
  }

  return filtered
})

// Cargar IDs de productos
const loadProductIds = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver los productos'
    // Mostrar notificación cuando no hay cuenta seleccionada
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta para ver los productos'
    notificationType.value = 'warning'
    return
  }

  loading.value = true
  error.value = null

  try {
    const offset = (page.value - 1) * itemsPerPage.value
    const response = await migrationService.getProductIds(
      accountId.value,
      undefined, // status
      offset,
      itemsPerPage.value,
    )

    if (response && response.products) {
      productIds.value = response.products
      totalProductIds.value = response.total
    } else {
      error.value = 'Error al cargar IDs de productos'
      // Mostrar notificación de error
      showNotification.value = true
      notificationMessage.value = 'Error al cargar IDs de productos'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error('Error al cargar IDs de productos:', err)

    // Extraer mensaje de error más detallado
    let errorMessage = 'Error al cargar IDs de productos'

    if (err instanceof Error) {
      errorMessage = `Error al cargar IDs de productos: ${err.message}`
    } else if (typeof err === 'object' && err !== null && 'response' in err) {
      // Error de Axios
      const axiosError = err as { response?: { status?: number; data?: any } }
      if (axiosError.response?.status === 502) {
        errorMessage = 'El servidor no está disponible (Error 502). Por favor, intenta más tarde.'
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      } else if (axiosError.response?.data?.Message) {
        errorMessage = axiosError.response.data.Message
      }
    }

    error.value = errorMessage

    // Mostrar notificación de error
    showNotification.value = true
    notificationMessage.value = errorMessage
    notificationType.value = 'error'
  } finally {
    loading.value = false
  }
}

// Ver detalles del producto
const viewProductDetail = (productId: string) => {
  // Abrir en una nueva pestaña
  const route = router.resolve(`/product-detail/${productId}`)
  window.open(route.href, '_blank')
}

// Actualizar el estado de sincronización de un producto
const toggleSyncActive = async (productId: string, currentValue: boolean) => {
  if (!hasAccount.value) return

  try {
    processingSyncActiveId.value = productId
    const newValue = !currentValue

    const result = await migrationService.updateSyncActive(productId, newValue, accountId.value)

    if (result && result.success) {
      // Actualizar el estado localmente para evitar recargar toda la lista
      const index = productIds.value.findIndex((p) => p.ID === productId)
      if (index !== -1) {
        productIds.value[index].SyncActive = newValue
      }

      notificationMessage.value = result.message
      notificationType.value = 'success'
    } else {
      notificationMessage.value = 'Error al actualizar el estado de sincronización'
      notificationType.value = 'error'
      // Recargar la lista para asegurar que los datos están actualizados
      await loadProductIds()
    }
  } catch (err) {
    console.error(`Error al actualizar el estado de sincronización para ${productId}:`, err)
    notificationMessage.value = 'Error al actualizar el estado de sincronización'
    notificationType.value = 'error'
    // Recargar la lista para asegurar que los datos están actualizados
    await loadProductIds()
  } finally {
    showNotification.value = true
    processingSyncActiveId.value = null
  }
}

// Confirmar eliminación de un producto
const confirmDeleteProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar eliminación'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar la publicación ${productId}? Esta acción no se puede deshacer.`
  confirmDialogAction.value = () => deleteProduct(productId)
  showConfirmDialog.value = true
}

// Eliminar un producto
const deleteProduct = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    processingDeleteId.value = productId
    const result = await migrationService.deleteProduct(accountId.value, productId)

    if (result && result.success) {
      notificationMessage.value = result.message
      notificationType.value = 'success'
      await loadProductIds()
    } else {
      notificationMessage.value = 'Error al eliminar la publicación'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al eliminar el producto ${productId}:`, err)
    notificationMessage.value = 'Error al eliminar la publicación'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingDeleteId.value = null
  }
}

// Confirmar populate de un producto
const confirmPopulateProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar populate'
  confirmDialogMessage.value = `¿Estás seguro de que deseas hacer populate de la publicación ${productId}?`
  confirmDialogAction.value = () => populateProduct(productId)
  showConfirmDialog.value = true
}

// Populate un producto
const populateProduct = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    processingPopulateId.value = productId

    // Usar la función reutilizable del servicio publicationOperations
    const result = await publicationOperations.populateProduct(accountId.value, productId)

    // Manejar el resultado
    notificationMessage.value = result.message
    notificationType.value = result.success ? 'success' : 'error'

    // Si fue exitoso, recargar los IDs de productos
    if (result.success) {
      await loadProductIds()
    }
  } catch (err) {
    console.error(`Error al hacer populate del producto ${productId}:`, err)
    notificationMessage.value = 'Error al hacer populate de la publicación'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingPopulateId.value = null
  }
}

// Eliminar los elementos seleccionados
const deleteSelectedItems = async () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Eliminar publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar las ${selectedItems.value.length} publicaciones seleccionadas?`
  confirmDialogAction.value = async () => {
    try {
      // Mostrar loading
      loading.value = true

      // Llamar al servicio para eliminar los productos seleccionados
      const result = await migrationService.deleteMultipleProducts(
        accountId.value,
        selectedItems.value.map((item) => item.ID),
      )

      if (result && result.success) {
        notificationMessage.value = result.message
        notificationType.value = 'success'
        selectedItems.value = []
        await loadProductIds()
      } else {
        notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
        notificationType.value = 'error'
      }
    } catch (err) {
      console.error('Error al eliminar productos seleccionados:', err)
      notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
      notificationType.value = 'error'
    } finally {
      showNotification.value = true
      loading.value = false
    }
  }
  showConfirmDialog.value = true
}

// Confirmar populate de múltiples productos
const confirmPopulateSelectedItems = () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Populate publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas hacer populate de las ${selectedItems.value.length} publicaciones seleccionadas?`
  confirmDialogAction.value = () => populateSelectedItems()
  showConfirmDialog.value = true
}

// Populate múltiples productos
const populateSelectedItems = async () => {
  if (!hasAccount.value || selectedItems.value.length === 0) return

  try {
    // Inicializar variables de progreso
    processingPopulateMultiple.value = true
    isProcessing.value = true
    showProgressDialog.value = true
    progressDialogTitle.value = 'Procesando publicaciones'
    progressDialogMessage.value = 'Realizando populate de las publicaciones seleccionadas...'
    progressValue.value = 0
    processedCount.value = 0
    successCount.value = 0
    failedCount.value = 0
    totalItemsToProcess.value = selectedItems.value.length
    errorResults.value = []

    // Convertir los IDs seleccionados a strings si es necesario
    const productIds = selectedItems.value.map((id) => id.toString())

    // Procesar cada producto individualmente para mostrar el progreso
    let successfulCount = 0
    let failedItemsCount = 0

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i]

      try {
        // Llamar al API para cada producto
        const result = await migrationService.updateProductPopulate(accountId.value, productId)

        if (result.success) {
          successfulCount++
          successCount.value = successfulCount
        } else {
          failedItemsCount++
          failedCount.value = failedItemsCount
          // Guardar el error para mostrarlo en el overlay
          // Manejar la estructura específica de error del endpoint
          errorResults.value.push({
            id: productId,
            success: false,
            message: result.message || result.Message || 'Error desconocido',
            Code: result.Code,
            Status: result.Status,
            TecnicalDetails: result.TecnicalDetails,
          })
        }
      } catch (error) {
        failedItemsCount++
        failedCount.value = failedItemsCount
        // Guardar el error para mostrarlo en el overlay
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

        // Intentar extraer más información si es un error de API
        const apiError = error as any
        errorResults.value.push({
          id: productId,
          success: false,
          message: errorMessage,
          Code: apiError?.Code || apiError?.code,
          Status: apiError?.Status || apiError?.status,
          TecnicalDetails:
            apiError?.TecnicalDetails || apiError?.tecnicalDetails || apiError?.details,
        })
      }

      // Actualizar el progreso
      processedCount.value = i + 1
      progressValue.value = ((i + 1) / productIds.length) * 100
    }

    // Cerrar el diálogo de progreso
    showProgressDialog.value = false

    // Preparar y mostrar el overlay de resultados
    populateHasErrors.value = failedCount.value > 0
    resultsMessage.value = `Proceso completado: ${successCount.value} exitosos, ${failedCount.value} fallidos de ${productIds.length} totales`
    showResultsOverlay.value = true

    // Recargar los datos y deseleccionar publicaciones
    await loadProductIds()
    selectedItems.value = [] // Deseleccionar todas las publicaciones
  } catch (err) {
    console.error('Error al hacer populate de productos seleccionados:', err)
    progressDialogMessage.value = 'Error al procesar las publicaciones'
    showProgressDialog.value = false

    // Mostrar el error en el overlay
    populateHasErrors.value = true
    resultsMessage.value = 'Error al procesar las publicaciones'

    // Extraer detalles del error
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
    const apiError = err as any

    errorResults.value = [
      {
        id: 'general',
        success: false,
        message: errorMessage,
        Code: apiError?.Code || apiError?.code,
        Status: apiError?.Status || apiError?.status,
        TecnicalDetails:
          apiError?.TecnicalDetails || apiError?.tecnicalDetails || apiError?.details,
      },
    ]

    showResultsOverlay.value = true
  } finally {
    processingPopulateMultiple.value = false
    isProcessing.value = false
  }
}

// Confirmar populate de todas las publicaciones de la cuenta
const confirmPopulateAllProducts = (isEmpty: boolean = false) => {
  if (!hasAccount.value) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = isEmpty
    ? 'Populate publicaciones sin atributos'
    : 'Populate todas las publicaciones'
  confirmDialogMessage.value = isEmpty
    ? `¿Estás seguro de que deseas hacer populate de todas las publicaciones SIN ATRIBUTOS de la cuenta? Este proceso puede tardar varios minutos.`
    : `¿Estás seguro de que deseas hacer populate de TODAS las publicaciones de la cuenta? Este proceso puede tardar varios minutos.`
  confirmDialogAction.value = () => populateAllProducts(isEmpty)
  showConfirmDialog.value = true
}

// Populate todas las publicaciones de la cuenta
const populateAllProducts = async (isEmpty: boolean = false) => {
  if (!hasAccount.value) return

  try {
    processingPopulateAll.value = true

    // Crear una promesa de timeout para mostrar un mensaje rápido al usuario
    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Proceso de populate ${isEmpty ? 'para publicaciones sin atributos' : 'para todas las publicaciones'} iniciado. Este proceso puede tardar varios minutos.`,
        })
      }, 3000) // Esperamos máximo 3 segundos por una respuesta inicial
    })

    // Iniciar el proceso de populate sin esperar a que termine completamente
    const populatePromise = migrationService.updateAllProductsPopulate(accountId.value, isEmpty)

    // Esperamos solo la confirmación de inicio o el timeout, lo que ocurra primero
    const result = await Promise.race([populatePromise, timeoutPromise])

    // Mostrar mensaje de resultado inicial
    notificationMessage.value = result.message
    notificationType.value = 'success'
    showNotification.value = true

    // Recargar los datos después de un tiempo para ver los cambios iniciales
    setTimeout(() => {
      // Mostrar mensaje adicional explicando que el proceso continuará en segundo plano
      showNotification.value = true
      notificationMessage.value =
        'El proceso de populate continuará en segundo plano. Puedes seguir usando la aplicación.'
      notificationType.value = 'success'
    }, 3000)

    // Continuamos con la promesa original en segundo plano
    populatePromise
      .then((finalResult) => {
        // Cuando finalmente termine, mostramos el resultado completo
        if (finalResult.count && finalResult.count > 0) {
          setTimeout(() => {
            loadProductIds()
            showNotification.value = true
            notificationMessage.value = `Proceso de populate completado: ${finalResult.count} publicaciones procesadas.`

            // Si hay menos de 10 publicaciones, mostrar los IDs en el mensaje
            if (finalResult.data && finalResult.data.length > 0 && finalResult.data.length <= 10) {
              notificationMessage.value += `\nIDs: ${finalResult.data.join(', ')}`
            }

            notificationType.value = 'success'
          }, 10000) // Mostramos este mensaje después de 10 segundos
        }
      })
      .catch((error) => {
        console.error('Error en el proceso de populate en segundo plano:', error)
        setTimeout(() => {
          showNotification.value = true
          notificationMessage.value = 'Error durante el proceso de populate en segundo plano'
          notificationType.value = 'error'
        }, 5000)
      })
  } catch (err) {
    console.error('Error al iniciar el proceso de populate:', err)
    notificationMessage.value = 'Error al iniciar el proceso de populate para las publicaciones'
    notificationType.value = 'error'
    showNotification.value = true
  } finally {
    processingPopulateAll.value = false
  }
}

// Alias para mantener compatibilidad con el código existente
const openProductInNewTab = openInMercadoLibre

// Formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return 'No disponible'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (_) {
    return 'N/A'
  }
}

// Funciones para manejar errores
const viewErrorDetails = (error: ErrorResult) => {
  selectedError.value = error
  showErrorDialog.value = true
}

const copyErrorToClipboard = (error: ErrorResult | null) => {
  if (!error) return

  const errorText = formatErrorDetails(error)
  navigator.clipboard
    .writeText(errorText)
    .then(() => {
      // Opcional: mostrar alguna notificación de éxito
      console.log('Error copiado al portapapeles')
    })
    .catch((err) => {
      console.error('Error al copiar al portapapeles:', err)
    })
}

const copyAllErrorsToClipboard = () => {
  const allErrors = errorResults.value
    .map((item, index) => {
      return `Error #${index + 1} - ID: ${item.id}\n${formatErrorDetails(item)}`
    })
    .join('\n\n' + '-'.repeat(50) + '\n\n')

  navigator.clipboard
    .writeText(allErrors)
    .then(() => {
      console.log('Todos los errores copiados al portapapeles')
    })
    .catch((err) => {
      console.error('Error al copiar al portapapeles:', err)
    })
}

const formatErrorDetails = (error: ErrorResult | null | unknown): string => {
  if (!error) return 'No hay detalles disponibles'

  if (typeof error === 'string') {
    return error
  }

  // Convertir a objeto para facilitar el acceso a las propiedades
  const errorObj = error as Record<string, any>

  // Manejar la estructura específica de error del endpoint /v1/migration/update/products/populate/{id}
  // ErrorCustom struct { Code string, Status int, Message string, TecnicalDetails string }
  if (errorObj.Code || errorObj.Status || errorObj.TecnicalDetails) {
    let details = ''

    if (errorObj.Message) {
      details += `Mensaje: ${errorObj.Message}\n`
    }

    if (errorObj.Code) {
      details += `Código: ${errorObj.Code}\n`
    }

    if (errorObj.Status) {
      details += `Estado: ${errorObj.Status}\n`
    }

    if (errorObj.TecnicalDetails) {
      details += `\nDetalles técnicos:\n${errorObj.TecnicalDetails}`
    }

    if (errorObj.id) {
      details += `\nID: ${errorObj.id}`
    }

    return details
  }

  // Manejo genérico para otros formatos de error
  if (errorObj.message) {
    let details = `Mensaje: ${errorObj.message}\n`

    if (errorObj.id) {
      details += `ID: ${errorObj.id}\n`
    }

    // Si hay más detalles en el objeto error, mostrarlos
    try {
      const otherDetails = { ...errorObj }
      delete otherDetails.message
      delete otherDetails.id

      if (Object.keys(otherDetails).length > 0) {
        details += `\nDetalles adicionales:\n${JSON.stringify(otherDetails, null, 2)}`
      }
    } catch (e) {
      // Si no se puede clonar el objeto, simplemente ignorar
    }

    return details
  }

  // Si nada más funciona, intentar convertir a JSON
  try {
    return JSON.stringify(error, null, 2)
  } catch (e) {
    return 'Error no serializable'
  }
}

// Funciones para gestionar columnas visibles
const toggleColumnVisibility = (key: string) => {
  // No permitir ocultar columnas requeridas
  const column = allColumns.find((col) => col.key === key)
  if (column?.required) return

  // Alternar visibilidad
  if (visibleColumns.value.includes(key)) {
    visibleColumns.value = visibleColumns.value.filter((k) => k !== key)
  } else {
    visibleColumns.value.push(key)
  }

  // Guardar preferencias en localStorage
  localStorage.setItem('publicationsTableColumns', JSON.stringify(visibleColumns.value))
}

// Establecer columnas por defecto
const selectDefaultColumns = () => {
  // Asegurarse de que las columnas requeridas siempre estén incluidas
  const requiredKeys = allColumns.filter((col) => col.required).map((col) => col.key)
  // Crear un array con valores únicos sin usar Set para evitar problemas de TypeScript
  const uniqueColumns = [...defaultColumns]
  requiredKeys.forEach((key) => {
    if (!uniqueColumns.includes(key)) {
      uniqueColumns.push(key)
    }
  })
  visibleColumns.value = uniqueColumns
  localStorage.setItem('publicationsTableColumns', JSON.stringify(visibleColumns.value))
  showColumnsMenu.value = false // Cerrar el menú después de aplicar los cambios
}

// Restablecer columnas visibles a mostrar todas
const resetColumns = () => {
  visibleColumns.value = allColumns.map((col) => col.key)
  localStorage.setItem('publicationsTableColumns', JSON.stringify(visibleColumns.value))
  showColumnsMenu.value = false // Cerrar el menú después de aplicar los cambios
}

// Cargar preferencias de columnas desde localStorage al iniciar
const loadColumnPreferences = () => {
  const savedColumns = localStorage.getItem('publicationsTableColumns')
  if (savedColumns) {
    try {
      const parsedColumns = JSON.parse(savedColumns)
      // Asegurarse de que las columnas requeridas siempre estén incluidas
      const requiredKeys = allColumns.filter((col) => col.required).map((col) => col.key)
      // Crear un array con valores únicos sin usar Set para evitar problemas de TypeScript
      const uniqueColumns = [...parsedColumns]
      requiredKeys.forEach((key) => {
        if (!uniqueColumns.includes(key)) {
          uniqueColumns.push(key)
        }
      })
      visibleColumns.value = uniqueColumns
    } catch (error) {
      console.error('Error al cargar preferencias de columnas:', error)
      // Si hay un error, usar las columnas por defecto
      selectDefaultColumns()
    }
  } else {
    // Si no hay preferencias guardadas, usar las columnas por defecto
    selectDefaultColumns()
  }
}

// La función formatPrice ha sido eliminada

// Determinar el color del chip según el estado
const getStatusColor = (statusML: string | undefined): string => {
  if (!statusML) return 'grey'

  statusML = statusML.toLowerCase()

  switch (statusML) {
    case 'active':
      return 'success'
    case 'paused':
      return 'warning'
    case 'closed':
      return 'error'
    case 'inactive':
      return 'grey-darken-1'
    default:
      return 'grey'
  }
}

// Manejar cambio de página
const handlePageChange = () => {
  loadProductIds()
}

// Manejar cambio de items por página
const handleItemsPerPageChange = () => {
  page.value = 1 // Resetear a la primera página cuando cambia el número de items por página
  loadProductIds()
}

// Manejar cambio de filtro de estado
const handleStatusFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Manejar cambio de filtro de sync activo
const handleSyncActiveFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Manejar cambio de filtro de catálogo activo
const handleCatalogActiveFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Referencias para el campo de búsqueda y la tabla de datos
const searchInput = ref<HTMLElement | null>(null)
const dataTable = ref<unknown>(null)

// Función para manejar el ordenamiento
const handleSort = (key: string) => {
  if (dataTable.value) {
    // Intentar usar el método sort de la tabla si está disponible
    if (typeof dataTable.value.sort === 'function') {
      dataTable.value.sort(key)
    }
  }
}

// Definir interfaz para la columna
interface TableColumn {
  sortable?: boolean
  key?: string
  options?: {
    sortBy?: string[]
    sortDesc?: boolean[]
  }
}

// Función para verificar si una columna está ordenada
const isSorted = (column: TableColumn) => {
  if (!column.sortable || !column.options || !column.options.sortBy) return false
  return column.options.sortBy.includes(column.key || '')
}

// Función para obtener el icono de ordenamiento
const getSortIcon = (column: TableColumn) => {
  // Si la columna no está ordenada, mostrar el icono neutral
  if (!column.sortable) return ''

  // Verificar si la tabla tiene información de ordenamiento
  if (!column.options || !column.options.sortBy) return 'mdi-arrow-up-down'

  // Determinar la dirección del ordenamiento
  if (!isSorted(column)) return 'mdi-arrow-up-down'

  // Mostrar el icono según la dirección del ordenamiento
  return column.options.sortDesc && column.options.sortDesc[0] ? 'mdi-arrow-down' : 'mdi-arrow-up'
}

// Función para activar la búsqueda
const activateSearch = () => {
  showIdSearch.value = true
  // Enfocar el campo de búsqueda después de que se muestre
  setTimeout(() => {
    if (searchInput.value) {
      const input = searchInput.value.querySelector('input')
      if (input) input.focus()
    }
  }, 100)
}

// Función para desactivar la búsqueda
const deactivateSearch = () => {
  showIdSearch.value = false
}

// Función para manejar cuando se pierde el foco en el campo de búsqueda
const handleSearchBlur = () => {
  // Usar setTimeout para permitir que otros eventos (como click) se procesen primero
  setTimeout(() => {
    // Verificar si el campo de búsqueda sigue teniendo el foco
    const activeElement = document.activeElement
    const searchField = searchInput.value

    // Si el elemento activo no es el campo de búsqueda o un elemento dentro de él
    if (searchField && !searchField.contains(activeElement)) {
      // Solo desactivar si el campo está vacío
      if (!searchQuery.value) {
        deactivateSearch()
      }
    }
  }, 100)
}

// Función para manejar el cambio en la búsqueda
const handleSearchQueryChange = () => {
  // Reiniciar a la primera página cuando cambia la búsqueda
  page.value = 1
}

// Función para limpiar la búsqueda
const clearSearchQuery = () => {
  searchQuery.value = ''
  handleSearchQueryChange()
  deactivateSearch()
}

// Limpiar todos los filtros
const clearAllFilters = () => {
  statusFilter.value = ''
  syncActiveFilter.value = ''
  catalogActiveFilter.value = ''
  searchQuery.value = ''
  handleStatusFilterChange()
}

// Observar cambios en la cuenta seleccionada
watch(
  () => accountId.value,
  (newAccountId) => {
    if (newAccountId) {
      loadProductIds()
    }
  },
)

// Cargar datos al montar el componente
onMounted(() => {
  // Cargar preferencias de columnas
  loadColumnPreferences()

  // Cargar datos si hay una cuenta seleccionada
  if (hasAccount.value) {
    loadProductIds()
  }
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 16px;
}

.items-per-page-select {
  width: 100px;
}

.v-data-table :deep(th) {
  font-weight: 600 !important;
  background-color: #f5f5f5;
}

.v-data-table :deep(tr:hover) {
  background-color: #f9f9f9;
}

.position-relative {
  position: relative;
}

.pagination-fixed {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.05);
  border-radius: 0 0 8px 8px;
}

.pagination-centered {
  margin: 0 auto;
}

/* Estilos para la transición del campo de búsqueda */
.v-slide-x-transition-enter-active,
.v-slide-x-transition-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}

.search-field {
  transition: all 0.3s ease;
  width: 100%;
}

/* Estilo para el campo de búsqueda en el encabezado */
:deep(.search-field .v-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 32px;
}

:deep(.v-field__field) {
  height: 32px;
}

/* Animación de pulso para el chip cuando se está procesando */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pulse-animation {
  animation: pulse 1.5s infinite ease-in-out;
}

/* Estilos para el encabezado ordenable */
.sortable-header {
  cursor: pointer;
  user-select: none;
}

.sortable-header:hover {
  color: var(--v-theme-primary);
}

.sort-icon {
  opacity: 0.7;
  margin-left: 4px;
}

.visible-on-hover {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sortable-header:hover .visible-on-hover {
  opacity: 0.7;
}

/* Estilos para la transición suave */
.header-content {
  min-height: 40px;
}

.search-field {
  width: 100%;
}

/* Ajustes para las transiciones */
.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
  transition: opacity 0.3s ease;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
  opacity: 0;
}

/* Estilo para el fondo del diálogo de errores */
.bg-overlay-minimal {
  background-color: rgba(255, 255, 255, 0.3) !important;
}
</style>
