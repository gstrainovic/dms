<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import MarketingLayout from '@/components/MarketingLayout.vue'
import CookieBanner from '@/components/CookieBanner.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const route = useRoute()
const layout = computed(() => route.meta.layout ?? 'app')
</script>

<template>
  <Toast />
  <ConfirmDialog />
  <MarketingLayout v-if="layout === 'marketing'">
    <RouterView />
  </MarketingLayout>
  <AppLayout v-else-if="layout === 'app'">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
  <CookieBanner />
</template>
