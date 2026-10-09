import React, { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { sounds } from '../utils/soundEffects'

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(sounds.enabled)

  const toggle = () => {
    sounds.enabled = !sounds.enabled
    setEnabled(sounds.enabled)
    if (sounds.enabled) {
      sounds.playPop()
    }
  }

  return (
    <button
      onClick={toggle}
      title={enabled ? 'ปิดเสียง' : 'เปิดเสียง'}
      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition flex items-center justify-center cursor-pointer shadow-sm"
    >
      {enabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
    </button>
  )
}
