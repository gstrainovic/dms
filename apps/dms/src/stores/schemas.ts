import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

// Simplified type to avoid TS2589 with recursive Json in vue ref
export interface Schema {
  id: string
  name: string
  document_type: string
  description: string | null
  schema: Record<string, any>
  created_at: string
  updated_at: string
}

export const useSchemasStore = defineStore('schemas', () => {
  const schemas = ref<Schema[]>([])
  const loading = ref(false)

  async function fetchSchemas() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('document_schemas')
        .select('*')
        .order('name')

      if (error) throw error
      schemas.value = (data ?? []) as Schema[]
    } finally {
      loading.value = false
    }
  }

  async function createSchema(input: {
    name: string
    document_type: string
    description?: string
    schema: Record<string, any>
  }): Promise<Schema> {
    const { data, error } = await (supabase
      .from('document_schemas')
      .insert({
        name: input.name,
        document_type: input.document_type,
        description: input.description ?? null,
        schema: input.schema as any,
      })
      .select()
      .single() as any)

    if (error) throw error
    const created = data as Schema
    schemas.value.push(created)
    return created
  }

  async function updateSchema(
    id: string,
    updates: { name?: string; description?: string | null; schema?: Record<string, any> },
  ) {
    const { error } = await (supabase
      .from('document_schemas')
      .update(updates as any)
      .eq('id', id) as any)
    if (error) throw error
    const idx = schemas.value.findIndex((s) => s.id === id)
    if (idx !== -1) Object.assign(schemas.value[idx], updates)
  }

  async function deleteSchema(id: string) {
    const { error } = await supabase.from('document_schemas').delete().eq('id', id)
    if (error) throw error
    schemas.value = schemas.value.filter((s) => s.id !== id)
  }

  return { schemas, loading, fetchSchemas, createSchema, updateSchema, deleteSchema }
})
