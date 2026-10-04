import { createClient } from '@supabase/supabase-js'

// 1. Read environment variables or localStorage overrides
const envUrl = import.meta.env.VITE_SUPABASE_URL || ''
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('sba_supabase_url') : ''
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('sba_supabase_key') : ''

export const DEFAULT_SUPABASE_URL = 'https://qoppfvjrirzvtzlttilw.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcHBmdmpyaXJ6dnR6bHR0aWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNDQ2MjgsImV4cCI6MjEwNjYyMDYyOH0.wuadXKCDQQ_82tLISDT8T7VFYCp-yfUc4UhdpCUgGUQ'

export const SUPABASE_URL = storedUrl || envUrl || DEFAULT_SUPABASE_URL
export const SUPABASE_ANON_KEY = storedKey || envKey || DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = () => {
  const url = storedUrl || envUrl || DEFAULT_SUPABASE_URL
  const key = storedKey || envKey || DEFAULT_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes('placeholder-project') && key.length > 20)
}

export const saveSupabaseCredentials = (url, key) => {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('sba_supabase_url', url.trim())
    if (key) localStorage.setItem('sba_supabase_key', key.trim())
    window.location.reload()
  }
}

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sba_supabase_url')
    localStorage.removeItem('sba_supabase_key')
    window.location.reload()
  }
}

// 2. Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 25,
    },
  },
})

// 3. DiceBear Avatar Generator helper (Free tier, bottts or personas)
export const getAvatarUrl = (seed, style = 'bottts') => {
  const safeSeed = encodeURIComponent(seed || 'Gamer-' + Math.floor(Math.random() * 1000))
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${safeSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}
