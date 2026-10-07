import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { 
  Coins, Sparkles, Flame, CheckCircle, XCircle, 
  HelpCircle, RefreshCw, Send, Radio, Shield, 
  ThumbsUp, ThumbsDown, Trophy, ArrowRight, User, Home,
  Clock, AlertTriangle, Zap, Star
} from 'lucide-react'
import { supabase, isSupabaseConfigured, getAvatarUrl } from '../lib/supabaseClient'
import { sounds } from '../utils/soundEffects'
import DiceBearAvatar from '../components/DiceBearAvatar'
import SoundToggle from '../components/SoundToggle'
import LiveLeaderboardModal from '../components/LiveLeaderboardModal'
import { DEFAULT_DEPARTMENTS, getDepartmentInfo } from '../constants/departments'

export default function PlayPage() {
  const [searchParams] = useSearchParams()
  const getRoomParam = () => {
    if (typeof window === 'undefined') return 'ARENA88'
    const fromHook = searchParams.get('room')
    if (fromHook) return fromHook
    const fromSearch = new URLSearchParams(window.location.search).get('room')
    if (fromSearch) return fromSearch
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
    if (hashQuery) {
      const fromHash = new URLSearchParams(hashQuery).get('room')
      if (fromHash) return fromHash
    }
    return 'ARENA88'
  }
  const initialRoom = getRoomParam()

  // Join Form State
  const [roomCode, setRoomCode] = useState(initialRoom)
  const [nickname, setNickname] = useState('')
  const [department, setDepartment] = useState('')
  const [teamColor, setTeamColor] = useState('')
  const [avatarSeed, setAvatarSeed] = useState(() => 'Hero-' + Math.floor(Math.random() * 1000))
  const [isJoined, setIsJoined] = useState(false)
  const [participantId, setParticipantId] = useState(null)
  const [score, setScore] = useState(() => {
    try {
      const saved = localStorage.getItem('sba_my_score')
      return saved ? Number(saved) : 0
    } catch {
      return 0
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sba_my_score', String(score))
    } catch {}
  }, [score])

  // Arena & Question State
  const [gameStatus, setGameStatus] = useState('lobby') // 'lobby', 'question_active', 'revealed', 'finished'
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [currentSpeaker, setCurrentSpeaker] = useState(null)

  // Question Timer State
  const [timerDuration, setTimerDuration] = useState(10)
  const [timeLeft, setTimeLeft] = useState(10)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [timerTriggerMode, setTimerTriggerMode] = useState('speaker')

  // Leaderboard Modal State
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [liveLeaderboard, setLiveLeaderboard] = useState([])

  // Player Decision State
  const [myChoice, setMyChoice] = useState(null) // 'A' | 'B' | 'C' | 'D'
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedTimeLeft, setSubmittedTimeLeft] = useState(null)
  
  // Round Result State
  const [roundResult, setRoundResult] = useState(null)
  const [joining, setJoining] = useState(false)

  const channelRef = useRef(null)

  const isMeSpeaker = currentSpeaker && participantId && currentSpeaker.id === participantId

  // Clean up channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // Live Presence sync so Host always sees current score
  useEffect(() => {
    if (channelRef.current && isJoined && participantId) {
      try {
        channelRef.current.track({
          id: participantId,
          nickname,
          avatar_url: getAvatarUrl(avatarSeed),
          score: score,
          department: department ? department.trim() : '',
          teamColor
        })
      } catch (e) {
        console.warn(e)
      }
    }
  }, [score, isJoined, participantId, nickname, department, teamColor])

  // Randomize Avatar Seed
  const handleRandomizeAvatar = () => {
    sounds.playPop()
    setAvatarSeed('Hero-' + Math.floor(Math.random() * 9999))
  }

  // 1. Join Arena Action
  const handleJoinArena = async (e) => {
    e.preventDefault()
    if (!nickname.trim()) {
      alert('กรุณากรอกชื่อเล่นของคุณ')
      return
    }

    setJoining(true)
    sounds.playPop()

    const cleanCode = roomCode.trim().toUpperCase()
    const cleanNick = nickname.trim()
    const myAvatar = getAvatarUrl(avatarSeed)
    let pId = 'p-' + Math.random().toString(36).substring(2, 9)

    // Supabase DB Join (if configured)
    if (isSupabaseConfigured()) {
      try {
        // Find room ID
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms')
          .select('id, status, current_question_index')
          .eq('code', cleanCode)
          .maybeSingle()

        if (roomData) {
          // Insert or update participant
          const { data: partData, error: partErr } = await supabase
            .from('participants')
            .upsert({
              room_id: roomData.id,
              nickname: cleanNick,
              avatar_url: myAvatar,
              score: 0,
              is_connected: true
            }, { onConflict: 'room_id, nickname' })
            .select()
            .single()

          if (!partErr && partData) {
            pId = partData.id
            setScore(partData.score || 0)
          }
          if (roomData.status) {
            setGameStatus(roomData.status)
          }
        }
      } catch (err) {
        console.warn('DB join error, proceeding with Realtime Channel:', err)
      }
    }

    setParticipantId(pId)
    setIsJoined(true)
    setJoining(false)

    // Setup Realtime Channel
    setupPlayerChannel(cleanCode, {
      id: pId,
      nickname: cleanNick,
      avatar_url: myAvatar,
      score: 0,
      department: department.trim(),
      teamColor
    })
  }

  // 2. Realtime Channel Subscription
  const setupPlayerChannel = (rCode, playerInfo) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channelName = `arena_room_${rCode}`
    try {
      const oldChannels = supabase.getChannels().filter(ch => ch.topic === `realtime:${channelName}`)
      oldChannels.forEach(ch => supabase.removeChannel(ch))
    } catch (e) {
      console.warn(e)
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: playerInfo.id },
        broadcast: { ack: false }
      }
    })

    // Listen to Host Broadcast Events
    channel.on('broadcast', { event: 'PLAYER_UPDATED' }, ({ payload }) => {
      if (payload.id === playerInfo.id) {
        sounds.playPop()
        if (payload.nickname) setNickname(payload.nickname)
        if (payload.department !== undefined) setDepartment(payload.department)
        if (payload.teamColor !== undefined) setTeamColor(payload.teamColor)
        if (payload.score !== undefined) setScore(payload.score)
      }
    })

    channel.on('broadcast', { event: 'STATE_SYNC' }, ({ payload }) => {
      if (payload.gameStatus) setGameStatus(payload.gameStatus)
      if (payload.currentQuestion) {
        setCurrentQuestion(payload.currentQuestion)
        setQuestionIndex(payload.currentQIndex || 0)
        setTotalQuestions(payload.currentQuestion.total || 5)
      }
      if (payload.speaker) {
        setCurrentSpeaker(payload.speaker)
      }
      if (payload.leaderboard) {
        setLiveLeaderboard(payload.leaderboard)
        const me = payload.leaderboard.find(p => p.id === playerInfo.id)
        if (me && me.score !== undefined) {
          setScore(me.score)
        }
      }
      if (payload.timer) {
        if (payload.timer.duration !== undefined) setTimerDuration(payload.timer.duration)
        if (payload.timer.timeLeft !== undefined) setTimeLeft(payload.timer.timeLeft)
        if (payload.timer.isRunning !== undefined) setIsTimerRunning(payload.timer.isRunning)
        if (payload.timer.isTimeUp !== undefined) setIsTimeUp(payload.timer.isTimeUp)
        if (payload.timer.mode !== undefined) setTimerTriggerMode(payload.timer.mode)
      }
    })

    channel.on('broadcast', { event: 'TIMER_UPDATE' }, ({ payload }) => {
      if (payload.duration !== undefined) setTimerDuration(payload.duration)
      if (payload.mode !== undefined) setTimerTriggerMode(payload.mode)
      if (payload.isRunning !== undefined) setIsTimerRunning(payload.isRunning)
      if (payload.isTimeUp !== undefined) {
        setIsTimeUp(payload.isTimeUp)
        if (payload.isTimeUp) {
          sounds.playBuzzer()
        }
      }
      if (payload.timeLeft !== undefined) {
        setTimeLeft(payload.timeLeft)
        if (payload.timeLeft <= 5 && payload.timeLeft > 0 && payload.isRunning) {
          sounds.playUrgentTick()
        }
      }
    })

    channel.on('broadcast', { event: 'SPEAKER_SELECTED' }, ({ payload }) => {
      sounds.playPop()
      setCurrentSpeaker({
        id: payload.speakerId,
        nickname: payload.speakerName,
        avatar_url: payload.avatar_url,
        selectedOption: null
      })
    })

    channel.on('broadcast', { event: 'NEXT_ROUND' }, ({ payload }) => {
      sounds.playTick()
      setGameStatus('question_active')
      setMyChoice(null)
      setCurrentSpeaker(null)
      setHasSubmitted(false)
      setSubmittedTimeLeft(null)
      setIsTimeUp(false)
      setIsTimerRunning(false)
      setRoundResult(null)
      setQuestionIndex(payload.roundIndex || 0)
      if (payload.currentQuestion) {
        setCurrentQuestion(payload.currentQuestion)
      }
      if (payload.total) {
        setTotalQuestions(payload.total)
      }
      if (payload.leaderboard) {
        setLiveLeaderboard(payload.leaderboard)
        const me = payload.leaderboard.find(p => p.id === playerInfo.id)
        if (me && me.score !== undefined) {
          setScore(me.score)
        }
      }
    })

    channel.on('broadcast', { event: 'GAME_RESET' }, () => {
      setGameStatus('lobby')
      setMyChoice(null)
      setCurrentSpeaker(null)
      setHasSubmitted(false)
      setSubmittedTimeLeft(null)
      setIsTimeUp(false)
      setIsTimerRunning(false)
      setRoundResult(null)
      setScore(0)
      try {
        localStorage.setItem('sba_my_score', '0')
      } catch {}
    })

    channel.on('broadcast', { event: 'ROUND_RESET' }, () => {
      sounds.playPop()
      setHasSubmitted(false)
      setSubmittedTimeLeft(null)
      setIsTimeUp(false)
      setIsTimerRunning(false)
      setMyChoice(null)
      setRoundResult(null)
      setCurrentSpeaker(null)
      setGameStatus('question_active')
    })

    channel.on('broadcast', { event: 'GAME_FINISHED' }, ({ payload }) => {
      sounds.playWin()
      setGameStatus('finished')
      if (payload?.leaderboard) {
        setLiveLeaderboard(payload.leaderboard)
      }
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
    })

    channel.on('broadcast', { event: 'ROUND_REVEAL' }, ({ payload }) => {
      const correctOpt = payload.correctOption
      const isCorrect = (myChoice === correctOpt)

      // Calculate score Kahoot style: 500 base + speed bonus up to 500
      const timeAtSubmit = submittedTimeLeft !== null ? submittedTimeLeft : 0
      const totalDur = timerDuration || 10
      const speedRatio = Math.max(0, Math.min(1, timeAtSubmit / totalDur))
      const speedBonus = isCorrect ? Math.round(speedRatio * 500) : 0
      const earnedPoints = isCorrect ? (500 + speedBonus) : 0

      if (isCorrect) {
        sounds.playWin()
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } })
      } else {
        sounds.playLose()
      }

      setRoundResult({
        correctOption: correctOpt,
        explanation: payload.explanation,
        isCorrect,
        myChoice,
        basePoints: isCorrect ? 500 : 0,
        speedBonus,
        earnedPoints,
        submittedTimeLeft: timeAtSubmit
      })

      if (payload.leaderboard) {
        setLiveLeaderboard(payload.leaderboard)
        const me = payload.leaderboard.find(p => p.id === playerInfo.id)
        if (me && me.score !== undefined) {
          setScore(me.score)
        } else {
          setScore(prev => prev + earnedPoints)
        }
      } else {
        setScore(prev => prev + earnedPoints)
      }
      setGameStatus('revealed')
    })

    // Track Presence in Room
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ ...playerInfo, score: score })
        // Request immediate state sync from Host
        channel.send({ type: 'broadcast', event: 'REQUEST_ROOM_SYNC', payload: {} })
      }
    })

    channelRef.current = channel
  }

  // 3. Submit Decision: Direct Choice Selection with Speed Timestamp
  const handleSubmitDecision = () => {
    if (isTimeUp) {
      alert('หมดเวลาสำหรับการส่งคำตอบข้อนี้แล้ว!')
      return
    }

    if (!myChoice) {
      alert('กรุณาเลือกคำตอบ A, B, C หรือ D ก่อนส่ง')
      return
    }

    sounds.playPop()
    setHasSubmitted(true)
    setSubmittedTimeLeft(timeLeft)

    const payload = {
      participantId,
      nickname,
      avatarUrl: getAvatarUrl(avatarSeed),
      selectedOption: myChoice,
      timeLeftAtSubmit: timeLeft,
      timerDuration: timerDuration || 10,
      isSpeaker: Boolean(isMeSpeaker),
      department: department || '',
      score: score
    }

    // Broadcast submission live to Host screen
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAYER_SUBMIT',
        payload
      })
    }
  }

  // =========================================================================
  // VIEW A: JOIN ARENA SCREEN
  // =========================================================================
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-purple-600">
        
        {/* Top Header */}
        <div className="w-full max-w-md text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>SUPER BET ARENA • PLAYER ARENA</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">เข้าสู่สังเวียนตอบคำถาม</h1>
          <p className="text-xs text-slate-400 mt-1">เดิมพันความรู้ ประลองไหวพริบ ชิงความเป็นหนึ่ง</p>
        </div>

        {/* Join Card */}
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          
          {/* Avatar Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-2">
              <DiceBearAvatar seed={nickname || avatarSeed} size="xl" />
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition cursor-pointer border border-purple-400"
                title="สุ่ม Avatar ใหม่"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs text-slate-400 font-medium">ภาพอวตารของคุณ (DiceBear Bottts)</span>
          </div>

          <form onSubmit={handleJoinArena} className="space-y-4">
            
            {/* Room Code Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                รหัสห้อง (Room Code)
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="เช่น ARENA88"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono font-bold text-base tracking-widest focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 uppercase"
                required
              />
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                ชื่อเล่นของคุณ (Nickname)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น นินจาอวกาศ, Agent 007"
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-bold text-base focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                required
              />
            </div>

            {/* Department / Team Selector (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  สังกัดทีม / แผนก
                </label>
                <span className="text-[10px] text-purple-400 font-medium">ไม่บังคับ (หรือรอให้ Host จัดให้)</span>
              </div>
              <select
                value={department}
                onChange={(e) => {
                  const val = e.target.value
                  setDepartment(val)
                  const info = getDepartmentInfo(val)
                  setTeamColor(info ? info.color : '')
                }}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-semibold focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="">-- ยังไม่ระบุทีม (ให้ Host จัดให้ภายหลัง) --</option>
                {DEFAULT_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Starting Score Notice */}
            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Zap className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="font-extrabold text-purple-300 text-xs uppercase tracking-wide">กติกาคะแนน & โบนัสความเร็ว</div>
                <div className="text-xs text-slate-300">คะแนนเริ่มต้น <strong className="text-white">0 แต้ม</strong> • ตอบถูกได้ <strong className="text-emerald-400">500 แต้ม</strong> + โบนัสความเร็วสูงสุด <strong className="text-amber-400">+500 แต้ม</strong></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={joining}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base rounded-2xl shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{joining ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่สังเวียน (Join Arena)'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

          </form>

        </div>

      </div>
    )
  }

  const currentDeptInfo = getDepartmentInfo(department)

  // =========================================================================
  // VIEW B: IN-ARENA SCREEN (Player Mobile Dashboard)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-lg mx-auto border-x border-slate-800 shadow-2xl">
      
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <DiceBearAvatar seed={nickname || avatarSeed} size="sm" />
            {currentDeptInfo && (
              <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${currentDeptInfo.dotClass}`} />
            )}
          </div>
          <div>
            <div className="font-extrabold text-white text-sm leading-tight truncate max-w-[130px]">{nickname}</div>
            {currentDeptInfo ? (
              <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold border truncate max-w-[120px] ${currentDeptInfo.badgeClass}`}>
                {currentDeptInfo.shortName}
              </span>
            ) : (
              <div className="text-[10px] text-slate-400 font-mono">ห้อง: {roomCode}</div>
            )}
          </div>
        </div>

        {/* Score Balance Pill & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Leaderboard Modal Trigger */}
          <button
            onClick={() => {
              sounds.playPop()
              setShowLeaderboard(true)
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm transition active:scale-95 cursor-pointer"
            title="ดูกระดานคะแนนสด / อันดับ"
          >
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-black">อันดับ</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-black text-amber-300 text-xs sm:text-sm">{score} แต้ม</span>
          </div>
          <SoundToggle />
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="รีเฟรชหน้าจอ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Interactive Screen */}
      <main className="flex-1 p-4 flex flex-col justify-between">

        {/* --------------------------------------------------------- */}
        {/* SUB-VIEW 1: LOBBY (WAITING FOR HOST TO START)             */}
        {/* --------------------------------------------------------- */}
        {gameStatus === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center animate-ping absolute inset-0" />
              <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-purple-400 flex items-center justify-center shadow-xl relative z-10">
                <Radio className="w-10 h-10 text-purple-400 animate-pulse" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-white mb-2">เชื่อมต่อสังเวียนสำเร็จแล้ว!</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                กำลังรอ Host เริ่มเปิดคำถามประจำรอบ...<br />
                เตรียมตอบให้เร็วเพื่อชิงโบนัสความเร็วสูงสุด!
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">กติกาการแข่งขัน:</div>
              <div className="text-xs text-slate-400 flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>ตอบถูก</strong> รับ 500 คะแนนพื้นฐาน</span>
              </div>
              <div className="text-xs text-slate-400 flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>โบนัสความเร็ว (Speed Bonus)</strong> ยิ่งตอบเร็วยิ่งได้แต้มเพิ่มสูงสุดถึง +500 คะแนน (เต็ม 1,000 คะแนน/ข้อ)</span>
              </div>
              <div className="text-xs text-slate-400 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>ตอบผิดหรือส่งไม่ทัน ได้ 0 คะแนน (ไม่มีการหักคะแนน)</span>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* SUB-VIEW 2: QUESTION & ACTION PHASE                       */}
        {/* --------------------------------------------------------- */}
        {gameStatus === 'question_active' && (
          <div className="flex-1 flex flex-col space-y-4">
            
            {/* Realtime Countdown Timer Bar */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isTimeUp ? 'text-rose-400' : timeLeft <= 5 ? 'text-rose-400 animate-pulse' : timeLeft <= 10 ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className="text-xs font-bold text-slate-200">
                    {isTimeUp ? (
                      <span className="text-rose-400 font-black animate-pulse">⏰ หมดเวลาตอบคำถามแล้ว!</span>
                    ) : isTimerRunning ? (
                      <span>เวลาตอบคำถามที่เหลือ</span>
                    ) : (
                      <span className="text-slate-400">
                        {timerTriggerMode === 'speaker' && !currentSpeaker ? 'รอ Host สุ่ม Speaker เพื่อเริ่มจับเวลา' : 'หยุดเวลาชั่วคราว'}
                      </span>
                    )}
                  </span>
                </div>

                <div className={`px-2.5 py-0.5 rounded-full font-mono font-black text-xs border ${
                  isTimeUp
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : timeLeft <= 5
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-bounce'
                    : timeLeft <= 10
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {timeLeft}s
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isTimeUp
                      ? 'bg-rose-600'
                      : timeLeft <= 5
                      ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                      : timeLeft <= 10
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, (timeLeft / (timerDuration || 10)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Live Speed Bonus Potential */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>โบนัสความเร็ว (ตอบตอนนี้):</span>
              </div>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                +{Math.round((Math.max(0, timeLeft) / (timerDuration || 10)) * 500)} คะแนน
              </span>
            </div>

            {/* Question Card */}
            {currentQuestion ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-bold text-purple-400">ข้อที่ {questionIndex + 1} / {totalQuestions}</span>
                  <span className="text-[11px]">สังเวียนสด</span>
                </div>
                <h3 className="font-bold text-base text-white leading-snug">
                  {currentQuestion.question_text}
                </h3>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                กำลังรอรายละเอียดคำถามจาก Host...
              </div>
            )}

            {/* ROLE BANNER: SPEAKER vs REGULAR PLAYER */}
            {isMeSpeaker ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-2 border-purple-500 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500 text-slate-950 font-black">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">คุณคือ SPEAKER ประจำข้อนี้! 🎤</h4>
                    <p className="text-xs text-purple-200">เลือกช้อยส์ที่คุณมั่นใจเพื่อทำแต้มให้ตัวเอง</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentSpeaker ? (
                    <DiceBearAvatar seed={currentSpeaker.nickname} url={currentSpeaker.avatar_url} size="sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">ตัวแทนตอบ (Speaker)</div>
                    <div className="text-xs font-black text-white">
                      {currentSpeaker ? currentSpeaker.nickname : 'Host กำลังจะสุ่ม Speaker...'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-xl border border-purple-500/20">
                  {currentSpeaker?.selectedOption ? '✓ ตอบแล้ว' : 'กำลังคิด'}
                </div>
              </div>
            )}

            {/* CHOICE SELECTION (A, B, C, D) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>{isMeSpeaker ? 'คุณคือ Speaker! เลือกคำตอบของคุณ:' : 'เลือกคำตอบเพื่อชิงคะแนน (ฐาน 500 + โบนัสความเร็วสูงสุด 500):'}</span>
                {isTimeUp && <span className="text-rose-400 font-bold">🔒 ปิดรับคำตอบ</span>}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { letter: 'A', text: currentQuestion?.option_a || 'ตัวเลือก A', color: 'hover:border-indigo-500' },
                  { letter: 'B', text: currentQuestion?.option_b || 'ตัวเลือก B', color: 'hover:border-blue-500' },
                  { letter: 'C', text: currentQuestion?.option_c || 'ตัวเลือก C', color: 'hover:border-amber-500' },
                  { letter: 'D', text: currentQuestion?.option_d || 'ตัวเลือก D', color: 'hover:border-rose-500' },
                ].map(opt => {
                  const isSelected = myChoice === opt.letter
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      disabled={hasSubmitted || isTimeUp}
                      onClick={() => {
                        sounds.playPop()
                        setMyChoice(opt.letter)
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/40 neon-border-purple shadow-lg scale-[1.01]'
                          : `border-slate-800 bg-slate-900/60 ${opt.color} text-slate-200`
                      } ${(hasSubmitted || isTimeUp) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center ${
                          isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {opt.letter}
                        </span>
                        <span className="text-xs font-bold">{opt.text}</span>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-purple-400" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SUBMIT BUTTON OR SUBMITTED / TIME'S UP STATUS */}
            {isTimeUp && !hasSubmitted ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-1.5 mt-auto">
                <div className="inline-flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>หมดเวลาสำหรับการส่งคำตอบข้อนี้แล้ว!</span>
                </div>
                <p className="text-xs text-slate-400">
                  ระบบปิดรับคำตอบเรียบร้อยแล้ว รอดูผลเฉลยจาก Host ประจำห้อง
                </p>
              </div>
            ) : !hasSubmitted ? (
              <button
                type="button"
                disabled={!myChoice}
                onClick={handleSubmitDecision}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5 fill-slate-950" />
                <span>ส่งคำตอบ (ล็อกเวลา + ชิงโบนัสความเร็ว)</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-2 mt-auto">
                <div className="inline-flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>บันทึกการส่งคำตอบเรียบร้อยแล้ว!</span>
                </div>
                <p className="text-xs text-slate-300">
                  คุณเลือกช้อยส์ <strong className="text-white font-bold">{myChoice}</strong> (ล็อกเวลาไว้ที่ {submittedTimeLeft}s)
                </p>
                <div className="text-[11px] text-purple-300 font-medium">
                  ⚡ ลุ้นรับคะแนนเต็มและโบนัสความเร็วบนจอ Host...
                </div>
              </div>
            )}

          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* SUB-VIEW 3: REVEALED ROUND RESULTS                        */}
        {/* --------------------------------------------------------- */}
        {gameStatus === 'revealed' && roundResult && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-5">
            
            <div className={`p-5 rounded-3xl border-2 w-full shadow-2xl ${
              roundResult.isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/60 neon-border-emerald'
                : 'bg-rose-950/40 border-rose-500/60 neon-border-rose'
            }`}>
              
              {/* Outcome Badge */}
              <div className="text-4xl mb-2">
                {roundResult.isCorrect ? '🎉' : '❌'}
              </div>

              <h3 className="text-2xl font-black text-white mb-1">
                {roundResult.isCorrect ? 'ตอบถูกต้อง!' : 'ตอบไม่ถูกต้อง'}
              </h3>

              {/* Point Change Display */}
              <div className={`text-3xl font-black font-mono my-2 ${
                roundResult.isCorrect ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {roundResult.isCorrect ? `+${roundResult.earnedPoints}` : '0'} คะแนน
              </div>

              {roundResult.isCorrect && (
                <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono my-1">
                  <span className="text-slate-300">ฐาน: <strong>+500</strong></span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400 flex items-center gap-1 font-bold">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    โบนัสความเร็ว: +{roundResult.speedBonus}
                  </span>
                </div>
              )}

              <div className="text-xs text-slate-300 space-y-1.5 mt-4 pt-3 border-t border-slate-800/80">
                <div>คำตอบที่ถูกต้องคือ: <strong className="text-emerald-400 font-bold">ช้อยส์ {roundResult.correctOption}</strong></div>
                <div>คำตอบที่คุณเลือก: <strong className={roundResult.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>ช้อยส์ {roundResult.myChoice || '-'}</strong></div>
              </div>
            </div>

            {/* Explanation Note */}
            {roundResult.explanation && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-300">
                <span className="font-bold text-white block mb-1">💡 ความรู้ประจำข้อ:</span>
                {roundResult.explanation}
              </div>
            )}

            <div className="text-xs text-slate-400 animate-pulse">
              กำลังรอ Host เปิดคำถามข้อถัดไป...
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* SUB-VIEW 4: FINISHED (ARENA GAME OVER & PODIUM)            */}
        {/* --------------------------------------------------------- */}
        {gameStatus === 'finished' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center shadow-2xl relative">
              <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Arena Finished • สิ้นสุดการแข่งขัน
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                สรุปผลคะแนนสังเวียน
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ขอบคุณที่ร่วมประลองปัญญาใน Super Bet Arena
              </p>
            </div>

            {/* My Final Result Card */}
            <div className="w-full max-w-sm p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <DiceBearAvatar seed={nickname} size="md" />
                <div className="text-left">
                  <div className="font-extrabold text-white text-base">{nickname}</div>
                  <div className="text-[11px] text-slate-400">{department || 'ผู้ร่วมการแข่งขัน'}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="text-[11px] text-amber-300 font-bold">คะแนนรวมสะสมของคุณ</div>
                <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">
                  {score} แต้ม
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLeaderboard(true)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <Trophy className="w-4 h-4" />
                <span>ดูกระดานคะแนนผู้นำทั้งหมด (Leaderboard)</span>
              </button>
            </div>

            <div className="text-xs text-slate-500">
              รอวิทยากร Host เปิดสังเวียนรอบใหม่
            </div>
          </div>
        )}

      </main>

      {/* Live Leaderboard Modal */}
      <LiveLeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        players={liveLeaderboard && liveLeaderboard.length > 0 ? liveLeaderboard : [{ id: participantId, nickname: nickname || 'ฉัน', department, score: score, avatarSeed }]}
        submissions={{}}
        currentQIndex={questionIndex}
        totalQuestions={totalQuestions}
        isHost={false}
      />

    </div>
  )
}
