import React, { useState, useEffect } from 'react'
import { 
  Database, FileSpreadsheet, Download, RefreshCw, X, 
  CheckCircle, XCircle, Clock, Zap, Trophy, Users, Award, ChevronRight
} from 'lucide-react'
import DiceBearAvatar from './DiceBearAvatar'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { sounds } from '../utils/soundEffects'
import { getDepartmentInfo } from '../constants/departments'

export default function RoundHistoryModal({
  isOpen,
  onClose,
  roomId,
  roomCode,
  questions = [],
  allPlayers = [],
  roundHistory = []
}) {
  const [activeTab, setActiveTab] = useState('matrix') // 'matrix' | 'by_round'
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0)
  const [isLoadingDb, setIsLoadingDb] = useState(false)
  const [dbSubmissions, setDbSubmissions] = useState([])
  const [lastSyncTime, setLastSyncTime] = useState(null)

  // Fetch real-time submissions from Supabase DB
  const fetchDbHistory = async () => {
    if (!isSupabaseConfigured() || !roomId) return
    setIsLoadingDb(true)
    try {
      const { data, error } = await supabase
        .from('round_submissions')
        .select(`
          id,
          question_id,
          participant_id,
          selected_option,
          points_awarded,
          bet_amount,
          is_speaker,
          created_at,
          questions(order_num, question_text, correct_option),
          participants(nickname, avatar_url, score)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setDbSubmissions(data)
        setLastSyncTime(new Date().toLocaleTimeString('th-TH'))
      }
    } catch (err) {
      console.warn('Error fetching round submissions:', err)
    } finally {
      setIsLoadingDb(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchDbHistory()
    }
  }, [isOpen, roomId])

  if (!isOpen) return null

  // Process data for Matrix Table (All Rounds x All Players)
  // Combine memory roundHistory and players list
  const roundsCount = Math.max(roundHistory.length, questions.length > 0 ? questions.length : 1)
  
  // Players sorted by total score descending
  const sortedPlayers = [...allPlayers].sort((a, b) => (b.score || 0) - (a.score || 0))

  // Export CSV Function (UTF-8 BOM compatible with Excel)
  const handleExportCSV = () => {
    sounds.playPop()
    try {
      let csvContent = '\uFEFF' // UTF-8 BOM
      
      // Header row
      const headers = ['ลำดับ', 'ชื่อผู้เล่น', 'แผนก/ฝ่าย', 'คะแนนรวม', 'ตอบถูก (ข้อ)']
      for (let i = 0; i < roundsCount; i++) {
        headers.push(`ข้อ ${i + 1} (คำตอบ)`)
        headers.push(`ข้อ ${i + 1} (แต้มที่ได้)`)
      }
      csvContent += headers.join(',') + '\r\n'

      // Player rows
      sortedPlayers.forEach((player, idx) => {
        const row = [
          idx + 1,
          `"${(player.nickname || '').replace(/"/g, '""')}"`,
          `"${(player.department || 'ทั่วไป').replace(/"/g, '""')}"`,
          player.score || 0,
          player.correctCount || 0
        ]

        for (let rIdx = 0; rIdx < roundsCount; rIdx++) {
          const roundData = roundHistory.find(r => r.roundIndex === rIdx)
          const pScore = roundData?.players?.find(p => p.id === player.id || p.nickname === player.nickname)
          
          if (pScore) {
            row.push(pScore.selectedOption ? `"${pScore.selectedOption}${pScore.isCorrect ? ' (ถูก)' : ' (ผิด)'}"` : '"- (ไม่ตอบ)"')
            row.push(pScore.earnedPoints || pScore.roundPoints || 0)
          } else {
            row.push('""')
            row.push('0')
          }
        }

        csvContent += row.join(',') + '\r\n'
      })

      // Download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `คะแนนรายรอบ_SuperBetArena_${roomCode}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export CSV Error:', err)
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ CSV')
    }
  }

  // Selected round data for By-Round tab
  const activeRoundData = roundHistory.find(r => r.roundIndex === selectedRoundIdx)
  const currentQInfo = questions[selectedRoundIdx]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-lg tracking-tight">ประวัติคะแนนแต่ละรอบ & แต่ละคน</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase DB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ห้อง {roomCode} • บันทึกคะแนนสะสมและคำตอบรายข้อของผู้เล่นทุกคน ({allPlayers.length} คน)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync from Supabase Button */}
            <button
              type="button"
              onClick={fetchDbHistory}
              disabled={isLoadingDb}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="รีเฟรชข้อมูลจากฐานข้อมูล Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isLoadingDb ? 'กำลังโหลด...' : 'รีเฟรช DB'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก Excel/CSV</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ตารางคะแนนรวมทุกข้อ (Matrix View)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('by_round')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'by_round'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>ดูเจาะลึกรายข้อ (Per-Question Detail)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            {lastSyncTime ? `อัปเดตล่าสุดจาก DB: ${lastSyncTime}` : 'บันทึกอัตโนมัติเมื่อกดเฉลยคำตอบ'}
          </div>
        </div>

        {/* TAB 1: MATRIX VIEW (ALL PLAYERS X ALL ROUNDS) */}
        {activeTab === 'matrix' && (
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl bg-slate-950/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                    <th className="py-3 px-3 text-center w-12 sticky left-0 bg-slate-900 z-10">#</th>
                    <th className="py-3 px-4 min-w-[180px] sticky left-12 bg-slate-900 z-10">ผู้เล่น / สังกัด</th>
                    <th className="py-3 px-3 text-center min-w-[90px] font-mono text-amber-400">คะแนนรวม</th>
                    <th className="py-3 px-3 text-center min-w-[80px] font-mono text-emerald-400">ตอบถูก</th>
                    {Array.from({ length: roundsCount }).map((_, rIdx) => (
                      <th key={rIdx} className="py-3 px-3 text-center min-w-[85px] border-l border-slate-800/80">
                        ข้อที่ {rIdx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {sortedPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={4 + roundsCount} className="py-12 text-center text-slate-500">
                        ยังไม่มีผู้เล่นในสังเวียน หรือยังไม่ได้เริ่มแข่งขัน
                      </td>
                    </tr>
                  ) : (
                    sortedPlayers.map((player, pIdx) => {
                      const deptInfo = getDepartmentInfo(player.department)
                      return (
                        <tr 
                          key={player.id || pIdx} 
                          className="hover:bg-slate-900/40 transition group"
                        >
                          {/* Rank */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 sticky left-0 bg-slate-950 group-hover:bg-slate-900 z-10">
                            {pIdx + 1}
                          </td>

                          {/* Player info */}
                          <td className="py-2.5 px-4 sticky left-12 bg-slate-950 group-hover:bg-slate-900 z-10">
                            <div className="flex items-center gap-2">
                              <DiceBearAvatar seed={player.nickname} url={player.avatar_url} size="xs" />
                              <div className="truncate">
                                <span className="font-extrabold text-white text-xs truncate block">
                                  {player.nickname}
                                </span>
                                {deptInfo && (
                                  <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold border truncate inline-block ${deptInfo.badgeClass}`}>
                                    {deptInfo.shortName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Total Score */}
                          <td className="py-2.5 px-3 text-center font-mono font-black text-amber-400 text-sm bg-amber-950/10">
                            {player.score || 0}
                          </td>

                          {/* Correct Count */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                            {player.correctCount || 0} / {roundsCount}
                          </td>

                          {/* Per-round Scores */}
                          {Array.from({ length: roundsCount }).map((_, rIdx) => {
                            const roundData = roundHistory.find(r => r.roundIndex === rIdx)
                            const pScore = roundData?.players?.find(p => p.id === player.id || p.nickname === player.nickname)
                            
                            if (!pScore) {
                              return (
                                <td key={rIdx} className="py-2 px-2 text-center border-l border-slate-800/80 text-slate-600 font-mono text-[11px]">
                                  -
                                </td>
                              )
                            }

                            const isCorrect = Boolean(pScore.isCorrect)
                            const pts = pScore.earnedPoints !== undefined ? pScore.earnedPoints : (pScore.roundPoints || 0)

                            return (
                              <td 
                                key={rIdx} 
                                className={`py-2 px-2 text-center border-l border-slate-800/80 font-mono text-[11px] transition ${
                                  isCorrect 
                                    ? 'bg-emerald-950/20 text-emerald-300 font-bold' 
                                    : 'text-slate-500'
                                }`}
                              >
                                <div className="leading-tight">
                                  <span className={`text-[10px] px-1 rounded ${isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'}`}>
                                    {pScore.selectedOption || '-'}
                                  </span>
                                  <div className="text-[10px] mt-0.5 font-bold">
                                    {isCorrect ? `+${pts}` : '0'}
                                  </div>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PER-ROUND DETAILED BREAKDOWN */}
        {activeTab === 'by_round' && (
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4">
            
            {/* Round Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {Array.from({ length: roundsCount }).map((_, rIdx) => {
                const isSelected = selectedRoundIdx === rIdx
                const isRecorded = roundHistory.some(r => r.roundIndex === rIdx)
                return (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => { sounds.playTick(); setSelectedRoundIdx(rIdx); }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 transition cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                        : isRecorded
                          ? 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
                          : 'bg-slate-900/50 text-slate-500 border-slate-800'
                    }`}
                  >
                    <span>ข้อที่ {rIdx + 1}</span>
                    {isRecorded && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                )
              })}
            </div>

            {/* Question Details Banner */}
            {currentQInfo && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-purple-400">
                    โจทย์คำถามข้อที่ {selectedRoundIdx + 1}:
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    เฉลย: ช้อยส์ {currentQInfo.correct_option}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
                  {currentQInfo.question_text}
                </h4>
                {currentQInfo.explanation && (
                  <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    💡 <strong>คำอธิบาย:</strong> {currentQInfo.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Players Table for this Round */}
            <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-800 shadow-lg bg-slate-950/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-4">ผู้เล่น</th>
                    <th className="py-2.5 px-3 text-center">คำตอบที่เลือก</th>
                    <th className="py-2.5 px-3 text-center">ผลลัพธ์</th>
                    <th className="py-2.5 px-3 text-center">แต้มที่ได้ข้อนี้</th>
                    <th className="py-2.5 px-3 text-center font-mono text-amber-400">คะแนนสะสมหลังจบรอบนี้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {sortedPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        ยังไม่มีผู้เล่นในข้อนี้
                      </td>
                    </tr>
                  ) : (
                    sortedPlayers.map((player, idx) => {
                      const pRound = activeRoundData?.players?.find(p => p.id === player.id || p.nickname === player.nickname)
                      const isCorrect = Boolean(pRound?.isCorrect)
                      const choice = pRound?.selectedOption || '-'
                      const pts = pRound?.earnedPoints !== undefined ? pRound.earnedPoints : (pRound?.roundPoints || 0)

                      return (
                        <tr key={player.id || idx} className="hover:bg-slate-900/40 transition">
                          <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <DiceBearAvatar seed={player.nickname} url={player.avatar_url} size="xs" />
                              <span className="font-extrabold text-white text-xs">{player.nickname}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              isCorrect 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                : choice !== '-' 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'text-slate-600'
                            }`}>
                              {choice}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {choice === '-' ? (
                              <span className="text-slate-500 text-[11px]">ไม่ส่งคำตอบ</span>
                            ) : isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                ถูกต้อง
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 text-[11px] font-bold">
                                <XCircle className="w-3.5 h-3.5" />
                                ตอบผิด
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {isCorrect ? (
                              <span className="text-emerald-400 font-black">+{pts} แต้ม</span>
                            ) : (
                              <span className="text-slate-500">0 แต้ม</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-black text-amber-400 text-sm">
                            {pRound?.totalScore !== undefined ? pRound.totalScore : (player.score || 0)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Footer Info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>ทุกการเฉลยคำตอบ ระบบจะบันทึกผลคะแนนและช้อยส์ที่เลือกของผู้เล่นทุกคนลงตาราง <code>round_submissions</code> อัตโนมัติ</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  )
}
