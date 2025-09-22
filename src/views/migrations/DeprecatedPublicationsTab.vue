<template>
  <div>
    <DeprecatedPublicationsTable :loading="loading" @update:loading="loading = $event" @error="error = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DeprecatedPublicationsTable from '@/components/migration/DeprecatedPublicationsTable.vue'

// Estado
const loading = ref(false)
const error = ref<string | null>(null)
</script>
