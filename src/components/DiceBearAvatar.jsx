import React, { useState } from 'react'

export default function DiceBearAvatar({ seed, url, size = 'md', className = '' }) {
  const [error, setError] = useState(false)

  const sizeClasses = {
    xs: 'w-7 h-7 min-w-[28px]',
    sm: 'w-9 h-9 min-w-[36px]',
    md: 'w-12 h-12 min-w-[48px]',
    lg: 'w-16 h-16 min-w-[64px]',
    xl: 'w-24 h-24 min-w-[96px]',
  }

  const avatarUrl = url || (seed 
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
    : 'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer')

  if (error) {
    return (
      <div className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md ${className}`}>
        {(seed || '?').slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={avatarUrl}
      alt={seed || 'avatar'}
      onError={() => setError(true)}
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-slate-800/80 border border-slate-700/80 object-cover shadow-sm transition-transform duration-200 ${className}`}
      loading="lazy"
    />
  )
}
