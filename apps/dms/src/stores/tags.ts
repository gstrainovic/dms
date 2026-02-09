import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Tag } from '@/lib/database.types'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([])
  const loading = ref(false)

  async function fetchTags() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      tags.value = data ?? []
    } finally {
      loading.value = false
    }
  }

  async function createTag(name: string, color?: string): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert({ name, color })
      .select()
      .single()

    if (error) throw error
    tags.value.push(data)
    return data
  }

  async function updateTag(id: string, updates: { name?: string; color?: string }) {
    const { error } = await supabase.from('tags').update(updates).eq('id', id)
    if (error) throw error
    const idx = tags.value.findIndex((t) => t.id === id)
    if (idx !== -1) Object.assign(tags.value[idx], updates)
  }

  async function deleteTag(id: string) {
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) throw error
    tags.value = tags.value.filter((t) => t.id !== id)
  }

  async function findOrCreateTag(name: string, color?: string): Promise<Tag> {
    const existing = tags.value.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing
    return await createTag(name, color)
  }

  return { tags, loading, fetchTags, createTag, updateTag, deleteTag, findOrCreateTag }
})
