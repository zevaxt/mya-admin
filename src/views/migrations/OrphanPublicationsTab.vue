<template>
  <div>
    <OrphanPublicationsTable :loading="loading" @update:loading="loading = $event" @error="error = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OrphanPublicationsTable from '@/components/migration/OrphanPublicationsTable.vue'

// Estado
const loading = ref(false)
const error = ref<string | null>(null)
</script>
