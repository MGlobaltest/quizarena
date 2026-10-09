import React, { useState, useEffect } from 'react'
import { X, Check, User, Users, Coins, Sparkles, Tag, Shield, Zap } from 'lucide-react'
import DiceBearAvatar from './DiceBearAvatar'
import { DEFAULT_DEPARTMENTS, getDepartmentInfo } from '../constants/departments'
import { sounds } from '../utils/soundEffects'

export default function EditPlayerModal({ isOpen, onClose, player, onSave }) {
  const [nickname, setNickname] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [customDept, setCustomDept] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [chips, setChips] = useState(0)

  useEffect(() => {
    if (player) {
      setNickname(player.nickname || '')
      setChips(player.score !== undefined ? player.score : 0)
      const currentDept = player.department || ''
      const isPreset = DEFAULT_DEPARTMENTS.some(d => d.name === currentDept || d.shortName === currentDept)
      if (isPreset) {
        setSelectedDept(currentDept)
        setIsCustom(false)
        setCustomDept('')
      } else if (currentDept) {
        setIsCustom(true)
        setCustomDept(currentDept)
        setSelectedDept('')
      } else {
        setSelectedDept('')
        setIsCustom(false)
        setCustomDept('')
      }
    }
  }, [player, isOpen])

  if (!isOpen || !player) return null

  const handleSelectPreset = (dept) => {
    sounds.playTick()
    setIsCustom(false)
    if (selectedDept === dept.name) {
      setSelectedDept('')
    } else {
      setSelectedDept(dept.name)
    }
  }

  const handleToggleCustom = () => {
    sounds.playTick()
    setIsCustom(true)
    setSelectedDept('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanNick = nickname.trim() || player.nickname
    const finalDept = isCustom ? customDept.trim() : selectedDept
    const deptInfo = getDepartmentInfo(finalDept)

    sounds.playWin()
    onSave(player.id, {
      nickname: cleanNick,
      department: finalDept,
      teamColor: deptInfo ? deptInfo.color : '',
      score: Number(chips) || 100
    })
    onClose()
  }

  const currentDeptInfo = getDepartmentInfo(isCustom ? customDept : selectedDept)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">จัดการผู้เล่น & สังกัดแผนก</h3>
              <p className="text-xs text-slate-400">เปลี่ยนชื่อเล่นหรือจัดทีมให้ผู้เข้าร่วม</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Avatar Preview & Chips */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="relative">
              <DiceBearAvatar seed={nickname || player.nickname} url={player.avatar_url} size="lg" />
              {currentDeptInfo && (
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${currentDeptInfo.dotClass}`} />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">ID: {player.id?.slice(0, 10)}...</div>
              <div className="text-base font-black text-white mt-0.5 truncate">{nickname || player.nickname}</div>
              {currentDeptInfo ? (
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentDeptInfo.badgeClass}`}>
                  {currentDeptInfo.name}
                </span>
              ) : (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/60">
                  ยังไม่ได้ระบุทีม/แผนก
                </span>
              )}
            </div>
          </div>

          {/* 1. Edit Nickname */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>ชื่อผู้เล่น (Nickname)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ระบุชื่อผู้เล่น เช่น สมชาย (Sales)"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-white text-sm font-semibold focus:outline-none transition"
              required
            />
          </div>

          {/* 2. Select Department / Team */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>จัดกลุ่มทีม / แผนก (Department)</span>
              </label>
              {(selectedDept || customDept) && (
                <button
                  type="button"
                  onClick={() => { setSelectedDept(''); setCustomDept(''); setIsCustom(false) }}
                  className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  ล้างสังกัดทีม
                </button>
              )}
            </div>

            {/* Preset Departments Grid */}
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_DEPARTMENTS.map((dept) => {
                const isSelected = !isCustom && selectedDept === dept.name
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => handleSelectPreset(dept)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? `${dept.badgeClass} ring-2 ${dept.ringClass}`
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full ${dept.dotClass}`} />
                      <span className="truncate">{dept.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Custom Team Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleToggleCustom}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                  isCustom
                    ? 'bg-purple-950/40 border-purple-500 text-purple-300 ring-2 ring-purple-500/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>กำหนดชื่อทีมเอง (Custom Team Name)</span>
              </button>

              {isCustom && (
                <div className="mt-2 pl-2">
                  <input
                    type="text"
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    placeholder="พิมพ์ชื่อทีม เช่น ทีม Alpha, โต๊ะ 3, กลุ่มสิงโต..."
                    className="w-full px-3 py-2 bg-slate-950 border border-purple-600 rounded-xl text-white text-xs font-semibold focus:outline-none"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Adjust Score */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>คะแนนสะสมของผู้เล่น (แต้ม)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="50"
                value={chips}
                onChange={(e) => setChips(e.target.value)}
                className="w-32 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-amber-300 font-mono text-sm font-bold focus:outline-none"
              />
              <div className="flex gap-1.5">
                {[0, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setChips(amt)}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
