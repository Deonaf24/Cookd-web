import { supabase } from './supabase'

export const getPublicUrl = (bucket: string, path: string | null) => {
  if (!path) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const BUCKETS = {
  PROFILES: 'profile-images',
  MEALS: 'meal-images'
}
