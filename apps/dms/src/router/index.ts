import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    layout?: 'marketing' | 'app' | 'none'
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Öffentliche Marketing-Seiten
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { public: true, layout: 'marketing' },
    },
    {
      path: '/features',
      name: 'features',
      component: () => import('@/views/FeaturesView.vue'),
      meta: { public: true, layout: 'marketing' },
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: () => import('@/views/PricingView.vue'),
      meta: { public: true, layout: 'marketing' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { public: true, layout: 'marketing' },
    },
    {
      path: '/faq',
      name: 'faq',
      component: () => import('@/views/FaqView.vue'),
      meta: { public: true, layout: 'marketing' },
    },
    {
      path: '/impressum',
      name: 'impressum',
      component: () => import('@/views/ImpressumView.vue'),
      meta: { public: true, layout: 'marketing' },
    },
    {
      path: '/datenschutz',
      name: 'datenschutz',
      component: () => import('@/views/DatenschutzView.vue'),
      meta: { public: true, layout: 'marketing' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, layout: 'none' },
    },
    // Geschützte App-Seiten
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('@/views/DocumentsView.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/documents/:id',
      name: 'document-detail',
      component: () => import('@/views/DocumentDetailView.vue'),
      props: true,
      meta: { layout: 'app' },
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('@/views/UploadView.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/ChatView.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { layout: 'app' },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true

  const { authReady, user } = useAuth()
  await authReady

  if (!user.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
