<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import { fetchUsage, startCheckout, openPortal, LIMIT_LABELS, type UsageInfo, type LimitKind } from '@/lib/ai-proxy'

const usage = ref<UsageInfo | null>(null)
const error = ref('')
const busy = ref<string | null>(null)

const limitKinds = Object.keys(LIMIT_LABELS) as LimitKind[]
const currentPlan = computed(() => usage.value?.plans[usage.value.plan] ?? null)
const upgradePlans = computed(() => {
  if (!usage.value || !currentPlan.value) return []
  return Object.values(usage.value.plans).filter((p) => p.priceChfPerMonth > currentPlan.value!.priceChfPerMonth)
})
const isPaid = computed(() => (currentPlan.value?.priceChfPerMonth ?? 0) > 0)

const numberFormat = new Intl.NumberFormat('de-CH')
function formatNumber(n: number): string {
  return numberFormat.format(n)
}

function percent(kind: LimitKind): number {
  if (!usage.value) return 0
  const limit = usage.value.limits[kind]
  return limit > 0 ? Math.min(100, Math.round((usage.value.usage[kind] / limit) * 100)) : 0
}

function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m - 1, 1).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
}

async function load() {
  try {
    usage.value = await fetchUsage()
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Nutzung konnte nicht geladen werden'
  }
}

async function upgrade(planId: string) {
  busy.value = planId
  try {
    window.location.href = await startCheckout(planId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Checkout nicht möglich'
    busy.value = null
  }
}

async function manage() {
  busy.value = 'portal'
  try {
    window.location.href = await openPortal()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Kundenportal nicht verfügbar'
    busy.value = null
  }
}

onMounted(load)
</script>

<template>
  <Card data-testid="billing-card">
    <template #title>Abo &amp; Nutzung</template>
    <template #content>
      <Message v-if="error" severity="warn" :closable="false" class="mb-3">{{ error }}</Message>

      <template v-if="usage && currentPlan">
        <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <span class="text-sm text-surface-500">Aktueller Plan</span>
            <div class="text-xl font-semibold" data-testid="current-plan">
              {{ currentPlan.name }}
              <span class="text-base font-normal text-surface-500">
                {{ currentPlan.priceChfPerMonth === 0 ? 'kostenlos' : `CHF ${currentPlan.priceChfPerMonth}/Mt.` }}
              </span>
            </div>
          </div>
          <span class="text-sm text-surface-500">Zähler für {{ monthLabel(usage.month) }}</span>
        </div>

        <div class="flex flex-col gap-4">
          <div v-for="kind in limitKinds" :key="kind">
            <div class="flex justify-between text-sm mb-1">
              <span>{{ LIMIT_LABELS[kind] }}</span>
              <span :data-testid="`usage-${kind}`">
                {{ formatNumber(usage.usage[kind]) }} von {{ formatNumber(usage.limits[kind]) }}
              </span>
            </div>
            <ProgressBar :value="percent(kind)" :show-value="false" style="height: 0.5rem" />
          </div>
        </div>

        <p class="text-sm text-surface-500 mt-4">
          Seiten zählen nur, wenn ein Scan oder Foto per Texterkennung gelesen wird. Digitale PDFs sind gratis.
          Auswertung, Suche und Fragen an Ihre Dokumente verbrauchen Tokens.
        </p>

        <div v-if="upgradePlans.length || isPaid" class="flex flex-wrap gap-2 mt-4">
          <Button
            v-for="plan in upgradePlans"
            :key="plan.id"
            :label="`${plan.name} wählen · CHF ${plan.priceChfPerMonth}/Mt.`"
            icon="pi pi-arrow-up"
            :loading="busy === plan.id"
            @click="upgrade(plan.id)"
          />
          <Button
            v-if="isPaid"
            label="Abo verwalten"
            icon="pi pi-credit-card"
            severity="secondary"
            outlined
            :loading="busy === 'portal'"
            @click="manage"
          />
        </div>
      </template>
      <ProgressBar v-else-if="!error" mode="indeterminate" style="height: 0.5rem" />
    </template>
  </Card>
</template>
