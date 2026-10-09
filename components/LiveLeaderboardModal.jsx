import React, { useState } from 'react'
import { 
  Trophy, Medal, Crown, X, Users, ArrowUp, ArrowDown, 
  Coins, Sparkles, CheckCircle, Clock, Shield, Search, Zap 
} from 'lucide-react'
import DiceBearAvatar from './DiceBearAvatar'
import { getDepartmentInfo, DEFAULT_DEPARTMENTS } from '../constants/departments'
import { sounds } from '../utils/soundEffects'

export default function LiveLeaderboardModal({
  isOpen,
  onClose,
  players = [],
  submissions = {},
  currentQIndex = 0,
  totalQuestions = 5,
  onEditPlayer = null,
  isHost = true
}) {
  const [sortBy, setSortBy] = useState('points') // 'points' | 'correct'
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  // Sort players by chips or by correct count
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'correct') {
      const diff = (Number(b.correctCount) || 0) - (Number(a.correctCount) || 0)
      if (diff !== 0) return diff
      return (Number(b.score) || 0) - (Number(a.score) || 0)
    }
    const diff = (Number(b.score) || 0) - (Number(a.score) || 0)
    if (diff !== 0) return diff
    return (Number(b.correctCount) || 0) - (Number(a.correctCount) || 0)
  })

  // Filter by department & search query
  const filteredPlayers = sortedPlayers.filter(p => {
    const matchesDept = selectedDept === 'ALL' 
      ? true 
      : selectedDept === 'UNASSIGNED' 
        ? !p.department 
        : p.department === selectedDept
    
    const matchesSearch = !searchQuery.trim() || 
      p.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesDept && matchesSearch
  })

  // Top 3 Podium
  const top1 = sortedPlayers[0] || null
  const top2 = sortedPlayers[1] || null
  const top3 = sortedPlayers[2] || null

  // Department counts
  const deptCounts = {}
  players.forEach(p => {
    const dept = p.department ? p.department.trim() : 'UNASSIGNED'
    deptCounts[dept] = (deptCounts[dept] || 0) + 1
  })

  const submittedCount = Object.keys(submissions).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-lg tracking-tight">กระดานคะแนนสด (Live Leaderboard)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                  เรียลไทม์
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ข้อที่ {currentQIndex + 1} / {totalQuestions} • {sortBy === 'correct' ? 'จัดอันดับตามข้อที่ตอบถูกต้อง' : 'จัดอันดับคะแนนสูงสุด (แต้ม+ความเร็ว)'} ({players.length} คน)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Category Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { sounds.playPop(); setSortBy('points'); }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  sortBy === 'points'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>คะแนนสูงสุด (แต้ม+ความเร็ว)</span>
              </button>
              <button
                type="button"
                onClick={() => { sounds.playPop(); setSortBy('correct'); }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  sortBy === 'correct'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>ตอบถูกสูงสุด</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">ส่งคำตอบ:</span>
              <span className="font-black text-emerald-400 font-mono">{submittedCount}/{players.length}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Podium Highlights (Top 3) */}
        {sortedPlayers.length >= 3 && (
          <div className="px-6 pt-5 pb-3 bg-gradient-to-b from-slate-950/60 to-transparent border-b border-slate-800/60">
            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto items-end">
              
              {/* 2nd Place */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col items-center text-center shadow-lg transform translate-y-1">
                <div className="text-lg mb-1">🥈</div>
                <DiceBearAvatar seed={top2.nickname} url={top2.avatar_url} size="md" className="mb-1.5" />
                <span className="font-bold text-white text-xs truncate max-w-full">{top2.nickname}</span>
                {top2.department && (
                  <span className="text-[9px] text-slate-400 truncate max-w-full">{top2.department}</span>
                )}
                <div className={`mt-1 font-black text-sm font-mono ${sortBy === 'correct' ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {sortBy === 'correct' ? `${top2.correctCount || 0}/${totalQuestions} ข้อ` : `${top2.score !== undefined ? top2.score : 0} แต้ม`}
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  {sortBy === 'correct' ? `${top2.score !== undefined ? top2.score : 0} แต้ม` : 'อันดับ 2'}
                </span>
              </div>

              {/* 1st Place (Winner) */}
              <div className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center shadow-2xl relative -translate-y-1 ${
                sortBy === 'correct'
                  ? 'bg-gradient-to-b from-emerald-500/20 to-slate-900 border-emerald-400/80 neon-border-emerald'
                  : 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400/80 neon-border-amber'
              }`}>
                <Crown className={`w-5 h-5 absolute -top-3 animate-bounce ${
                  sortBy === 'correct' ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400 fill-amber-400'
                }`} />
                <div className="text-xl mb-1">🥇</div>
                <DiceBearAvatar seed={top1.nickname} url={top1.avatar_url} size="lg" className="mb-1.5" />
                <span className={`font-black text-sm truncate max-w-full ${sortBy === 'correct' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {top1.nickname}
                </span>
                {top1.department && (
                  <span className="text-[10px] text-slate-300 truncate max-w-full font-semibold">{top1.department}</span>
                )}
                <div className={`mt-1 font-black text-base font-mono ${sortBy === 'correct' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {sortBy === 'correct' ? `${top1.correctCount || 0}/${totalQuestions} ข้อ` : `${top1.score !== undefined ? top1.score : 0} แต้ม`}
                </div>
                <span className={`text-[10px] font-extrabold uppercase mt-0.5 ${sortBy === 'correct' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {sortBy === 'correct' ? `ผู้นำความรู้ (${top1.score !== undefined ? top1.score : 0} แต้ม)` : 'อันดับ 1 ผู้นำคะแนน'}
                </span>
              </div>

              {/* 3rd Place */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-800/40 flex flex-col items-center text-center shadow-lg transform translate-y-2">
                <div className="text-lg mb-1">🥉</div>
                <DiceBearAvatar seed={top3.nickname} url={top3.avatar_url} size="md" className="mb-1.5" />
                <span className="font-bold text-white text-xs truncate max-w-full">{top3.nickname}</span>
                {top3.department && (
                  <span className="text-[9px] text-slate-400 truncate max-w-full">{top3.department}</span>
                )}
                <div className={`mt-1 font-black text-sm font-mono ${sortBy === 'correct' ? 'text-emerald-400' : 'text-amber-600'}`}>
                  {sortBy === 'correct' ? `${top3.correctCount || 0}/${totalQuestions} ข้อ` : `${top3.score !== undefined ? top3.score : 0} แต้ม`}
                </div>
                <span className="text-[10px] text-amber-500 font-bold uppercase mt-0.5">
                  {sortBy === 'correct' ? `${top3.score !== undefined ? top3.score : 0} แต้ม` : 'อันดับ 3'}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          
          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            <button
              onClick={() => setSelectedDept('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedDept === 'ALL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด ({sortedPlayers.length})
            </button>

            {Object.keys(deptCounts).map(deptKey => {
              if (deptKey === 'UNASSIGNED') return null
              const info = getDepartmentInfo(deptKey)
              const isSelected = selectedDept === deptKey
              return (
                <button
                  key={deptKey}
                  onClick={() => setSelectedDept(deptKey)}
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
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้เล่น..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>

        </div>

        {/* Ranked Players List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              ไม่พบรายชื่อผู้เล่นตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredPlayers.map((player) => {
              // True rank in global sorted list
              const rankIndex = sortedPlayers.findIndex(p => p.id === player.id) + 1
              const deptInfo = getDepartmentInfo(player.department)
              const sub = submissions[player.id]
              const hasSub = Boolean(sub)

              // Rank Badge Styling
              let rankBadge = (
                <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center">
                  #{rankIndex}
                </span>
              )
              if (rankIndex === 1) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
                    1🥇
                  </span>
                )
              } else if (rankIndex === 2) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    2🥈
                  </span>
                )
              } else if (rankIndex === 3) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-md">
                    3🥉
                  </span>
                )
              }

              return (
                <div
                  key={player.id}
                  onClick={() => isHost && onEditPlayer && onEditPlayer(player)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    rankIndex === 1
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      : rankIndex <= 3
                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-purple-500/50'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  } ${isHost && onEditPlayer ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
                >
                  
                  {/* Left: Rank + Avatar + Name + Dept */}
                  <div className="flex items-center gap-3 min-w-0">
                    {rankBadge}
                    
                    <div className="relative shrink-0">
                      <DiceBearAvatar seed={player.nickname} url={player.avatar_url} size="sm" />
                      {deptInfo && (
                        <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${deptInfo.dotClass}`} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-extrabold text-white text-sm truncate">
                          {player.nickname}
                        </span>
                        {deptInfo && (
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border truncate shrink-0 ${deptInfo.badgeClass}`}>
                            {deptInfo.shortName}
                          </span>
                        )}
                      </div>

                      {/* Status indicator in current round */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        {hasSub ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3 h-3" />
                            <span>ส่งคำตอบแล้ว{isHost && sub.selectedOption ? ` (ช้อยส์ ${sub.selectedOption})` : ''}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>กำลังเลือกคำตอบ...</span>
                          </span>
                        )}
                        {player.lastRoundNet !== undefined && (
                          <span className={`font-mono font-bold ${
                            player.lastRoundNet > 0 
                              ? 'text-emerald-400' 
                              : player.lastRoundNet < 0 
                                ? 'text-rose-400' 
                                : 'text-slate-500'
                          }`}>
                            {player.lastRoundNet > 0 ? `+${player.lastRoundNet}` : player.lastRoundNet}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Points Score & Correct answers */}
                  <div className="text-right shrink-0">
                    {sortBy === 'correct' ? (
                      <>
                        <div className="flex items-center gap-1 justify-end">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-lg font-black font-mono text-emerald-300">
                            {player.correctCount || 0}/{totalQuestions}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-400/80 font-bold uppercase">
                          {player.score !== undefined ? player.score : 0} แต้ม
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 justify-end">
                          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-lg font-black font-mono text-amber-300">
                            {player.score !== undefined ? player.score : 0}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80 font-bold uppercase">
                          ตอบถูก {player.correctCount || 0}/{totalQuestions} ข้อ
                        </span>
                      </>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>💡 {isHost ? 'คลิกที่แถวผู้เล่นเพื่อแก้ไขชื่อหรือจัดทีมแผนก' : 'ตารางนี้อัปเดตคะแนนสดทุกครั้งที่ Host เฉลยคำตอบ'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  )
}
