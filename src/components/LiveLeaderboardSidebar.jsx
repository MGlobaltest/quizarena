import React, { useState } from 'react'
import { 
  Trophy, Crown, Users, CheckCircle, Clock, 
  Coins, Maximize2, Search, Edit3, Sparkles, Zap 
} from 'lucide-react'
import DiceBearAvatar from './DiceBearAvatar'
import { getDepartmentInfo, DEFAULT_DEPARTMENTS } from '../constants/departments'
import { sounds } from '../utils/soundEffects'

export default function LiveLeaderboardSidebar({
  players = [],
  submissions = {},
  currentQIndex = 0,
  totalQuestions = 5,
  isRevealed = false,
  onEditPlayer = null,
  onExpandModal = null
}) {
  const [sortBy, setSortBy] = useState('points') // 'points' | 'correct'
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Sort players by total score (points + speed) or by correct count
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

  // Filter
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

  // Department counts
  const deptCounts = {}
  players.forEach(p => {
    const dept = p.department ? p.department.trim() : 'UNASSIGNED'
    deptCounts[dept] = (deptCounts[dept] || 0) + 1
  })

  const submittedCount = Object.keys(submissions).length

  // Top 3 Podium summary
  const top1 = sortedPlayers[0] || null
  const top2 = sortedPlayers[1] || null
  const top3 = sortedPlayers[2] || null

  return (
    <aside className="w-full h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden">
      
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h3 className="font-black text-white text-sm tracking-tight truncate">กระดานคะแนนสด</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="อัปเดตสด Realtime" />
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {sortBy === 'correct' ? 'เรียงตามข้อที่ตอบถูก' : 'เรียงตามคะแนนสูงสุด (แต้ม+ความเร็ว)'} ({players.length} คน)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onExpandModal && (
            <button
              onClick={() => {
                sounds.playPop()
                onExpandModal()
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="ขยายกระดานคะแนนเต็มจอ"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dual Category Toggle Pills: Points+Speed vs Correct */}
      <div className="p-1.5 flex items-center gap-1 bg-slate-950/80 border-b border-slate-800">
        <button
          type="button"
          onClick={() => { sounds.playPop(); setSortBy('points'); }}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            sortBy === 'points'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Zap className="w-3 h-3 fill-current" />
          <span>คะแนนสูงสุด (แต้ม+ความเร็ว)</span>
        </button>
        <button
          type="button"
          onClick={() => { sounds.playPop(); setSortBy('correct'); }}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            sortBy === 'correct'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <CheckCircle className="w-3 h-3" />
          <span>ตอบถูกสูงสุด</span>
        </button>
      </div>

      {/* Top 3 Mini Podium (Compact) */}
      {sortedPlayers.length >= 2 && (
        <div className="p-3 bg-gradient-to-b from-slate-950/50 to-transparent border-b border-slate-800/80">
          <div className="grid grid-cols-3 gap-1.5 items-end">
            
            {/* 2nd Place */}
            {top2 ? (
              <div 
                onClick={() => onEditPlayer && onEditPlayer(top2)}
                className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col items-center text-center cursor-pointer hover:border-slate-500 transition"
                title={`อันดับ 2: ${top2.nickname} (${sortBy === 'correct' ? `${top2.correctCount || 0} ข้อ` : `${top2.score !== undefined ? top2.score : 0} แต้ม`})`}
              >
                <span className="text-xs">🥈</span>
                <DiceBearAvatar seed={top2.nickname} url={top2.avatar_url} size="xs" className="my-0.5" />
                <span className="text-[11px] font-bold text-white truncate max-w-full">{top2.nickname}</span>
                <span className={`text-[10px] font-black font-mono ${sortBy === 'correct' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {sortBy === 'correct' ? `${top2.correctCount || 0}/${totalQuestions} ข้อ` : `${top2.score !== undefined ? top2.score : 0} แต้ม`}
                </span>
              </div>
            ) : <div />}

            {/* 1st Place */}
            {top1 ? (
              <div 
                onClick={() => onEditPlayer && onEditPlayer(top1)}
                className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-400/80 flex flex-col items-center text-center shadow-lg relative -translate-y-1 cursor-pointer hover:border-amber-300 transition"
                title={`อันดับ 1: ${top1.nickname} (${sortBy === 'correct' ? `${top1.correctCount || 0} ข้อ` : `${top1.score !== undefined ? top1.score : 0} แต้ม`})`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-2 fill-amber-400 animate-bounce" />
                <span className="text-sm">🥇</span>
                <DiceBearAvatar seed={top1.nickname} url={top1.avatar_url} size="sm" className="my-0.5" />
                <span className="text-xs font-black text-amber-300 truncate max-w-full">{top1.nickname}</span>
                <span className={`text-[11px] font-black font-mono ${sortBy === 'correct' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {sortBy === 'correct' ? `${top1.correctCount || 0}/${totalQuestions} ข้อ` : `${top1.score !== undefined ? top1.score : 0} แต้ม`}
                </span>
              </div>
            ) : <div />}

            {/* 3rd Place */}
            {top3 ? (
              <div 
                onClick={() => onEditPlayer && onEditPlayer(top3)}
                className="p-2 rounded-xl bg-slate-800/70 border border-amber-900/40 flex flex-col items-center text-center cursor-pointer hover:border-amber-700 transition"
                title={`อันดับ 3: ${top3.nickname} (${sortBy === 'correct' ? `${top3.correctCount || 0} ข้อ` : `${top3.score !== undefined ? top3.score : 0} แต้ม`})`}
              >
                <span className="text-xs">🥉</span>
                <DiceBearAvatar seed={top3.nickname} url={top3.avatar_url} size="xs" className="my-0.5" />
                <span className="text-[11px] font-bold text-white truncate max-w-full">{top3.nickname}</span>
                <span className={`text-[10px] font-black font-mono ${sortBy === 'correct' ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {sortBy === 'correct' ? `${top3.correctCount || 0}/${totalQuestions} ข้อ` : `${top3.score !== undefined ? top3.score : 0} แต้ม`}
                </span>
              </div>
            ) : <div />}

          </div>
        </div>
      )}

      {/* Department Filter Pills (Scrollable) */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/30 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setSelectedDept('ALL')}
          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap cursor-pointer transition ${
            selectedDept === 'ALL'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
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
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border whitespace-nowrap flex items-center gap-1 cursor-pointer transition ${
                isSelected
                  ? `${info ? info.badgeClass : 'bg-indigo-600 text-white'} ring-1 ring-purple-400`
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              {info && <span className={`w-1.5 h-1.5 rounded-full ${info.dotClass}`} />}
              <span>{info ? info.shortName : deptKey}</span>
              <span className="opacity-70 text-[9px]">({deptCounts[deptKey]})</span>
            </button>
          )
        })}
      </div>

      {/* Search Input for fast lookup */}
      {sortedPlayers.length > 6 && (
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้เล่น..."
              className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {/* Ranked Players List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[300px] max-h-[520px]">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            ไม่พบผู้เล่นในกลุ่มนี้
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const rankIndex = sortedPlayers.findIndex(p => p.id === player.id) + 1
            const deptInfo = getDepartmentInfo(player.department)
            const sub = submissions[player.id]
            const hasSub = Boolean(sub)

            // Rank Badge
            let rankBadge = (
              <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                #{rankIndex}
              </span>
            )
            if (rankIndex === 1) {
              rankBadge = (
                <span className="w-5 h-5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                  1🥇
                </span>
              )
            } else if (rankIndex === 2) {
              rankBadge = (
                <span className="w-5 h-5 rounded-lg bg-slate-300 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                  2🥈
                </span>
              )
            } else if (rankIndex === 3) {
              rankBadge = (
                <span className="w-5 h-5 rounded-lg bg-amber-700 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  3🥉
                </span>
              )
            }

            return (
              <div
                key={player.id}
                onClick={() => onEditPlayer && onEditPlayer(player)}
                className={`p-2 rounded-2xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                  rankIndex === 1
                    ? 'bg-amber-950/25 border-amber-500/40 hover:border-amber-400'
                    : rankIndex <= 3
                      ? 'bg-slate-800/60 border-slate-700/80 hover:border-purple-500/50'
                      : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                } hover:scale-[1.01]`}
                title="คลิกเพื่อแก้ไขชื่อ / จัดทีม / ปรับคะแนน"
              >
                {/* Left: Rank + Avatar + Name + Dept */}
                <div className="flex items-center gap-2 min-w-0">
                  {rankBadge}
                  
                  <div className="relative shrink-0">
                    <DiceBearAvatar seed={player.nickname} url={player.avatar_url} size="xs" />
                    {deptInfo && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${deptInfo.dotClass}`} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-extrabold text-white text-xs truncate">
                        {player.nickname}
                      </span>
                      {deptInfo && (
                        <span className={`text-[8px] px-1 rounded font-bold border truncate shrink-0 ${deptInfo.badgeClass}`}>
                          {deptInfo.shortName}
                        </span>
                      )}
                    </div>

                    {/* Status in current question */}
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      {hasSub ? (
                        <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>ช้อยส์ {sub.selectedOption}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>รอตอบ...</span>
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

                {/* Right: Score in points & correct count + Edit icon */}
                <div className="text-right shrink-0 flex items-center gap-1.5">
                  <div>
                    {sortBy === 'correct' ? (
                      <>
                        <div className="font-mono font-black text-xs text-emerald-400">
                          {player.correctCount || 0}/{totalQuestions} ข้อ
                        </div>
                        <div className="text-[9px] text-amber-400/80 font-mono">
                          {player.score !== undefined ? player.score : 0} แต้ม
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-mono font-black text-xs text-amber-300">
                            {player.score !== undefined ? player.score : 0}
                          </span>
                          <span className="text-[9px] text-amber-400/80 font-bold ml-0.5">แต้ม</span>
                        </div>
                        <div className="text-[9px] text-emerald-400/80 font-mono">
                          ถูก {player.correctCount || 0}/{totalQuestions} ข้อ
                        </div>
                      </>
                    )}
                  </div>
                  <Edit3 className="w-3 h-3 text-slate-600 hover:text-purple-400 transition" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span>ส่งแล้ว:</span>
          <span className="font-mono font-black text-emerald-400">
            {submittedCount}/{players.length}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          คลิกแถวเพื่อแก้ไขข้อมูล
        </span>
      </div>

    </aside>
  )
}
