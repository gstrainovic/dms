<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <Toast />
  <ConfirmDialog />
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>
