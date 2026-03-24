import { supabase } from './supabase'

export const getPublicUrl = (bucket: string, path: string | null | undefined): string | undefined => {
  if (!path) return undefined
  if (path.toLowerCase().startsWith('http')) return path
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const BUCKETS = {
  PROFILES: 'profile-images',
  MEALS: 'meal-images'
}
