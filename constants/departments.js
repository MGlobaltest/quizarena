export const DEFAULT_DEPARTMENTS = [
  {
    id: 'sales',
    name: 'ฝ่ายขาย (Sales)',
    shortName: 'Sales',
    color: '#f43f5e',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    ringClass: 'ring-rose-500/80',
    dotClass: 'bg-rose-500'
  },
  {
    id: 'marketing',
    name: 'การตลาด (Marketing)',
    shortName: 'Marketing',
    color: '#a855f7',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    ringClass: 'ring-purple-500/80',
    dotClass: 'bg-purple-500'
  },
  {
    id: 'it',
    name: 'ไอที & เทค (IT & Tech)',
    shortName: 'IT & Tech',
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    ringClass: 'ring-blue-500/80',
    dotClass: 'bg-blue-500'
  },
  {
    id: 'hr',
    name: 'ฝ่ายบุคคล (HR)',
    shortName: 'HR',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    ringClass: 'ring-emerald-500/80',
    dotClass: 'bg-emerald-500'
  },
  {
    id: 'finance',
    name: 'บัญชี & การเงิน (Finance)',
    shortName: 'Finance',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    ringClass: 'ring-amber-500/80',
    dotClass: 'bg-amber-500'
  },
  {
    id: 'ops',
    name: 'ปฏิบัติการ (Operations)',
    shortName: 'Operations',
    color: '#f97316',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    ringClass: 'ring-orange-500/80',
    dotClass: 'bg-orange-500'
  },
  {
    id: 'exec',
    name: 'ผู้บริหาร (Management)',
    shortName: 'Management',
    color: '#06b6d4',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    ringClass: 'ring-cyan-500/80',
    dotClass: 'bg-cyan-500'
  }
]

// Fallback palette for custom teams
const CUSTOM_PALETTES = [
  { badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40', ringClass: 'ring-pink-500/80', dotClass: 'bg-pink-500' },
  { badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40', ringClass: 'ring-teal-500/80', dotClass: 'bg-teal-500' },
  { badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40', ringClass: 'ring-violet-500/80', dotClass: 'bg-violet-500' },
  { badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40', ringClass: 'ring-lime-500/80', dotClass: 'bg-lime-500' },
  { badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', ringClass: 'ring-indigo-500/80', dotClass: 'bg-indigo-500' },
]

export function getDepartmentInfo(nameOrId) {
  if (!nameOrId) return null
  const clean = String(nameOrId).trim().toLowerCase()
  
  const found = DEFAULT_DEPARTMENTS.find(d => 
    d.id.toLowerCase() === clean || 
    d.name.toLowerCase() === clean || 
    d.shortName.toLowerCase() === clean ||
    clean.includes(d.id.toLowerCase())
  )
  if (found) return found

  // Hash custom name to assign stable color
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i)
    hash |= 0
  }
  const palette = CUSTOM_PALETTES[Math.abs(hash) % CUSTOM_PALETTES.length]

  return {
    id: clean,
    name: nameOrId,
    shortName: nameOrId,
    color: '#a855f7',
    ...palette
  }
}
