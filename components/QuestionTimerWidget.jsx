import React from 'react'
import { 
  Clock, Play, Pause, RotateCcw, Plus, 
  AlertTriangle, Flame, Settings, Zap, CheckCircle 
} from 'lucide-react'
import { sounds } from '../utils/soundEffects'

export default function QuestionTimerWidget({
  duration = 10,
  timeLeft = 10,
  isRunning = false,
  isTimeUp = false,
  triggerMode = 'speaker', // 'speaker' | 'question'
  onStart,
  onPause,
  onReset,
  onAddExtra,
  onChangeDuration,
  onChangeTriggerMode,
  speakerSelected = false
}) {
  const percent = Math.max(0, Math.min(100, (timeLeft / (duration || 10)) * 100))

  // Color theme based on urgency (calibrated for 5s & 10s presets)
  let urgencyStyle = {
    ring: 'border-emerald-500 text-emerald-400 bg-emerald-950/30 shadow-emerald-500/20',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
  }
  if (timeLeft <= 5 && timeLeft > 2) {
    urgencyStyle = {
      ring: 'border-amber-500 text-amber-400 bg-amber-950/40 shadow-amber-500/20 animate-pulse',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-400',
      pill: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    }
  } else if (timeLeft <= 2 && timeLeft > 0) {
    urgencyStyle = {
      ring: 'border-rose-500 text-rose-400 bg-rose-950/50 shadow-rose-500/30 animate-bounce',
      bar: 'bg-gradient-to-r from-rose-600 to-rose-400',
      pill: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
    }
  } else if (isTimeUp) {
    urgencyStyle = {
      ring: 'border-rose-600 text-rose-500 bg-rose-950/80 shadow-rose-600/40',
      bar: 'bg-rose-600',
      pill: 'bg-rose-600 text-white border-rose-500 font-black animate-pulse'
    }
  }

  return (
    <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
      
      {/* Left: Big Circular/Capsule Countdown Display */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black shadow-lg transition-all ${urgencyStyle.ring}`}>
          <span className="text-xl leading-none">{timeLeft}</span>
          <span className="text-[9px] uppercase font-bold opacity-80">วินาที</span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>จับเวลาตอบคำถาม</span>
            </span>

            {isTimeUp ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm animate-pulse flex items-center gap-1">
                <span>⏰ หมดเวลา! เฉลยคำตอบอัตโนมัติ...</span>
              </span>
            ) : isRunning ? (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  กำลังนับเวลา...
                </span>
                <span className="hidden sm:inline-block text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  ⚡ เฉลยอัตโนมัติเมื่อหมดเวลา
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  {triggerMode === 'speaker' && !speakerSelected 
                    ? 'รอเลือก Speaker เพื่อเริ่มนับ' 
                    : 'หยุดเวลาชั่วคราว'}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  ⚡ เฉลยอัตโนมัติเมื่อหมดเวลา
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-36 sm:w-48 h-2 bg-slate-950 rounded-full overflow-hidden mt-1.5 border border-slate-800">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${urgencyStyle.bar}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle & Right: Actions & Config */}
      <div className="flex flex-wrap items-center gap-2">
        
        {/* Play / Pause Button */}
        {isRunning ? (
          <button
            type="button"
            onClick={() => {
              sounds.playPop()
              onPause && onPause()
            }}
            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition cursor-pointer"
            title="หยุดเวลาชั่วคราว"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>พักเวลา</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              sounds.playPop()
              onStart && onStart()
            }}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
            title="เริ่มจับเวลานับถอยหลัง"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>เริ่มจับเวลา</span>
          </button>
        )}

        {/* Add Extra Time (+5s) */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop()
            onAddExtra && onAddExtra(5)
          }}
          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
          title="ต่อเวลาเพิ่ม 5 วินาที"
        >
          <Plus className="w-3.5 h-3.5 text-purple-400" />
          <span>+5 วิ</span>
        </button>

        {/* Reset Timer */}
        <button
          type="button"
          onClick={() => {
            sounds.playTick()
            onReset && onReset()
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
          title="รีเซ็ตเวลากลับเป็นค่าเริ่มต้น"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 hidden sm:block mx-0.5" />

        {/* Trigger Mode Selector */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => {
              sounds.playPop()
              onChangeTriggerMode && onChangeTriggerMode('speaker')
            }}
            className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
              triggerMode === 'speaker'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="เริ่มนับถอยหลังทันทีหลังจากสุ่มหรือเลือก Speaker ประจำข้อ"
          >
            <span>🎤 หลังเลือก Speaker</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playPop()
              onChangeTriggerMode && onChangeTriggerMode('question')
            }}
            className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
              triggerMode === 'question'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="เริ่มนับถอยหลังทันทีเมื่อเปิดข้อคำถามใหม่"
          >
            <span>📋 เมื่อเปิดข้อใหม่</span>
          </button>
        </div>

        {/* Duration Presets (5s & 10s only) */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
          {[5, 10].map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => {
                sounds.playPop()
                onChangeDuration && onChangeDuration(sec)
              }}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition cursor-pointer ${
                duration === sec
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`ตั้งเวลาข้อละ ${sec} วินาที`}
            >
              {sec}s
            </button>
          ))}
        </div>

      </div>

    </div>
  )
}
