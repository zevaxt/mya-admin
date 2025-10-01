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

          <!-- Estado de carga -->
          <v-card-text v-if="loading">
            <div class="d-flex flex-column justify-center align-center" style="height: 400px">
              <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
              <span class="text-subtitle-1">Cargando detalles del producto...</span>
            </div>
          </v-card-text>

          <!-- Producto cargado correctamente -->
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

                <v-card class="mb-4">
                  <v-table density="compact" class="product-details-table">
                    <tbody>
                      <!-- Precio -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3" width="180">Precio</td>
                        <td>{{ formatPrice(product.Attributes?.price || 0) }}</td>
                      </tr>
                      
                      <!-- Cuenta -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Cuenta</td>
                        <td>
                          <v-chip color="primary" size="small">
                            {{ getAccountName(product.AccountID) }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Estado -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Estado</td>
                        <td>
                          <v-chip
                            :color="product.Attributes?.status === 'active' ? 'success' : 'error'"
                            size="small"
                          >
                            {{ product.Attributes?.status === 'active' ? 'Activo' : 'Inactivo' }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Catálogo -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Catálogo</td>
                        <td>
                          <v-chip
                            :color="product.Attributes?.catalog_listing ? 'success' : 'grey-darken-1'"
                            size="small"
                          >
                            {{ product.Attributes?.catalog_listing ? 'Sí' : 'No' }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Catálogo Activo -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Catálogo Activo</td>
                        <td>
                          <v-chip
                            :color="product.Attributes?.CatalogActive ? 'success' : 'grey-darken-1'"
                            size="small"
                          >
                            {{ product.Attributes?.CatalogActive ? 'Sí' : 'No' }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- ID Producto Catálogo -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">ID Producto Catálogo</td>
                        <td>
                          <template v-if="product.Attributes?.catalog_product_id">
                            <v-chip
                              color="purple"
                              size="small"
                              class="text-truncate"
                              style="max-width: 200px"
                            >
                              {{ product.Attributes?.catalog_product_id }}
                            </v-chip>
                            <v-btn
                              icon="mdi-content-copy"
                              size="x-small"
                              variant="text"
                              color="grey"
                              class="ml-1"
                              @click="copyToClipboard(product.Attributes?.catalog_product_id)"
                            ></v-btn>
                          </template>
                          <template v-else>
                            <v-chip color="grey-lighten-1" size="small">N/A</v-chip>
                          </template>
                        </td>
                      </tr>
                      
                      <!-- Publicaciones Relacionadas -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Publicaciones Relacionadas</td>
                        <td>
                          <template v-if="product.Attributes?.catalog_listing && product.Attributes?.item_relations?.length > 0">
                            <v-chip color="info" size="small">
                              {{ product.Attributes.item_relations.length }} relacionadas
                            </v-chip>
                          </template>
                          <template v-else-if="product.Attributes?.catalog_listing">
                            <v-chip color="warning" size="small">Sin relaciones</v-chip>
                          </template>
                          <template v-else>
                            <v-chip color="grey-lighten-1" size="small">N/A</v-chip>
                          </template>
                        </td>
                      </tr>
                      
                      <!-- Condición -->
                      <tr v-if="product.Attributes?.condition">
                        <td class="font-weight-medium text-grey-darken-3">Condición</td>
                        <td>
                          <v-chip
                            :color="product.Attributes?.condition === 'new' ? 'success' : 'blue'"
                            size="small"
                          >
                            {{ product.Attributes?.condition === 'new' ? 'Nuevo' : 'Usado' }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Cantidad disponible -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Cantidad disponible</td>
                        <td>
                          <v-chip color="blue-grey" size="small">
                            {{ product.Attributes?.available_quantity || 0 }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Salud del producto -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Salud del producto</td>
                        <td>
                          <v-chip :color="getHealthColor(product.Attributes?.health)" size="small">
                            {{ formatHealthPercentage(product.Attributes?.health) }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Canales -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Canales</td>
                        <td>
                          <template v-if="product.Attributes?.channels && product.Attributes.channels.length > 0">
                            <v-chip
                              v-for="(channel, index) in product.Attributes.channels"
                              :key="index"
                              color="blue-grey"
                              size="small"
                              class="mr-1 mb-1"
                            >
                              {{ channel }}
                            </v-chip>
                          </template>
                          <template v-else>
                            <v-chip color="grey-lighten-1" size="small">N/A</v-chip>
                          </template>
                        </td>
                      </tr>
                      
                      <!-- Fecha de creación -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Fecha de creación</td>
                        <td>
                          <v-chip color="blue-grey-lighten-2" size="small">
                            {{ formatDate(product.Attributes?.date_created) }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Cantidad vendida -->
                      <tr v-if="product.Attributes?.sold_quantity !== undefined">
                        <td class="font-weight-medium text-grey-darken-3">Cantidad vendida</td>
                        <td>
                          <v-chip color="blue-grey" size="small">
                            {{ product.Attributes?.sold_quantity || 0 }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Categoría -->
                      <tr>
                        <td class="font-weight-medium text-grey-darken-3">Categoría</td>
                        <td>
                          <v-chip color="blue-grey-lighten-3" size="small">
                            {{ product.Attributes?.category_id || '-' }}
                          </v-chip>
                        </td>
                      </tr>
                      
                      <!-- Garantía -->
                      <tr v-if="product.Attributes?.warranty">
                        <td class="font-weight-medium text-grey-darken-3">Garantía</td>
                        <td>
                          <v-chip color="blue-grey-lighten-3" size="small">
                            {{ product.Attributes?.warranty || 'Sin garantía' }}
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card>

                <!-- Botón para ver en Mercado Libre -->

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
                        class="mb-4 position-relative"
                      >
                        <v-card variant="outlined" class="description-card">
                          <v-card-title class="text-subtitle-1 d-flex justify-space-between align-center py-2 px-4 bg-grey-lighten-4">
                            <span>Descripción {{ product.Attributes.descriptions.length > 1 ? (index + 1) : '' }}</span>
                            <v-btn
                              color="primary"
                              variant="elevated"
                              size="small"
                              class="copy-btn"
                              @click="copyToClipboard(description)"
                              prepend-icon="mdi-content-copy"
                            >
                              Copiar
                              <v-tooltip activator="parent" location="top">Copiar descripción</v-tooltip>
                            </v-btn>
                          </v-card-title>
                          <v-card-text class="text-body-1 pt-4" style="white-space: pre-line">
                            {{ description }}
                          </v-card-text>
                        </v-card>
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
            <v-alert type="warning" border="start" prominent>
              <v-row class="align-center">
                <v-col cols="auto">
                  <v-icon size="36" icon="mdi-alert-circle-outline"></v-icon>
                </v-col>
                <v-col>
                  <div class="text-subtitle-1 font-weight-medium mb-1">No se encontró información del producto</div>
                  <div class="text-body-2">
                    Esto puede deberse a que:
                    <ul class="mt-1">
                      <li>El producto no existe</li>
                      <li>No tienes permisos para ver este producto</li>
                      <li>Hubo un error en la comunicación con el servidor</li>
                    </ul>
                    <div class="mt-2">Por favor, vuelve a la lista de productos e intenta nuevamente.</div>
                  </div>
                </v-col>
              </v-row>
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
const loading = ref(true) // Iniciar con loading en true para mostrar el indicador de carga inmediatamente

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
  
  if (!productId) {
    showNotification.value = true
    notificationMessage.value = 'ID de producto no válido'
    notificationType.value = 'error'
    loading.value = false
    return
  }
  
  const accountId = accountStore.currentAccount?.ID

  if (!accountId) {
    // Mostrar mensaje pero no error, ya que es posible que la cuenta se cargue después
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta para ver los detalles completos'
    notificationType.value = 'warning'
    
    // Esperar un momento antes de desactivar el indicador de carga
    setTimeout(() => {
      loading.value = false
    }, 1500)
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
      notificationMessage.value = 'No se encontraron datos para este producto'
      notificationType.value = 'warning'
    }
  } catch (error) {
    console.error(`Error al obtener detalles del producto ${productId}:`, error)
    showNotification.value = true
    notificationMessage.value = error instanceof Error ? `Error: ${error.message}` : 'Error al obtener detalles del producto'
    notificationType.value = 'error'
  } finally {
    // Asegurar que el indicador de carga se oculte después de un tiempo mínimo
    // para evitar parpadeos en la interfaz
    setTimeout(() => {
      loading.value = false
    }, 500)
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

// Función para obtener el nombre de la cuenta
const getAccountName = (accountId: number | undefined) => {
  if (!accountId) return 'Desconocida'
  
  // Buscar en las cuentas disponibles
  const accounts = accountStore.accounts
  const account = accounts.find((acc) => acc.ID === accountId)
  
  if (account) {
    return account.Nickname || account.Email || `Cuenta #${accountId}`
  }
  
  return `Cuenta #${accountId}`
}

// Función para formatear el valor de salud como porcentaje
const formatHealthPercentage = (health: number | undefined) => {
  if (health === undefined || health === null) return 'N/A'
  
  // Convertir el valor decimal a porcentaje (0-100%)
  const percentage = Math.round(health * 100)
  return `${percentage}%`
}

// Función para determinar el color según el valor de salud
const getHealthColor = (health: number | undefined) => {
  if (health === undefined || health === null) return 'grey'
  
  // Determinar el color según el rango de salud
  if (health >= 0.8) return 'success'
  if (health >= 0.5) return 'warning'
  return 'error'
}

// Función para formatear la fecha
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (error) {
    console.error('Error al formatear la fecha:', error)
    return dateString
  }
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
.product-details-table {
  border-collapse: collapse;
}

.product-details-table tr td {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.product-details-table tr:last-child td {
  border-bottom: none;
}

.product-details-table tr:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.description-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.description-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.copy-btn {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: 500;
  min-width: 90px;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>

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
