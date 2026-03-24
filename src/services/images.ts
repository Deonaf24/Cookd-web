import { supabase } from './supabase'

export const getPublicUrl = (bucket: string, path: string | null) => {
  if (!path) return null
  if (path.toLowerCase().startsWith('http')) return path
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const BUCKETS = {
  PROFILES: 'profile-images',
  MEALS: 'meal-images'
}
