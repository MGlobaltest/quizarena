import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import confetti from 'canvas-confetti'
import { 
  Users, Play, Sparkles, Trophy, ChevronRight, CheckCircle, 
  HelpCircle, Shuffle, ShieldCheck, Flame, RotateCcw, AlertTriangle,
  Coins, Radio, ArrowRight, Award, Crown, Home, ArrowLeft, X, BookOpen, Edit3, Clock, Maximize2
} from 'lucide-react'
import { supabase, isSupabaseConfigured, getAvatarUrl } from '../lib/supabaseClient'
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions'
import { sounds } from '../utils/soundEffects'
import DiceBearAvatar from '../components/DiceBearAvatar'
import SoundToggle from '../components/SoundToggle'
import SupabaseConfigModal from '../components/SupabaseConfigModal'
import QuizManagerModal from '../components/QuizManagerModal'
import ArenaPlayground from '../components/ArenaPlayground'
import EditPlayerModal from '../components/EditPlayerModal'
import LiveLeaderboardModal from '../components/LiveLeaderboardModal'
import LiveLeaderboardSidebar from '../components/LiveLeaderboardSidebar'
import QuestionTimerWidget from '../components/QuestionTimerWidget'
import { getDepartmentInfo } from '../constants/departments'

export default function HostPage() {
  const [roomCode, setRoomCode] = useState('ARENA88')
  const [roomId, setRoomId] = useState(null)
  const [gameStatus, setGameStatus] = useState('lobby') // 'lobby', 'question_active', 'speaker_locked', 'revealed', 'leaderboard', 'finished'
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  
  // Realtime Players & Submissions
  const [onlinePlayers, setOnlinePlayers] = useState([])
  const [simulatedBots, setSimulatedBots] = useState([])
  const [speaker, setSpeaker] = useState(null)
  const [isSpinningSpeaker, setIsSpinningSpeaker] = useState(false)
  const [submissions, setSubmissions] = useState({}) // { participantId: { ...data } }
  const [roundResult, setRoundResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  // Left Sidebar Leaderboard toggle state
  const [showLeaderboardSidebar, setShowLeaderboardSidebar] = useState(true)

  // Player Department & Custom Metadata
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false)
  const [showLiveLeaderboardModal, setShowLiveLeaderboardModal] = useState(false)
  const [playerCustomData, setPlayerCustomData] = useState(() => {
    try {
      const saved = localStorage.getItem('sba_player_custom_data')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const playerCustomDataRef = useRef(playerCustomData)
  const playerScoresRef = useRef({})

  useEffect(() => {
    playerCustomDataRef.current = playerCustomData
    if (playerCustomData) {
      Object.keys(playerCustomData).forEach(id => {
        if (playerCustomData[id]?.score !== undefined) {
          playerScoresRef.current[id] = playerCustomData[id].score
        }
      })
    }
  }, [playerCustomData])

  // Combined Active Players (Real presence + Simulated Bots)
  const allPlayers = [...onlinePlayers, ...simulatedBots]

  // Question Timer State (Defaults to 10s as requested)
  const [timerDuration, setTimerDuration] = useState(10)
  const [timeLeft, setTimeLeft] = useState(10)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerTriggerMode, setTimerTriggerMode] = useState('speaker') // 'speaker' | 'question'
  const [isTimeUp, setIsTimeUp] = useState(false)
  const timerIntervalRef = useRef(null)
  const timeLeftRef = useRef(10)
  const isTimerRunningRef = useRef(false)
  const timerDurationRef = useRef(10)
  const timerTriggerModeRef = useRef('speaker')
  const autoRevealOnTimeoutRef = useRef(true)
  const handleRevealAnswerRef = useRef(null)

  // Final Summary Tab: 'high_score' (คะแนนรวมสูงสุด + โบนัสความเร็ว) | 'correct_answers' (จำนวนข้อที่ถูกต้อง)
  const [finalSummaryTab, setFinalSummaryTab] = useState('high_score')

  useEffect(() => {
    timerDurationRef.current = timerDuration
  }, [timerDuration])

  useEffect(() => {
    timerTriggerModeRef.current = timerTriggerMode
  }, [timerTriggerMode])

  // Modal & Config
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const channelRef = useRef(null)

  const currentQuestion = questions[currentQIndex] || null

  // 1. Initialize Room in Supabase or Local
  useEffect(() => {
    initRoom()
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [roomCode])

  const initRoom = async () => {
    if (!isSupabaseConfigured()) {
      // Mock / Offline mode fallback
      setRoomId('mock-room-id')
      setupRealtimeChannel('mock-room-id')
      return
    }

    try {
      // Check if room exists or create one
      const { data: existingRoom, error: fetchErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .maybeSingle()

      let activeRoom = existingRoom

      if (!activeRoom) {
        // Create new room
        const { data: newRoom, error: createErr } = await supabase
          .from('rooms')
          .insert({
            code: roomCode,
            title: 'Super Bet Arena Live',
            status: 'lobby',
            current_question_index: 0
          })
          .select()
          .single()

        if (createErr) throw createErr
        activeRoom = newRoom

        // Insert default questions
        const questionsToInsert = DEFAULT_QUESTIONS.map(q => ({
          room_id: activeRoom.id,
          order_num: q.order_num,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          explanation: q.explanation
        }))

        await supabase.from('questions').insert(questionsToInsert)
      }

      setRoomId(activeRoom.id)
      setGameStatus(activeRoom.status || 'lobby')
      setCurrentQIndex(activeRoom.current_question_index || 0)

      // Fetch questions from DB
      const { data: dbQuestions } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('order_num', { ascending: true })

      if (dbQuestions && dbQuestions.length > 0) {
        setQuestions(dbQuestions)
      }

      setupRealtimeChannel(activeRoom.id)
    } catch (err) {
      console.error('Error initializing room:', err)
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อ Supabase ได้ (ใช้งานโหมด Offline/Realtime Channel)')
      setupRealtimeChannel('local-fallback')
    }
  }

  const isSubscribedRef = useRef(false)

  // 2. Setup Supabase Realtime Channel (Presence + Broadcast)
  const setupRealtimeChannel = (rId) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isSubscribedRef.current = false
    }

    const channelName = `arena_room_${roomCode}`
    // Remove any lingering channels with this name to prevent "cannot add presence callbacks after subscribe"
    try {
      const oldChannels = supabase.getChannels().filter(ch => ch.topic === `realtime:${channelName}`)
      oldChannels.forEach(ch => supabase.removeChannel(ch))
    } catch (e) {
      console.warn(e)
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: 'host' },
        broadcast: { ack: false }
      }
    })

    // Track Presence for connected players
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const playersList = []
      
      Object.keys(state).forEach(key => {
        if (key !== 'host') {
          state[key].forEach(p => {
            if (p.id) {
              const custom = playerCustomDataRef.current[p.id] || {}
              const resolvedScore = playerScoresRef.current[p.id] !== undefined
                ? playerScoresRef.current[p.id]
                : (custom.score !== undefined
                  ? custom.score
                  : (p.score !== undefined ? Number(p.score) : 0))

              playerScoresRef.current[p.id] = resolvedScore

              playersList.push({
                ...p,
                nickname: custom.nickname || p.nickname,
                department: custom.department !== undefined ? custom.department : (p.department || ''),
                teamColor: custom.teamColor || p.teamColor || '',
                score: resolvedScore
              })
            }
          })
        }
      })

      // Unique by ID
      const uniquePlayers = Array.from(new Map(playersList.map(item => [item.id, item])).values())
      setOnlinePlayers(uniquePlayers)
    })

    // Listen to Broadcast Events from Players
    channel.on('broadcast', { event: 'PLAYER_SUBMIT' }, ({ payload }) => {
      sounds.playTick()
      setSubmissions(prev => ({
        ...prev,
        [payload.participantId]: payload
      }))

      if (payload.score !== undefined && playerScoresRef.current[payload.participantId] === undefined) {
        playerScoresRef.current[payload.participantId] = Number(payload.score)
      }

      // If this submission is from the current Speaker, record their option
      if (payload.isSpeaker) {
        setSpeaker(prev => prev ? { ...prev, selectedOption: payload.selectedOption } : payload)
      }
    })

    channel.on('broadcast', { event: 'REQUEST_ROOM_SYNC' }, () => {
      // Sync current host state to requesting player
      broadcastState(channel)
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true
        channel.track({ role: 'host', time: Date.now() })
        broadcastState(channel)
      }
    })

    channelRef.current = channel
  }

  // Ref to always track latest host state across async callbacks & closures
  const latestStateRef = useRef({
    gameStatus: 'lobby',
    currentQIndex: 0,
    questions: DEFAULT_QUESTIONS,
    speaker: null,
    roomCode: 'ARENA88',
    allPlayers: []
  })

  // Always keep latestStateRef in sync with latest render state
  latestStateRef.current = {
    gameStatus,
    currentQIndex,
    questions,
    speaker,
    roomCode,
    allPlayers
  }

  // Question Countdown Timer Controllers
  const broadcastTimer = (duration, left, running, timeUp) => {
    if (channelRef.current) {
      const dur = duration !== undefined ? duration : timerDurationRef.current
      const tLeft = left !== undefined ? left : timeLeftRef.current
      const r = running !== undefined ? running : isTimerRunningRef.current
      const tUp = timeUp !== undefined ? timeUp : (tLeft <= 0)
      channelRef.current.send({
        type: 'broadcast',
        event: 'TIMER_UPDATE',
        payload: {
          duration: dur,
          timeLeft: tLeft,
          isRunning: r,
          isTimeUp: tUp,
          mode: timerTriggerModeRef.current
        }
      })
    }
  }

  const startTimer = (customDuration) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    const initialTime = customDuration !== undefined 
      ? customDuration 
      : (timeLeftRef.current > 0 ? timeLeftRef.current : timerDurationRef.current)
    
    timeLeftRef.current = initialTime
    setTimeLeft(initialTime)
    setIsTimeUp(initialTime <= 0)
    setIsTimerRunning(true)
    isTimerRunningRef.current = true

    broadcastTimer(timerDurationRef.current, initialTime, true, initialTime <= 0)

    timerIntervalRef.current = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
        timeLeftRef.current = 0
        setTimeLeft(0)
        setIsTimerRunning(false)
        isTimerRunningRef.current = false
        setIsTimeUp(true)
        sounds.playBuzzer()
        broadcastTimer(timerDurationRef.current, 0, false, true)

        // Automatically reveal answer after buzzer grace period (1.2s)
        if (autoRevealOnTimeoutRef.current) {
          setTimeout(() => {
            if (latestStateRef.current.gameStatus === 'question_active' && handleRevealAnswerRef.current) {
              handleRevealAnswerRef.current()
            }
          }, 1200)
        }
      } else {
        const next = timeLeftRef.current - 1
        timeLeftRef.current = next
        setTimeLeft(next)
        if (next <= 5 && next > 0) {
          sounds.playUrgentTick()
        }
        broadcastTimer(timerDurationRef.current, next, true, false)
      }
    }, 1000)
  }

  const pauseTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setIsTimerRunning(false)
    isTimerRunningRef.current = false
    broadcastTimer(timerDurationRef.current, timeLeftRef.current, false, timeLeftRef.current <= 0)
  }

  const resetTimer = (newDuration) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    const dur = newDuration !== undefined ? newDuration : timerDurationRef.current
    timeLeftRef.current = dur
    setTimeLeft(dur)
    setIsTimerRunning(false)
    isTimerRunningRef.current = false
    setIsTimeUp(false)
    broadcastTimer(dur, dur, false, false)
  }

  const addExtraTime = (seconds = 5) => {
    sounds.playPop()
    const next = timeLeftRef.current + seconds
    timeLeftRef.current = next
    setTimeLeft(next)
    setIsTimeUp(false)
    broadcastTimer(timerDurationRef.current, next, isTimerRunningRef.current, false)
  }

  const handleChangeDuration = (newSec) => {
    sounds.playTick()
    setTimerDuration(newSec)
    timerDurationRef.current = newSec
    resetTimer(newSec)
  }

  const handleChangeTriggerMode = (newMode) => {
    sounds.playPop()
    setTimerTriggerMode(newMode)
    timerTriggerModeRef.current = newMode
  }

  // Broadcast current state to all connected players
  const broadcastState = (channel = channelRef.current) => {
    if (!channel || !isSubscribedRef.current) return
    const cur = latestStateRef.current
    const curQ = cur.questions[cur.currentQIndex] || null
    const sortedLeaderboard = (cur.allPlayers || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0))

    channel.send({
      type: 'broadcast',
      event: 'STATE_SYNC',
      payload: {
        gameStatus: cur.gameStatus,
        roomCode: cur.roomCode,
        currentQuestion: curQ ? {
          order_num: curQ.order_num,
          question_text: curQ.question_text,
          option_a: curQ.option_a,
          option_b: curQ.option_b,
          option_c: curQ.option_c,
          option_d: curQ.option_d,
          total: cur.questions.length
        } : null,
        speaker: cur.speaker ? {
          id: cur.speaker.id,
          nickname: cur.speaker.nickname,
          avatar_url: cur.speaker.avatar_url,
          hasAnswered: Boolean(cur.speaker.selectedOption)
        } : null,
        currentQIndex: cur.currentQIndex,
        leaderboard: sortedLeaderboard,
        timer: {
          duration: timerDurationRef.current,
          timeLeft: timeLeftRef.current,
          isRunning: isTimerRunningRef.current,
          isTimeUp: timeLeftRef.current <= 0,
          mode: timerTriggerModeRef.current
        }
      }
    })
  }

  // When host gameStatus or speaker changes, broadcast to players
  useEffect(() => {
    broadcastState()
  }, [gameStatus, speaker, currentQIndex])

  // 3. Action: Random Speaker Selection (with Roulette Animation)
  const handleRandomSpeaker = () => {
    if (allPlayers.length === 0) {
      alert('ยังไม่มีผู้เล่นในห้อง ไม่สามารถสุ่ม Speaker ได้')
      return
    }

    setIsSpinningSpeaker(true)
    sounds.playTick()
    let spinCount = 0
    const maxSpins = 18

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allPlayers.length)
      const candidate = allPlayers[randomIndex]
      setSpeaker(candidate)
      sounds.playTick()
      spinCount++

      if (spinCount >= maxSpins) {
        clearInterval(interval)
        setIsSpinningSpeaker(false)
        const finalSpeaker = allPlayers[Math.floor(Math.random() * allPlayers.length)]
        setSpeaker(finalSpeaker)
        sounds.playPop()

        // Broadcast to all players that Speaker is selected
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'SPEAKER_SELECTED',
            payload: {
              speakerId: finalSpeaker.id,
              speakerName: finalSpeaker.nickname,
              avatar_url: finalSpeaker.avatar_url
            }
          })
        }

        // If trigger mode is 'speaker', start countdown immediately!
        if (timerTriggerModeRef.current === 'speaker') {
          startTimer(timerDurationRef.current)
        }
      }
    }, 100)
  }

  // Player Edit & Team / Department Handlers
  const handleOpenEditPlayer = (player) => {
    setEditingPlayer(player)
    setShowEditPlayerModal(true)
  }

  const handleSavePlayerEdit = async (playerId, updatedInfo) => {
    if (updatedInfo.score !== undefined) {
      playerScoresRef.current[playerId] = Number(updatedInfo.score)
    }

    // 1. Update persistent custom map
    setPlayerCustomData((prev) => {
      const next = { ...prev, [playerId]: { ...prev[playerId], ...updatedInfo } }
      try {
        localStorage.setItem('sba_player_custom_data', JSON.stringify(next))
      } catch (e) {
        console.warn(e)
      }
      return next
    })

    // 2. Update real players
    setOnlinePlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            nickname: updatedInfo.nickname || p.nickname,
            department: updatedInfo.department !== undefined ? updatedInfo.department : p.department,
            teamColor: updatedInfo.teamColor || p.teamColor,
            score: updatedInfo.score !== undefined ? updatedInfo.score : p.score
          }
        }
        return p
      })
    )

    // 3. Update simulated bots if bot
    setSimulatedBots((prev) =>
      prev.map((b) => {
        if (b.id === playerId) {
          return {
            ...b,
            nickname: updatedInfo.nickname || b.nickname,
            department: updatedInfo.department !== undefined ? updatedInfo.department : b.department,
            teamColor: updatedInfo.teamColor || b.teamColor,
            score: updatedInfo.score !== undefined ? updatedInfo.score : b.score
          }
        }
        return b
      })
    )

    // 4. Update speaker if it was this player
    setSpeaker((prev) => {
      if (prev && prev.id === playerId) {
        return {
          ...prev,
          nickname: updatedInfo.nickname || prev.nickname,
          department: updatedInfo.department !== undefined ? updatedInfo.department : prev.department
        }
      }
      return prev
    })

    // 5. Broadcast to player's mobile device
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAYER_UPDATED',
        payload: {
          id: playerId,
          nickname: updatedInfo.nickname,
          department: updatedInfo.department,
          teamColor: updatedInfo.teamColor,
          score: updatedInfo.score
        }
      })
    }

    // 6. If connected to Supabase, update database
    if (isSupabaseConfigured() && roomId) {
      try {
        await supabase
          .from('participants')
          .update({
            nickname: updatedInfo.nickname,
            score: updatedInfo.score || 100
          })
          .eq('id', playerId)
      } catch (err) {
        console.warn('DB participant update:', err)
      }
    }

    // 7. Sync updated leaderboard to all connected clients
    setTimeout(() => {
      broadcastState()
    }, 50)
  }

  // Simulated Bots testing helpers
  const handleAddSimulatedBot = () => {
    sounds.playPop()
    const botNames = ['น้องพลอย', 'พี่ก้อง', 'แนนซี่', 'ต้อมคุง', 'กิ๊ฟซ่า', 'บอสใหญ่', 'อาร์มมี่', 'น้องมายด์', 'พี่เอก', 'จอย']
    const depts = [
      'ฝ่ายขาย (Sales)', 
      'ไอที & เทค (IT & Tech)', 
      'การตลาด (Marketing)', 
      'ฝ่ายบุคคล (HR)', 
      'บัญชี & การเงิน (Finance)', 
      'ผู้บริหาร (Management)', 
      'ปฏิบัติการ (Operations)'
    ]
    
    const count = simulatedBots.length + 1
    const chosenName = botNames[(count - 1) % botNames.length] + ' #' + count
    const chosenDept = depts[(count - 1) % depts.length]
    const deptInfo = getDepartmentInfo(chosenDept)
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

    const newBot = {
      id: botId,
      nickname: chosenName,
      avatar_url: getAvatarUrl(chosenName),
      score: 0,
      department: chosenDept,
      teamColor: deptInfo ? deptInfo.color : ''
    }

    setSimulatedBots((prev) => [...prev, newBot])
  }

  const handleClearSimulatedBots = () => {
    sounds.playTick()
    setSimulatedBots([])
  }

  // Simulated Bots automated answering in demo mode
  useEffect(() => {
    if (gameStatus === 'question_active' && simulatedBots.length > 0) {
      const options = ['A', 'B', 'C', 'D']
      const timer = setTimeout(() => {
        setSubmissions(prev => {
          const next = { ...prev }
          simulatedBots.forEach(bot => {
            if (!next[bot.id]) {
              const randOpt = options[Math.floor(Math.random() * options.length)]
              const botTimeLeft = Math.max(1, Math.floor(Math.random() * (timerDurationRef.current || 10)))
              next[bot.id] = {
                participantId: bot.id,
                nickname: bot.nickname,
                avatarUrl: bot.avatar_url,
                selectedOption: randOpt,
                timeLeftAtSubmit: botTimeLeft,
                timerDuration: timerDurationRef.current || 10,
                isSpeaker: Boolean(speaker && speaker.id === bot.id),
                department: bot.department || '',
                score: bot.score || 0
              }
            }
          })
          return next
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameStatus, currentQIndex, simulatedBots.length])

  // 4. Action: Start Game (From Lobby to Question 1)
  const handleStartGame = async () => {
    sounds.playWin()
    setGameStatus('question_active')
    setSubmissions({})
    setSpeaker(null)
    setRoundResult(null)

    if (timerTriggerModeRef.current === 'question') {
      startTimer(timerDurationRef.current)
    } else {
      resetTimer()
    }

    if (isSupabaseConfigured() && roomId) {
      await supabase
        .from('rooms')
        .update({ status: 'question_active', current_question_index: 0 })
        .eq('id', roomId)
    }
  }

  // 5. Action: Reveal Answer and Settle Round
  const handleRevealAnswer = async () => {
    if (!currentQuestion) return

    // Stop timer when answer is revealed
    pauseTimer()

    sounds.playWin()
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    const correctOpt = currentQuestion.correct_option
    const isSpeakerCorrect = Boolean(speaker && speaker.selectedOption && speaker.selectedOption === correctOpt)

    // Calculate updated score for every player (both real users and simulated bots)
    const updatedPlayers = allPlayers.map(p => {
      // Find submission by id or fallback to nickname
      const sub = submissions[p.id] || Object.values(submissions).find(s => s.participantId === p.id || s.nickname === p.nickname)
      const isPlayerCorrect = Boolean(sub && sub.selectedOption === correctOpt)

      let earnedPoints = 0
      let speedBonus = 0

      if (isPlayerCorrect) {
        const timeLeftAtSubmit = sub?.timeLeftAtSubmit !== undefined ? sub.timeLeftAtSubmit : 0
        const totalDur = sub?.timerDuration || timerDurationRef.current || 10
        const speedRatio = Math.max(0, Math.min(1, timeLeftAtSubmit / totalDur))
        speedBonus = Math.round(speedRatio * 500)
        earnedPoints = 500 + speedBonus
      }

      // Base score priority: playerScoresRef -> playerCustomData -> p.score -> 0
      const currentScore = playerScoresRef.current[p.id] !== undefined
        ? Number(playerScoresRef.current[p.id])
        : (playerCustomDataRef.current[p.id]?.score !== undefined
          ? Number(playerCustomDataRef.current[p.id].score)
          : (p.score !== undefined ? Number(p.score) : 0))

      const newScore = Math.max(0, currentScore + earnedPoints)
      playerScoresRef.current[p.id] = newScore

      // Track correct questions count (คะแนนข้อที่ถูกต้อง)
      const prevCorrectCount = playerCustomDataRef.current[p.id]?.correctCount !== undefined
        ? Number(playerCustomDataRef.current[p.id].correctCount)
        : (p.correctCount !== undefined ? Number(p.correctCount) : 0)
      const newCorrectCount = prevCorrectCount + (isPlayerCorrect ? 1 : 0)

      return {
        ...p,
        score: newScore,
        correctCount: newCorrectCount,
        lastRoundNet: earnedPoints,
        lastRoundSpeedBonus: speedBonus,
        lastRoundCorrect: isPlayerCorrect
      }
    }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

    setLeaderboard(updatedPlayers)

    // Persist updated scores & correct counts into playerCustomData and localStorage
    setPlayerCustomData(prev => {
      const next = { ...prev }
      updatedPlayers.forEach(u => {
        next[u.id] = {
          ...(next[u.id] || {}),
          score: u.score,
          correctCount: u.correctCount,
          lastRoundNet: u.lastRoundNet
        }
      })
      playerCustomDataRef.current = next
      try {
        localStorage.setItem('sba_player_custom_data', JSON.stringify(next))
      } catch (e) {}
      return next
    })

    // Update onlinePlayers with new scores & correct counts
    setOnlinePlayers(prev => prev.map(p => {
      const found = updatedPlayers.find(u => u.id === p.id)
      return found ? { ...p, score: found.score, correctCount: found.correctCount, lastRoundNet: found.lastRoundNet } : p
    }))

    // Update simulatedBots with new scores & correct counts
    setSimulatedBots(prev => prev.map(b => {
      const found = updatedPlayers.find(u => u.id === b.id)
      return found ? { ...b, score: found.score, correctCount: found.correctCount, lastRoundNet: found.lastRoundNet } : b
    }))

    const settlementData = {
      correct_option: correctOpt,
      is_speaker_correct: isSpeakerCorrect,
      explanation: currentQuestion.explanation,
      leaderboard: updatedPlayers
    }

    setRoundResult(settlementData)
    setGameStatus('revealed')

    // Broadcast ROUND_REVEAL with updated leaderboard to all players
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'ROUND_REVEAL',
        payload: {
          correctOption: correctOpt,
          explanation: currentQuestion.explanation,
          isSpeakerCorrect,
          leaderboard: updatedPlayers
        }
      })
    }

    // Update Supabase DB in background if configured
    if (isSupabaseConfigured() && roomId) {
      updatedPlayers.forEach(async (u) => {
        try {
          await supabase
            .from('participants')
            .update({ score: u.score })
            .eq('id', u.id)
        } catch (err) {
          console.warn('DB participant score update:', err)
        }
      })
      try {
        await supabase
          .from('rooms')
          .update({ status: 'revealed' })
          .eq('id', roomId)
      } catch (err) {}
    }
  }

  // Keep handleRevealAnswerRef always updated with latest closure
  handleRevealAnswerRef.current = handleRevealAnswer

  // 6. Action: Next Question
  const handleNextQuestion = async () => {
    if (currentQIndex + 1 < questions.length) {
      const nextIdx = currentQIndex + 1
      const nextQ = questions[nextIdx]
      setCurrentQIndex(nextIdx)
      setGameStatus('question_active')
      setSubmissions({})
      setSpeaker(null)
      setRoundResult(null)

      if (timerTriggerModeRef.current === 'question') {
        startTimer(timerDurationRef.current)
      } else {
        resetTimer()
      }

      // Immediately synchronize ref
      latestStateRef.current.currentQIndex = nextIdx
      latestStateRef.current.gameStatus = 'question_active'
      latestStateRef.current.speaker = null

      if (isSupabaseConfigured() && roomId) {
        await supabase
          .from('rooms')
          .update({
            status: 'question_active',
            current_question_index: nextIdx,
            speaker_id: null,
            speaker_name: null
          })
          .eq('id', roomId)
      }

      if (channelRef.current) {
        const sortedLeaderboard = allPlayers.slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        channelRef.current.send({
          type: 'broadcast',
          event: 'NEXT_ROUND',
          payload: {
            roundIndex: nextIdx,
            total: questions.length,
            gameStatus: 'question_active',
            leaderboard: sortedLeaderboard,
            currentQuestion: {
              order_num: nextQ.order_num,
              question_text: nextQ.question_text,
              option_a: nextQ.option_a,
              option_b: nextQ.option_b,
              option_c: nextQ.option_c,
              option_d: nextQ.option_d,
              total: questions.length
            }
          }
        })
      }
    } else {
      // Game Finished
      pauseTimer()
      resetTimer()
      setGameStatus('finished')
      latestStateRef.current.gameStatus = 'finished'
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } })
    }
  }

  // 7. Action: Return to Lobby (Preserves joined participants and scores)
  const handleReturnToLobby = async (askConfirm = true) => {
    if (askConfirm && gameStatus !== 'lobby') {
      const ok = window.confirm('ต้องการกลับไปยังหน้า Lobby หรือไม่? (รายชื่อผู้เล่นและคะแนนสะสมจะยังคงอยู่ครบถ้วน)')
      if (!ok) return
    }
    sounds.playPop()
    pauseTimer()
    resetTimer()
    setGameStatus('lobby')
    setSubmissions({})
    setSpeaker(null)
    setRoundResult(null)
    setShowPlayersModal(false)

    if (isSupabaseConfigured() && roomId) {
      await supabase
        .from('rooms')
        .update({ status: 'lobby' })
        .eq('id', roomId)
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'STATE_SYNC',
        payload: {
          gameStatus: 'lobby',
          roomCode,
          currentQuestion: null,
          speaker: null,
          currentQIndex
        }
      })
    }
  }

  // 8. Action: Reset Game to Question 1
  const handleResetGame = () => {
    setCurrentQIndex(0)
    setPlayerCustomData(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => {
        next[k] = { ...next[k], score: 0, correctCount: 0 }
      })
      playerCustomDataRef.current = next
      try {
        localStorage.setItem('sba_player_custom_data', JSON.stringify(next))
      } catch (e) {}
      return next
    })
    playerScoresRef.current = {}
    setOnlinePlayers(prev => prev.map(p => ({ ...p, score: 0, correctCount: 0 })))
    setSimulatedBots(prev => prev.map(b => ({ ...b, score: 0, correctCount: 0 })))
    handleReturnToLobby(false)
  }

  // 9. Action: Reset answers for the current active question
  const handleResetCurrentQuestion = async () => {
    const ok = window.confirm('ต้องการรีเซ็ตคำตอบของข้อนี้ เพื่อให้ผู้เล่นทุกคนเลือกช้อยส์และส่งคำตอบใหม่หรือไม่?')
    if (!ok) return

    sounds.playPop()
    setSubmissions({})
    setSpeaker(null)
    setRoundResult(null)
    setGameStatus('question_active')

    if (timerTriggerModeRef.current === 'question') {
      startTimer(timerDurationRef.current)
    } else {
      resetTimer()
    }

    latestStateRef.current.gameStatus = 'question_active'
    latestStateRef.current.speaker = null

    if (isSupabaseConfigured() && roomId && currentQuestion?.id) {
      try {
        await supabase
          .from('round_submissions')
          .delete()
          .eq('question_id', currentQuestion.id)

        await supabase
          .from('rooms')
          .update({
            status: 'question_active',
            speaker_id: null,
            speaker_name: null
          })
          .eq('id', roomId)
      } catch (err) {
        console.warn('DB reset error:', err)
      }
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'ROUND_RESET',
        payload: {
          roundIndex: currentQIndex,
          questionId: currentQuestion?.id
        }
      })
    }
  }

  // 10. Action: Save / Upload / Switch Quiz Questions Set
  const handleSaveQuizSet = async (newQuestions, title = 'ชุดคำถามใหม่') => {
    sounds.playWin()
    setQuestions(newQuestions)
    setCurrentQIndex(0)
    setGameStatus('lobby')
    setSubmissions({})
    setSpeaker(null)
    setRoundResult(null)

    setPlayerCustomData(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => {
        next[k] = { ...next[k], correctCount: 0 }
      })
      playerCustomDataRef.current = next
      try {
        localStorage.setItem('sba_player_custom_data', JSON.stringify(next))
      } catch (e) {}
      return next
    })
    setOnlinePlayers(prev => prev.map(p => ({ ...p, correctCount: 0 })))
    setSimulatedBots(prev => prev.map(b => ({ ...b, correctCount: 0 })))

    latestStateRef.current.questions = newQuestions
    latestStateRef.current.currentQIndex = 0
    latestStateRef.current.gameStatus = 'lobby'
    latestStateRef.current.speaker = null

    if (isSupabaseConfigured() && roomId) {
      try {
        // Delete old questions
        await supabase.from('questions').delete().eq('room_id', roomId)
        
        // Insert new questions
        const toInsert = newQuestions.map(q => ({
          room_id: roomId,
          order_num: q.order_num,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          explanation: q.explanation || ''
        }))
        await supabase.from('questions').insert(toInsert)

        // Reset room
        await supabase
          .from('rooms')
          .update({
            status: 'lobby',
            current_question_index: 0,
            speaker_id: null,
            speaker_name: null,
            title
          })
          .eq('id', roomId)
      } catch (err) {
        console.warn('Error updating questions in Supabase:', err)
      }
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'STATE_SYNC',
        payload: {
          gameStatus: 'lobby',
          roomCode,
          currentQuestion: null,
          speaker: null,
          currentQIndex: 0
        }
      })
    }
  }

  // 11. Action: Reset All Questions back to Default
  const handleResetAllQuestions = async () => {
    const ok = window.confirm('ต้องการรีเซ็ตชุดคำถามทั้งหมดกลับเป็นชุดเริ่มต้น (5 ข้อหลัก) และเริ่มข้อที่ 1 ใหม่หรือไม่?')
    if (!ok) return

    sounds.playWin()
    await handleSaveQuizSet(DEFAULT_QUESTIONS, 'ชุดคำถามเริ่มต้น (5 ข้อหลัก)')
  }

  // Helper: Group submissions into choices A, B, C, D
  const getSubmissionsForOption = (optionLetter) => {
    return Object.values(submissions).filter(sub => sub.selectedOption === optionLetter)
  }

  // Mobile QR Code URL Configuration (Defaults to LAN IP on localhost)
  const [customOrigin, setCustomOrigin] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sba_custom_origin')
      if (saved) return saved
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      if (isLocal) {
        return `http://192.168.1.110:${window.location.port || '5173'}`
      }
      return window.location.origin
    }
    return 'http://192.168.1.110:5173'
  })
  const [isEditingUrl, setIsEditingUrl] = useState(false)

  const handleUpdateOrigin = (newUrl) => {
    const clean = newUrl.trim().replace(/\/$/, '')
    setCustomOrigin(clean)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sba_custom_origin', clean)
    }
  }

  const joinUrl = `${customOrigin}/#/play?room=${roomCode}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-black text-lg tracking-wider">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-base tracking-tight m-0">Super Bet Arena</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                HOST SCREEN
              </span>
            </div>
            <p className="text-xs text-slate-400">สังเวียนเดิมพันปัญญา & ประลองความรู้ Realtime</p>
          </div>
        </div>

        {/* Room & Status Badges */}
        <div className="flex items-center gap-3">
          {/* Link back to Main Portal */}
          <Link
            to="/portal"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="หน้าหลัก Portal กลาง (/portal)"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* Button to Return to Lobby when not in lobby */}
          {gameStatus !== 'lobby' && (
            <button
              onClick={() => handleReturnToLobby(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition cursor-pointer"
              title="กลับไปหน้า Lobby ที่แสดงผู้เข้าร่วมทั้งหมด"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้า Lobby</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-xs text-slate-400">ROOM:</span>
            <span className="font-black text-emerald-400 text-sm tracking-wider font-mono">{roomCode}</span>
          </div>

          {/* Clickable Participant Counter Button that opens the Players Modal */}
          <button
            onClick={() => setShowPlayersModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="คลิกเพื่อดูรายชื่อผู้เข้าร่วมทั้งหมด"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold">{allPlayers.length} ผู้เล่น</span>
          </button>

          {/* Button to Open Quiz Manager / Lessons Modal */}
          <button
            onClick={() => setShowQuizModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
            title="เปลี่ยนบทเรียน / คลังข้อสอบ"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">เปลี่ยนบทเรียน / ข้อสอบ</span>
            <span className="sm:hidden">ข้อสอบ</span>
          </button>

          {/* Button to Reset All Questions to Default */}
          <button
            onClick={handleResetAllQuestions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            title="รีเซ็ตชุดคำถามทั้งหมดกลับเป็นค่าเริ่มต้น (5 ข้อหลัก) และเริ่มข้อที่ 1 ใหม่"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">รีเซ็ตชุดคำถามใหม่</span>
            <span className="md:hidden">รีเซ็ต</span>
          </button>

          <SoundToggle />

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Supabase Setup</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-[1650px] w-full mx-auto flex flex-col">

        {/* ========================================================= */}
        {/* VIEW 1: LOBBY SCREEN (QR Code + Participant Avatars)      */}
        {/* ========================================================= */}
        {gameStatus === 'lobby' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
            
            {/* Left Column: QR Code & Join Instructions */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>เปิดรับผู้เล่นเข้าห้องแล้ว</span>
              </div>

              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">สแกนเพื่อเข้าร่วม</h2>
              <p className="text-xs text-slate-400 mb-4">ใช้กล้องมือถือสแกน QR Code เพื่อเปิดหน้า /play</p>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-purple-500/30 mb-4 hover:scale-105 transition-transform duration-300">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Room Code Callout */}
              <div className="w-full p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-semibold uppercase">รหัสห้อง (Room Code)</span>
                <span className="text-2xl font-black text-emerald-400 font-mono tracking-widest">{roomCode}</span>
              </div>

              {/* Network Wi-Fi / IP Configuration */}
              <div className="w-full p-3 rounded-2xl bg-purple-950/20 border border-purple-800/40 text-left mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                    <span>📡 URL สำหรับมือถือ (Wi-Fi):</span>
                  </span>
                  <button
                    onClick={() => setIsEditingUrl(!isEditingUrl)}
                    className="text-[11px] text-purple-400 hover:text-purple-200 underline cursor-pointer"
                  >
                    {isEditingUrl ? 'เสร็จสิ้น' : 'แก้ไข IP'}
                  </button>
                </div>

                {isEditingUrl ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={customOrigin}
                      onChange={(e) => handleUpdateOrigin(e.target.value)}
                      placeholder="http://192.168.1.110:5173"
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-purple-600 rounded-xl text-white font-mono focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      💡 ใส่ IP ของคอมพิวเตอร์ หรือ Domain/Tunnel (เช่น ngrok)
                    </p>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-emerald-400 break-all select-all">
                    {joinUrl}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-1">
                  * มือถือต้องเชื่อมต่อ Wi-Fi เดียวกันกับเครื่องคอมพิวเตอร์
                </div>
              </div>

              {/* Start Game Button */}
              <button
                onClick={handleStartGame}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>เริ่มการแข่งขัน (Start Arena)</span>
              </button>
            </div>

            {/* Right Column: Interactive Virtual Arena Playground */}
            <div className="lg:col-span-7 flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span>สังเวียนตัวละคร ({allPlayers.length} คน)</span>
                  </h3>
                  <p className="text-xs text-slate-400">ตัวละครเคลื่อนไหวสด • คลิกที่ตัวละครเพื่อเปลี่ยนชื่อหรือจัดทีม/แผนก</p>
                </div>
                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  แข่งขันสะสมคะแนน & โบนัสความเร็ว
                </div>
              </div>

              <ArenaPlayground
                players={allPlayers}
                onEditPlayer={handleOpenEditPlayer}
                onAddSimulatedBot={handleAddSimulatedBot}
                onClearSimulatedBots={handleClearSimulatedBots}
                simulatedBotCount={simulatedBots.length}
              />
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: QUESTION & 4-BOX ARENA (Active / Revealed)        */}
        {/* ========================================================= */}
        {(gameStatus === 'question_active' || gameStatus === 'revealed') && currentQuestion && (
          <div className="flex-1 flex flex-col gap-4 py-2">
            
            {/* 1. TOP COMMAND STATION: SPEAKER SPOTLIGHT & INTEGRATED TIMER (5s & 10s) */}
            <div className="p-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-800/40 rounded-3xl shadow-xl flex flex-col gap-3 backdrop-blur-md">
              
              {/* TOP ROW: SPEAKER SPOTLIGHT (LEFT) + TIMER CONTROLLER (RIGHT) */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                
                {/* Left: Speaker Spotlight & Random Speaker Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-md">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                        ตัวแทนตอบประจำข้อ (Speaker Spotlight)
                      </div>
                      {speaker ? (
                        <div className="flex items-center gap-2.5 mt-0.5 min-w-0">
                          <DiceBearAvatar seed={speaker.nickname} url={speaker.avatar_url} size="sm" />
                          <div className="min-w-0">
                            <span className="font-extrabold text-white text-sm sm:text-base truncate">{speaker.nickname}</span>
                            {speaker.selectedOption ? (
                              <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ✓ เลือกช้อยส์ {speaker.selectedOption} แล้ว
                              </span>
                            ) : (
                              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                กำลังคิดคำตอบ...
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">ยังไม่ได้เลือก Speaker ประจำข้อนี้</p>
                      )}
                    </div>
                  </div>

                  {/* Speaker Action Button */}
                  <button
                    onClick={handleRandomSpeaker}
                    disabled={isSpinningSpeaker || gameStatus === 'revealed'}
                    className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer shrink-0 ${
                      isSpinningSpeaker
                        ? 'bg-purple-700 text-purple-200 animate-spin'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>{speaker ? 'สุ่ม Speaker ใหม่' : 'สุ่มตัวแทนตอบ (Random Speaker)'}</span>
                  </button>
                </div>

                {/* Vertical divider on desktop */}
                <div className="hidden lg:block w-px h-12 bg-slate-800 mx-1" />

                {/* Right: Integrated Countdown Timer Widget (Presets: 5s & 10s only) */}
                <div className="shrink-0">
                  <QuestionTimerWidget
                    duration={timerDuration}
                    timeLeft={timeLeft}
                    isRunning={isTimerRunning}
                    isTimeUp={isTimeUp}
                    triggerMode={timerTriggerMode}
                    onStart={() => startTimer()}
                    onPause={pauseTimer}
                    onReset={() => resetTimer()}
                    onAddExtra={() => addExtraTime(5)}
                    onChangeDuration={handleChangeDuration}
                    onChangeTriggerMode={handleChangeTriggerMode}
                    speakerSelected={Boolean(speaker)}
                  />
                </div>

              </div>

              {/* BOTTOM ROW: ACTION TOOLBAR */}
              <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                
                {/* Secondary controls */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleReturnToLobby(true)}
                    className="px-3 py-1.5 rounded-xl font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    title="กลับไปยังหน้า Lobby ที่แสดงผู้เข้าร่วมและ QR Code"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>ดูผู้เข้าร่วม / Lobby</span>
                  </button>

                  <button
                    onClick={handleResetCurrentQuestion}
                    className="px-3 py-1.5 rounded-xl font-bold bg-slate-800/90 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 text-slate-400 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    title="รีเซ็ตคำตอบและเดิมพันของข้อนี้ เพื่อให้เริ่มตอบใหม่"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตคำตอบข้อนี้</span>
                  </button>

                  <button
                    onClick={handleResetAllQuestions}
                    className="px-3 py-1.5 rounded-xl font-bold bg-slate-800/90 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 text-slate-400 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    title="รีเซ็ตชุดคำถามทั้งหมดกลับเป็นค่าเริ่มต้น (5 ข้อหลัก) และเริ่มข้อที่ 1 ใหม่"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                    <span>รีเซ็ตชุดคำถามใหม่</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playPop()
                      setShowLeaderboardSidebar(prev => !prev)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer border shadow-sm ${
                      showLeaderboardSidebar
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title="เปิด/ปิด กระดานคะแนนเรียงลำดับทางด้านซ้ายของจอ"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showLeaderboardSidebar ? 'กระดานซ้าย (เปิดอยู่)' : 'เปิดกระดานซ้าย'}</span>
                  </button>

                  <button
                    onClick={() => setShowLiveLeaderboardModal(true)}
                    className="px-3 py-1.5 rounded-xl font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition cursor-pointer"
                    title="เปิดกระดานคะแนนแบบเต็มจอ (Full Modal)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>ขยายเต็มจอ</span>
                  </button>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-2 ml-auto">
                  {gameStatus === 'question_active' ? (
                    <button
                      onClick={handleRevealAnswer}
                      className="px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>เฉลยคำตอบ (Reveal Answer)</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                    >
                      <span>{currentQIndex + 1 < questions.length ? 'ข้อถัดไป' : 'สรุปผลคะแนน'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>

            </div>

            {/* 2. QUESTION CARD (คำถาม) */}
            <div className="p-5 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  คำถามข้อที่ {currentQIndex + 1} / {questions.length}
                </span>

                {/* Submissions counter */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ส่งคำตอบแล้ว: {Object.keys(submissions).length} / {allPlayers.length || 1} คน</span>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white leading-snug tracking-tight">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* 3. MAIN STAGE: LEFT LEADERBOARD SIDEBAR + RIGHT 4-BOX CHOICES (คำตอบอยู่ติดกันกับคำถาม) */}
            <div className="flex-1 flex flex-col lg:flex-row gap-5 items-stretch min-h-0">
              
              {/* LEFT COLUMN: LIVE LEADERBOARD SIDEBAR */}
              {showLeaderboardSidebar && (
                <div className="w-full lg:w-80 xl:w-[360px] shrink-0 flex flex-col transition-all">
                  <LiveLeaderboardSidebar
                    players={leaderboard.length > 0 && gameStatus === 'revealed' ? leaderboard : allPlayers}
                    submissions={submissions}
                    currentQIndex={currentQIndex}
                    totalQuestions={questions.length}
                    isRevealed={gameStatus === 'revealed'}
                    onEditPlayer={handleOpenEditPlayer}
                    onExpandModal={() => setShowLiveLeaderboardModal(true)}
                  />
                </div>
              )}

              {/* RIGHT COLUMN: 4-BOX CHOICES & EXPLANATION BANNER */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                
                {/* 4-Box Grid (A, B, C, D) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {[
                    { letter: 'A', text: currentQuestion.option_a, color: 'border-indigo-600/40 bg-indigo-950/20', tagBg: 'bg-indigo-500' },
                    { letter: 'B', text: currentQuestion.option_b, color: 'border-blue-600/40 bg-blue-950/20', tagBg: 'bg-blue-500' },
                    { letter: 'C', text: currentQuestion.option_c, color: 'border-amber-600/40 bg-amber-950/20', tagBg: 'bg-amber-500' },
                    { letter: 'D', text: currentQuestion.option_d, color: 'border-rose-600/40 bg-rose-950/20', tagBg: 'bg-rose-500' },
                  ].map(opt => {
                    const boxSubs = getSubmissionsForOption(opt.letter)
                    const isCorrect = currentQuestion.correct_option === opt.letter
                    const isRevealed = gameStatus === 'revealed'
                    const isSpeakerChoice = speaker?.selectedOption === opt.letter

                    // Card Styles based on Reveal State
                    let boxClass = `p-5 rounded-3xl border-2 transition-all duration-500 flex flex-col justify-between min-h-[175px] shadow-xl ${opt.color}`
                    if (isRevealed) {
                      if (isCorrect) {
                        boxClass = 'p-5 rounded-3xl border-3 border-emerald-400 bg-emerald-950/40 neon-border-emerald scale-[1.01] shadow-2xl flex flex-col justify-between min-h-[175px]'
                      } else {
                        boxClass = 'p-5 rounded-3xl border-2 border-slate-800 bg-slate-900/30 opacity-40 flex flex-col justify-between min-h-[175px]'
                      }
                    }

                    return (
                      <div key={opt.letter} className={boxClass}>
                        
                        {/* Option Header */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-xl ${opt.tagBg} text-white font-black text-base flex items-center justify-center shadow-md shrink-0`}>
                                {opt.letter}
                              </span>
                              <span className="text-base md:text-lg font-bold text-white tracking-tight leading-snug">
                                {opt.text}
                              </span>
                            </div>

                            {/* Speaker Choice Badge */}
                            {isSpeakerChoice && (
                              <div className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/50 text-xs font-bold flex items-center gap-1 shadow-md animate-pulse shrink-0">
                                <span>🎤 ตัวแทนเลือก</span>
                              </div>
                            )}

                            {/* Correct Mark Badge */}
                            {isRevealed && isCorrect && (
                              <div className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shrink-0">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>คำตอบที่ถูกต้อง</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* LIVE AVATARS OF PLAYERS WHO PICKED THIS OPTION */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-semibold">
                            <span>ผู้เล่นที่เลือกช้อยส์นี้ ({boxSubs.length} คน)</span>
                            <span>{allPlayers.length > 0 ? Math.round((boxSubs.length / allPlayers.length) * 100) : 0}%</span>
                          </div>

                          {boxSubs.length === 0 ? (
                            <div className="text-xs text-slate-600 italic py-1">ยังไม่มีใครเลือกตัวเลือกนี้</div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {boxSubs.map(sub => {
                                const custom = playerCustomData[sub.participantId] || {}
                                const deptName = custom.department || sub.department || ''
                                const deptInfo = getDepartmentInfo(deptName)
                                const displayNick = custom.nickname || sub.nickname
                                return (
                                  <div
                                    key={sub.participantId}
                                    title={`${displayNick} ${deptName ? `[${deptName}]` : ''} (${sub.betTarget === 'SPEAKER_CORRECT' ? 'เชื่อมั่น' : 'ไม่เชื่อ'})`}
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-slate-800/80 border border-slate-700 shadow-sm animate-pulse-subtle"
                                  >
                                    <DiceBearAvatar seed={displayNick} url={sub.avatarUrl} size="xs" />
                                    <span className="text-xs font-bold text-white">{displayNick}</span>
                                    {deptInfo && (
                                      <span className={`text-[8px] px-1 py-0.2 rounded-full font-bold border truncate max-w-[70px] ${deptInfo.badgeClass}`}>
                                        {deptInfo.shortName}
                                      </span>
                                    )}
                                    {sub.isSpeaker && (
                                      <span className="text-[10px] text-purple-400 font-extrabold">🎤</span>
                                    )}
                                    {sub.betAmount > 0 && (
                                      <span className="text-[10px] font-semibold text-amber-400">💰{sub.betAmount}</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                      </div>
                    )
                  })}
                </div>

                {/* EXPLANATION BANNER (When Revealed) */}
                {gameStatus === 'revealed' && currentQuestion.explanation && (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3 shadow-lg">
                    <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs mb-0.5">คำอธิบายความรู้ประจำข้อ:</h4>
                      <p className="text-slate-300 text-xs leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PODIUM & FINAL LEADERBOARD (DUAL TOPIC SUMMARY)  */}
        {/* ========================================================= */}
        {gameStatus === 'finished' && (() => {
          // 1. High Score Champions (คะแนนรวมสูงสุด: แต้มฐาน + โบนัสความเร็ว)
          const highScoreRanked = [...allPlayers].sort((a, b) => {
            const scoreDiff = (b.score || 0) - (a.score || 0)
            if (scoreDiff !== 0) return scoreDiff
            return (b.correctCount || 0) - (a.correctCount || 0)
          })

          // 2. Accuracy Ranked Players (จำนวนข้อที่ตอบถูกต้อง)
          const accuracyRanked = [...allPlayers].sort((a, b) => {
            const correctDiff = (b.correctCount || 0) - (a.correctCount || 0)
            if (correctDiff !== 0) return correctDiff
            return (b.score || 0) - (a.score || 0)
          })

          const isHighScore = finalSummaryTab === 'high_score'
          const currentRanked = isHighScore ? highScoreRanked : accuracyRanked
          const top1 = currentRanked[0]
          const top2 = currentRanked[1]
          const top3 = currentRanked[2]

          return (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center max-w-5xl mx-auto w-full">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold mb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>ARENA VICTORY PODIUM • บทสรุปผลการแข่งขัน</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                สรุปผลคะแนนสังเวียน Super Bet Arena
              </h2>
              <p className="text-sm text-slate-400 mb-6 max-w-xl">
                บทสรุปผู้ชนะ: จัดอันดับตามคะแนนรวมสูงสุด (ความรู้ + ความเร็ว) และความแม่นยำในการตอบ
              </p>

              {/* DUAL CATEGORY SWITCHER TABS */}
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl mb-8">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop()
                    setFinalSummaryTab('high_score')
                  }}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                    isHighScore
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>1. คะแนนรวมสูงสุด + ความเร็ว (High Score & Speed)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isHighScore ? 'bg-slate-950/40 text-slate-900' : 'bg-slate-800 text-slate-400'
                  }`}>
                    แชมป์คะแนน
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop()
                    setFinalSummaryTab('correct_answers')
                  }}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                    !isHighScore
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>2. จำนวนข้อที่ถูกต้อง (Quiz Accuracy)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    !isHighScore ? 'bg-slate-950/40 text-slate-900' : 'bg-slate-800 text-slate-400'
                  }`}>
                    แชมป์ความแม่นยำ
                  </span>
                </button>
              </div>

              {/* Active Category Banner */}
              <div className="mb-6">
                {isHighScore ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <span>⚡ จัดอันดับตามคะแนนรวมสูงสุด (คะแนนฐาน 500 + โบนัสความเร็วสูงสุด 500 ต่อข้อ)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <span>🎯 จัดอันดับตามจำนวนข้อที่ตอบถูกต้อง (คะแนนเต็ม {questions.length} ข้อ)</span>
                  </div>
                )}
              </div>

              {/* Podium Top 3 */}
              <div className="w-full max-w-3xl grid grid-cols-3 gap-3 sm:gap-4 items-end mb-8">
                
                {/* 2nd Place */}
                <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-700 flex flex-col items-center shadow-xl h-64 sm:h-72 justify-end">
                  <DiceBearAvatar seed={top2?.nickname || 'RunnerUp'} url={top2?.avatar_url} size="lg" className="mb-2" />
                  <span className="font-bold text-white text-xs sm:text-sm truncate max-w-full">{top2?.nickname || 'อันดับ 2'}</span>
                  {top2?.department && (
                    <span className="text-[10px] text-slate-400 truncate max-w-full">{top2.department}</span>
                  )}
                  <span className="text-slate-400 font-extrabold text-[11px] mt-1">🥈 อันดับ 2</span>
                  
                  {isHighScore ? (
                    <div className="mt-2">
                      <div className="text-amber-400 font-black text-base sm:text-lg">
                        {top2?.score || 0} คะแนน
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ตอบถูก {top2?.correctCount || 0}/{questions.length} ข้อ
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="text-emerald-400 font-black text-base sm:text-lg">
                        {top2?.correctCount || 0} / {questions.length} ข้อ
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {Math.round(((top2?.correctCount || 0) / questions.length) * 100)}% ถูกต้อง • {top2?.score || 0} คะแนน
                      </div>
                    </div>
                  )}
                </div>

                {/* 1st Place (Gold Winner) */}
                <div className={`p-4 sm:p-6 rounded-3xl border-2 flex flex-col items-center shadow-2xl h-80 sm:h-88 justify-end relative ${
                  isHighScore
                    ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 neon-border-amber'
                    : 'bg-gradient-to-b from-emerald-500/20 to-slate-900 border-emerald-400 neon-border-emerald'
                }`}>
                  <Crown className={`w-10 h-10 absolute -top-5 animate-bounce ${
                    isHighScore ? 'text-amber-400 fill-amber-400' : 'text-emerald-400 fill-emerald-400'
                  }`} />
                  <DiceBearAvatar seed={top1?.nickname || 'Champion'} url={top1?.avatar_url} size="xl" className="mb-3" />
                  <span className="font-black text-white text-sm sm:text-base truncate max-w-full">{top1?.nickname || 'แชมเปี้ยน'}</span>
                  {top1?.department && (
                    <span className="text-xs text-amber-200/80 font-bold truncate max-w-full">{top1.department}</span>
                  )}
                  <span className={`font-black text-xs mt-1 ${isHighScore ? 'text-amber-300' : 'text-emerald-300'}`}>
                    🥇 ชนะเลิศอันดับ 1
                  </span>

                  {isHighScore ? (
                    <div className="mt-2">
                      <div className="text-amber-400 font-black text-xl sm:text-2xl">
                        {top1?.score || 0} คะแนน
                      </div>
                      <div className="text-xs text-amber-300 font-bold mt-0.5">
                        ตอบถูก {top1?.correctCount || 0}/{questions.length} ข้อ
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="text-emerald-400 font-black text-xl sm:text-2xl">
                        {top1?.correctCount || 0} / {questions.length} ข้อ
                      </div>
                      <div className="text-xs text-emerald-300 font-bold mt-0.5">
                        {Math.round(((top1?.correctCount || 0) / questions.length) * 100)}% ความแม่นยำ • {top1?.score || 0} คะแนน
                      </div>
                    </div>
                  )}
                </div>

                {/* 3rd Place */}
                <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-700 flex flex-col items-center shadow-xl h-56 sm:h-64 justify-end">
                  <DiceBearAvatar seed={top3?.nickname || 'Third'} url={top3?.avatar_url} size="md" className="mb-2" />
                  <span className="font-bold text-white text-xs sm:text-sm truncate max-w-full">{top3?.nickname || 'อันดับ 3'}</span>
                  {top3?.department && (
                    <span className="text-[10px] text-slate-400 truncate max-w-full">{top3.department}</span>
                  )}
                  <span className="text-amber-600 font-extrabold text-[11px] mt-1">🥉 อันดับ 3</span>

                  {isHighScore ? (
                    <div className="mt-2">
                      <div className="text-amber-400 font-black text-sm sm:text-base">
                        {top3?.score || 0} คะแนน
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ตอบถูก {top3?.correctCount || 0}/{questions.length} ข้อ
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="text-emerald-400 font-black text-sm sm:text-base">
                        {top3?.correctCount || 0} / {questions.length} ข้อ
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {Math.round(((top3?.correctCount || 0) / questions.length) * 100)}% • {top3?.score || 0} คะแนน
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Detailed Ranking List of All Players for This Category */}
              <div className="w-full max-w-3xl bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 mb-8 text-left shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      ตารางสรุปอันดับผู้เล่นทั้งหมด ({currentRanked.length} คน)
                    </span>
                  </div>
                  <span className="text-xs text-purple-400 font-bold">
                    {isHighScore ? '⚡ เรียงตามคะแนนรวม (ความเร็ว+ถูกต้อง)' : '🎯 เรียงตามข้อที่ตอบถูก'}
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {currentRanked.map((player, idx) => {
                    const deptInfo = getDepartmentInfo(player.department)
                    const accuracyPct = Math.round(((player.correctCount || 0) / questions.length) * 100)

                    return (
                      <div
                        key={player.id}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                          idx === 0
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : idx <= 2
                              ? 'bg-slate-800/60 border-slate-700/80'
                              : 'bg-slate-800/30 border-slate-800'
                        }`}
                      >
                        {/* Rank & Player Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            idx === 0 ? 'bg-amber-500 text-slate-950 font-black' :
                            idx === 1 ? 'bg-slate-300 text-slate-950 font-black' :
                            idx === 2 ? 'bg-amber-700 text-white font-black' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>

                          <DiceBearAvatar seed={player.nickname} url={player.avatar_url} size="xs" />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                                {player.nickname}
                              </span>
                              {deptInfo && (
                                <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold border truncate ${deptInfo.badgeClass}`}>
                                  {deptInfo.shortName}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {isHighScore 
                                ? `คะแนนสะสม ${player.score || 0} คะแนน • ตอบถูก ${player.correctCount || 0}/${questions.length} ข้อ`
                                : `ความแม่นยำ ${accuracyPct}% (${player.correctCount || 0}/${questions.length} ข้อ) • ${player.score || 0} คะแนน`}
                            </div>
                          </div>
                        </div>

                        {/* Metric Display */}
                        <div className="text-right shrink-0">
                          {isHighScore ? (
                            <div>
                              <span className="font-mono font-black text-sm text-amber-400">
                                {player.score || 0}
                              </span>
                              <span className="text-[10px] text-amber-300 ml-1">คะแนน</span>
                              <div className="text-[10px] text-emerald-400/80 font-mono font-semibold">
                                ถูก {player.correctCount || 0}/{questions.length}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-mono font-black text-sm text-emerald-400">
                                {player.correctCount || 0}/{questions.length}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">ข้อ</span>
                              <div className="text-[10px] text-amber-400/80 font-mono font-semibold">
                                {player.score || 0} คะแนน
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Podium Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => handleReturnToLobby(false)}
                  className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-sm flex items-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>กลับหน้า Lobby (ดูผู้เข้าร่วม)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetGame}
                  className="py-3 px-8 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เปิดสังเวียนรอบใหม่ (New Arena)</span>
                </button>
              </div>

            </div>
          )
        })()}

      </main>

      {/* Realtime Participants / Players Modal */}
      {showPlayersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">ผู้เข้าร่วมในสังเวียน ({allPlayers.length} คน)</h3>
                  <p className="text-xs text-slate-400">ห้อง: {roomCode} • คลิกที่ผู้เล่นเพื่อแก้ไขชื่อหรือจัดทีม/แผนก</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlayersModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {allPlayers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  ยังไม่มีผู้เล่นเข้ามาในห้องขณะนี้
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allPlayers.map(p => {
                    const deptInfo = getDepartmentInfo(p.department)
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShowPlayersModal(false)
                          handleOpenEditPlayer(p)
                        }}
                        className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-purple-500 flex items-center gap-3 transition cursor-pointer hover:scale-102"
                        title="คลิกเพื่อแก้ไขชื่อ / จัดทีมแผนก"
                      >
                        <div className="relative">
                          <DiceBearAvatar seed={p.nickname} url={p.avatar_url} size="sm" />
                          {deptInfo && (
                            <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ${deptInfo.dotClass}`} />
                          )}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div className="font-bold text-white text-xs truncate">{p.nickname}</div>
                          {deptInfo ? (
                            <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded-full font-bold border truncate max-w-full ${deptInfo.badgeClass}`}>
                              {deptInfo.shortName}
                            </span>
                          ) : (
                            <div className="text-[10px] text-slate-500">ยังไม่ระบุทีม</div>
                          )}
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mt-0.5">
                            <Zap className="w-3 h-3 fill-amber-400" />
                            <span>{p.score !== undefined ? p.score : 0} คะแนน</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs text-slate-400">สถานะปัจจุบัน: <strong className="text-purple-400 uppercase">{gameStatus}</strong></span>
              <div className="flex gap-2">
                {gameStatus !== 'lobby' && (
                  <button
                    onClick={() => handleReturnToLobby(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับไปหน้า Lobby รวมผู้เล่น</span>
                  </button>
                )}
                <button
                  onClick={() => setShowPlayersModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      {/* Quiz Manager / Lessons Modal */}
      <QuizManagerModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        currentQuestions={questions}
        onSaveQuestions={handleSaveQuizSet}
      />

      {/* Edit Player & Department Modal */}
      <EditPlayerModal
        isOpen={showEditPlayerModal}
        onClose={() => {
          setShowEditPlayerModal(false)
          setEditingPlayer(null)
        }}
        player={editingPlayer}
        onSave={handleSavePlayerEdit}
      />

      {/* Realtime Live Leaderboard Modal */}
      <LiveLeaderboardModal
        isOpen={showLiveLeaderboardModal}
        onClose={() => setShowLiveLeaderboardModal(false)}
        players={leaderboard.length > 0 && gameStatus === 'revealed' ? leaderboard : allPlayers}
        submissions={submissions}
        currentQIndex={currentQIndex}
        totalQuestions={questions.length}
        onEditPlayer={handleOpenEditPlayer}
        isHost={true}
      />

    </div>
  )
}
