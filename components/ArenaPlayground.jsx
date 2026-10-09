import React, { useState, useEffect, useRef } from 'react'
import { 
  Users, Edit3, Coins, Shield, Sparkles, Plus, 
  Trash2, Eye, LayoutGrid, Gamepad2, Shuffle, Zap 
} from 'lucide-react'
import DiceBearAvatar from './DiceBearAvatar'
import { getDepartmentInfo, DEFAULT_DEPARTMENTS } from '../constants/departments'
import { sounds } from '../utils/soundEffects'

const FUN_SPEECHES = [
  'พร้อมลุย! 🚀',
  'ทีมเราต้องชนะ! 🔥',
  'ตอบไวชิงโบนัส! ⚡',
  'มั่นใจสุดๆ 😎',
  'ขอเป็น Speaker! 🎤',
  'ลุ้นข้อแรกอยู่นะ 🎲',
  'สู้ๆ ทุกคน ✌️',
  'ทีมเวิร์กพลังใจ 💖',
  'งานนี้คะแนนเต็มแน่! ⭐'
]

export default function ArenaPlayground({ 
  players = [], 
  onEditPlayer, 
  onAddSimulatedBot, 
  onClearSimulatedBots,
  simulatedBotCount = 0 
}) {
  const [viewMode, setViewMode] = useState('arena') // 'arena' | 'grid'
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL')
  const [activeHighlightId, setActiveHighlightId] = useState(null)
  
  // Positional state for walking characters: { [id]: { x, y, targetX, targetY, direction, isWalking, speech } }
  const [charPositions, setCharPositions] = useState({})
  const timerRef = useRef(null)

  // Initialize or update character positions when players list changes
  useEffect(() => {
    setCharPositions((prev) => {
      const next = { ...prev }
      players.forEach((player, idx) => {
        if (!next[player.id]) {
          // Calculate initial distributed position
          const cols = Math.ceil(Math.sqrt(Math.max(4, players.length)))
          const row = Math.floor(idx / cols)
          const col = idx % cols
          const baseX = 12 + (col * (76 / Math.max(1, cols))) + (Math.random() * 8 - 4)
          const baseY = 20 + (row * (60 / Math.max(1, cols))) + (Math.random() * 8 - 4)
          next[player.id] = {
            x: Math.max(8, Math.min(84, baseX)),
            y: Math.max(15, Math.min(78, baseY)),
            direction: Math.random() > 0.5 ? 'right' : 'left',
            isWalking: false,
            speech: null
          }
        }
      })
      // Clean up players who disconnected
      const playerIds = new Set(players.map(p => p.id))
      Object.keys(next).forEach(id => {
        if (!playerIds.has(id)) {
          delete next[id]
        }
      })
      return next
    })
  }, [players])

  // Periodic random wandering loop
  useEffect(() => {
    if (viewMode !== 'arena' || players.length === 0) return

    timerRef.current = setInterval(() => {
      setCharPositions((prev) => {
        const next = { ...prev }
        const pList = Object.keys(next)
        if (pList.length === 0) return prev

        // Pick 1 to 3 random characters to wander
        const countToMove = Math.min(pList.length, Math.floor(Math.random() * 2) + 1)
        const shuffled = [...pList].sort(() => 0.5 - Math.random())

        for (let i = 0; i < countToMove; i++) {
          const id = shuffled[i]
          const current = next[id]
          if (!current) continue

          // Pick new coordinates within arena boundary (8% to 84% X, 16% to 76% Y)
          const targetX = Math.floor(8 + Math.random() * 76)
          const targetY = Math.floor(16 + Math.random() * 60)
          const direction = targetX > current.x ? 'right' : 'left'

          // 25% chance to show a cute speech bubble
          const showSpeech = Math.random() < 0.25
          const speech = showSpeech 
            ? FUN_SPEECHES[Math.floor(Math.random() * FUN_SPEECHES.length)] 
            : null

          next[id] = {
            ...current,
            x: targetX,
            y: targetY,
            direction,
            isWalking: true,
            speech
          }

          // Stop walking animation after movement completes
          setTimeout(() => {
            setCharPositions(p => {
              if (!p[id]) return p
              return {
                ...p,
                [id]: { ...p[id], isWalking: false, speech: null }
              }
            })
          }, 2800)
        }

        return next
      })
    }, 3200)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [viewMode, players])

  // Compute department counts for filter tabs
  const deptCounts = {}
  players.forEach(p => {
    const dept = p.department ? p.department.trim() : 'UNASSIGNED'
    deptCounts[dept] = (deptCounts[dept] || 0) + 1
  })

  // Filter players if filter is selected
  const filteredPlayers = players.filter(p => {
    if (selectedDeptFilter === 'ALL') return true
    if (selectedDeptFilter === 'UNASSIGNED') return !p.department
    return p.department === selectedDeptFilter
  })

  return (
    <div className="flex-1 flex flex-col h-full">
      
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
        
        {/* Department Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedDeptFilter === 'ALL'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            ทั้งหมด ({players.length})
          </button>

          {Object.keys(deptCounts).map(deptKey => {
            if (deptKey === 'UNASSIGNED') return null
            const info = getDepartmentInfo(deptKey)
            const isSelected = selectedDeptFilter === deptKey
            return (
              <button
                key={deptKey}
                onClick={() => setSelectedDeptFilter(deptKey)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? `${info ? info.badgeClass : 'bg-indigo-600 text-white'} ring-2 ring-purple-500/50`
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
              >
                {info && <span className={`w-2 h-2 rounded-full ${info.dotClass}`} />}
                <span>{info ? info.shortName : deptKey}</span>
                <span className="opacity-70 text-[10px]">({deptCounts[deptKey]})</span>
              </button>
            )
          })}

          {deptCounts['UNASSIGNED'] > 0 && (
            <button
              onClick={() => setSelectedDeptFilter('UNASSIGNED')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                selectedDeptFilter === 'UNASSIGNED'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
              }`}
            >
              ยังไม่จัดทีม ({deptCounts['UNASSIGNED']})
            </button>
          )}
        </div>

        {/* View Toggle & Bot Test Buttons */}
        <div className="flex items-center gap-2">
          {onAddSimulatedBot && (
            <button
              onClick={onAddSimulatedBot}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
              title="เพิ่มผู้เล่นบอทจำลองสำหรับทดสอบระบบ"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บอททดสอบ (+1)</span>
            </button>
          )}

          {simulatedBotCount > 0 && onClearSimulatedBots && (
            <button
              onClick={onClearSimulatedBots}
              className="px-2 py-1 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="ล้างบอทจำลองทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setViewMode('arena')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'arena'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="โหมดสนามเดินเล่น (Arena Playground)"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">สนามจำลอง</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="โหมดตารางรายชื่อ (Grid View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ตาราง</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Content Area: Arena Playground or Grid */}
      {viewMode === 'arena' ? (
        <div className="relative flex-1 w-full min-h-[460px] bg-slate-950/80 rounded-2xl border-2 border-purple-900/30 overflow-hidden arena-grid-floor shadow-inner select-none">
          
          {/* Arena Center Decal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-64 h-64 rounded-full border-4 border-dashed border-purple-500/40 flex items-center justify-center">
              <div className="w-44 h-44 rounded-full border-2 border-purple-400/30 flex items-center justify-center text-center">
                <span className="font-black text-xs tracking-widest text-purple-300 uppercase">SUPER BET<br />ARENA FLOOR</span>
              </div>
            </div>
          </div>

          {/* Arena Corner Decorative Marks */}
          <div className="absolute top-3 left-3 text-[10px] font-mono text-purple-500/40 pointer-events-none">ZONE: NORTH</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-emerald-500/40 pointer-events-none">ZONE: SOUTH</div>

          {/* Empty State */}
          {players.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 animate-pulse">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-white font-bold text-sm mb-1">ยังไม่มีตัวละครในสังเวียน</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                ผู้เล่นที่สแกน QR Code หรือเปิดหน้า <code className="text-emerald-400">/play</code> จะเดินเข้าสู่สนามนี้อัตโนมัติ
              </p>
            </div>
          )}

          {/* Wandering Characters Field */}
          {players.map((player) => {
            const pos = charPositions[player.id] || { x: 50, y: 50, direction: 'right', isWalking: false, speech: null }
            const deptInfo = getDepartmentInfo(player.department)
            const isDimmed = selectedDeptFilter !== 'ALL' && 
              (selectedDeptFilter === 'UNASSIGNED' ? Boolean(player.department) : player.department !== selectedDeptFilter)

            return (
              <div
                key={player.id}
                onClick={() => onEditPlayer(player)}
                onMouseEnter={() => setActiveHighlightId(player.id)}
                onMouseLeave={() => setActiveHighlightId(null)}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  transition: 'left 2.8s cubic-bezier(0.25, 1, 0.5, 1), top 2.8s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
                className={`absolute z-10 flex flex-col items-center cursor-pointer group transition-opacity duration-300 ${
                  isDimmed ? 'opacity-25 pointer-events-none' : 'opacity-100'
                }`}
              >
                {/* Speech Bubble (pops up above character) */}
                {pos.speech && (
                  <div className="absolute -top-11 z-30 px-2.5 py-1 rounded-xl bg-purple-600 text-white font-bold text-[11px] whitespace-nowrap shadow-xl border border-purple-400/50 animate-speech-pop pointer-events-none">
                    {pos.speech}
                    {/* Speech Pointer Tail */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-600 rotate-45 border-r border-b border-purple-400/50" />
                  </div>
                )}

                {/* Nickname & Department Badge (Above Character) */}
                <div className="flex flex-col items-center mb-1 transition-transform group-hover:scale-110">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-md backdrop-blur-sm">
                    <span className="font-extrabold text-[11px] text-white max-w-[85px] truncate">
                      {player.nickname}
                    </span>
                    <Edit3 className="w-2.5 h-2.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {deptInfo && (
                    <span className={`mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold border truncate max-w-[95px] ${deptInfo.badgeClass}`}>
                      {deptInfo.shortName}
                    </span>
                  )}
                </div>

                {/* Avatar with Walking Bob & Shadow */}
                <div className="relative flex flex-col items-center">
                  
                  {/* Avatar Icon Container with flip on left movement */}
                  <div className={`transition-transform duration-200 ${
                    pos.direction === 'left' ? 'scale-x-[-1]' : ''
                  } ${pos.isWalking ? 'animate-walk-bob' : ''}`}>
                    <div className={`p-1 rounded-2xl transition-all duration-200 group-hover:scale-110 ${
                      deptInfo ? `ring-2 ${deptInfo.ringClass}` : 'group-hover:ring-2 group-hover:ring-purple-400'
                    }`}>
                      <DiceBearAvatar seed={player.nickname} url={player.avatar_url} size="md" />
                    </div>
                  </div>

                  {/* Character Ground Shadow */}
                  <div className="w-8 h-2.5 bg-black/70 rounded-full blur-[2px] mt-1 group-hover:w-10 transition-all" />

                  {/* Chips Tag */}
                  <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-bold text-amber-400 mt-0.5 shadow">
                    <Coins className="w-2.5 h-2.5" />
                    <span>{player.score || 100}</span>
                  </div>
                </div>

                {/* Quick Hover Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -bottom-7 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded bg-slate-900/95 text-[10px] text-purple-300 border border-purple-500/40 shadow-lg">
                  คลิกเพื่อเปลี่ยนชื่อ / จัดแผนก
                </div>

              </div>
            )
          })}

        </div>
      ) : (
        /* Classic Grid View */
        <div className="flex-1 overflow-y-auto max-h-[460px] pr-2">
          {filteredPlayers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-2xl">
              <Users className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-slate-400 font-semibold text-xs">ไม่พบผู้เล่นในหมวดนี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredPlayers.map((player) => {
                const deptInfo = getDepartmentInfo(player.department)
                return (
                  <div
                    key={player.id}
                    onClick={() => onEditPlayer(player)}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-purple-500 hover:bg-slate-800 flex flex-col items-center text-center transition-all duration-200 hover:scale-105 cursor-pointer relative group"
                  >
                    <div className="absolute top-2 right-2 p-1 rounded-lg bg-slate-900/60 text-slate-400 group-hover:text-purple-300 transition">
                      <Edit3 className="w-3 h-3" />
                    </div>

                    <div className="relative mb-2">
                      <DiceBearAvatar seed={player.nickname} url={player.avatar_url} size="md" />
                      {deptInfo && (
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${deptInfo.dotClass}`} />
                      )}
                    </div>

                    <span className="font-extrabold text-white text-xs truncate w-full">{player.nickname}</span>
                    
                    {deptInfo ? (
                      <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border truncate max-w-full ${deptInfo.badgeClass}`}>
                        {deptInfo.shortName}
                      </span>
                    ) : (
                      <span className="mt-1 text-[10px] text-slate-500 font-medium">ยังไม่ระบุทีม</span>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold mt-1.5">
                      <Zap className="w-3 h-3 fill-amber-400" />
                      <span>{player.score !== undefined ? player.score : 0} แต้ม</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Hint */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span className="flex items-center gap-1.5">
          <span>💡 คลิกที่ตัวละครเพื่อ</span>
          <span className="text-purple-300 font-semibold underline">เปลี่ยนชื่อเล่น</span>
          <span>หรือ</span>
          <span className="text-emerald-300 font-semibold underline">จัดทีมตามแผนก</span>
        </span>
        <span className="text-emerald-400 font-medium">Realtime Sync Active</span>
      </div>

    </div>
  )
}
