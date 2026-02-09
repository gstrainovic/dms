import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface SearchResult {
  id: string
  title: string
  excerpt: string
  score: number
  match_type: 'fulltext' | 'vector' | 'hybrid'
  document_type: string | null
  tags: string[]
}

export function useSearch() {
  const results = ref<SearchResult[]>([])
  const query = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchMode = ref<'hybrid' | 'fulltext'>('fulltext')
  const filterType = ref<string | null>(null)

  const hasResults = computed(() => results.value.length > 0)

  async function searchFulltext(q: string) {
    loading.value = true
    error.value = null
    results.value = []

    try {
      let builder = supabase
        .from('documents')
        .select('id, title, ocr_text, document_type, status')
        .textSearch('fts', q, { type: 'websearch', config: 'german' })
        .eq('status', 'ready')
        .limit(20)

      if (filterType.value) {
        builder = builder.eq('document_type', filterType.value)
      }

      const { data, error: err } = await builder

      if (err) throw err

      results.value = (data ?? []).map((d) => ({
        id: d.id,
        title: d.title || 'Unbenannt',
        excerpt: d.ocr_text?.substring(0, 300) || '',
        score: 1,
        match_type: 'fulltext' as const,
        document_type: d.document_type,
        tags: [],
      }))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Suche fehlgeschlagen'
    } finally {
      loading.value = false
    }
  }

  async function searchHybrid(q: string) {
    loading.value = true
    error.value = null
    results.value = []

    try {
      // Via Edge Function (generiert Embedding + RPC)
      const { data, error: fnError } = await supabase.functions.invoke('search', {
        body: {
          query: q,
          matchCount: 20,
          filterDocumentType: filterType.value,
        },
      })

      if (fnError) throw new Error(fnError.message)

      results.value = data.results.map((r: any) => ({
        id: r.id,
        title: r.title || 'Unbenannt',
        excerpt: r.excerpt || '',
        score: r.score,
        match_type: r.match_type,
        document_type: r.document_type,
        tags: r.tags || [],
      }))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Suche fehlgeschlagen'
    } finally {
      loading.value = false
    }
  }

  async function search(q?: string) {
    const searchQuery = q ?? query.value
    if (!searchQuery.trim()) {
      results.value = []
      return
    }

    query.value = searchQuery

    if (searchMode.value === 'hybrid') {
      await searchHybrid(searchQuery)
    } else {
      await searchFulltext(searchQuery)
    }
  }

  return {
    results,
    query,
    loading,
    error,
    searchMode,
    filterType,
    hasResults,
    search,
  }
}
