<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'

const visible = ref(false)

onMounted(() => {
  if (!localStorage.getItem('cookie-consent')) {
    visible.value = true
  }
})

function accept() {
  localStorage.setItem('cookie-consent', 'accepted')
  visible.value = false
}
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="fixed bottom-0 left-0 right-0 bg-surface-900 dark:bg-surface-800 text-surface-100 p-4 z-50 shadow-lg"
    >
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm">
          Diese Website verwendet ausschliesslich technisch notwendige Cookies und localStorage für die Sitzungsverwaltung.
          <router-link to="/datenschutz" class="text-primary-400 hover:underline">Mehr erfahren</router-link>
        </p>
        <Button label="Verstanden" size="small" @click="accept" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}
</style>
