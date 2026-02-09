export interface SearchResult {
  id: string
  title: string
  excerpt: string
  score: number
  matchType: 'fulltext' | 'vector' | 'hybrid'
  documentType?: string
  tags?: string[]
}

export interface SearchOptions {
  query: string
  limit?: number
  offset?: number
  documentType?: string
  tags?: string[]
  fulltextWeight?: number
  vectorWeight?: number
}

const DEFAULT_SEARCH_OPTIONS = {
  limit: 20,
  offset: 0,
  fulltextWeight: 0.4,
  vectorWeight: 0.6,
}

export async function hybridSearch(
  supabase: any,
  queryEmbedding: number[],
  options: SearchOptions,
): Promise<SearchResult[]> {
  const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options }

  const { data, error } = await supabase.rpc('hybrid_search', {
    query_text: opts.query,
    query_embedding: queryEmbedding,
    match_count: opts.limit,
    fulltext_weight: opts.fulltextWeight,
    vector_weight: opts.vectorWeight,
    filter_document_type: opts.documentType ?? null,
    filter_tags: opts.tags ?? null,
  })

  if (error) throw new Error(`Hybrid search failed: ${error.message}`)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    score: row.score,
    matchType: row.match_type,
    documentType: row.document_type,
    tags: row.tags,
  }))
}
