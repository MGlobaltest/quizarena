/**
 * Utility functions for Thai Time (Asia/Bangkok, UTC+7)
 */

/**
 * Returns a timestamp string formatted as "YYYY-MM-DD HH:mm:ss" in Asia/Bangkok time.
 * Used for storing into Supabase created_at / updated_at so that Table Editor displays Thai time directly.
 */
export const getThaiDbTimestamp = (date = new Date()) => {
  const d = new Date(date)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  return formatter.format(d).replace(', ', ' ')
}

/**
 * Returns formatted Thai date and time string e.g. "29/10/2569 04:22:15"
 */
export const formatThaiDisplayDateTime = (date = new Date()) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
}

/**
 * Returns formatted Thai time only e.g. "04:22:15"
 */
export const formatThaiDisplayTime = (date = new Date()) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })
}

/**
 * Returns Thai date string for file downloads e.g. "2026-10-29"
 */
export const getThaiDateString = (date = new Date()) => {
  const d = new Date(date)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(d)
}
