import React, { useState } from 'react'
import { 
  BookOpen, Upload, Plus, Trash2, Check, Copy, 
  HelpCircle, CheckCircle2, AlertCircle, X, Sparkles, FileText, ArrowRight, RotateCcw 
} from 'lucide-react'
import { DEFAULT_QUESTIONS, PRESET_LESSONS } from '../data/defaultQuestions'
import { sounds } from '../utils/soundEffects'

export default function QuizManagerModal({ isOpen, onClose, currentQuestions, onSaveQuestions }) {
  const [activeTab, setActiveTab] = useState('presets') // 'presets' | 'import' | 'manual'
  const [importJsonText, setImportJsonText] = useState('')
  const [copiedTemplate, setCopiedTemplate] = useState(false)
  const [importError, setImportError] = useState('')

  // Manual Question Form State
  const [manualList, setManualList] = useState(currentQuestions || [])
  const [newQText, setNewQText] = useState('')
  const [newOptA, setNewOptA] = useState('')
  const [newOptB, setNewOptB] = useState('')
  const [newOptC, setNewOptC] = useState('')
  const [newOptD, setNewOptD] = useState('')
  const [newCorrect, setNewCorrect] = useState('A')
  const [newExpl, setNewExpl] = useState('')

  if (!isOpen) return null

  // Template JSON string for copying
  const sampleTemplate = JSON.stringify([
    {
      order_num: 0,
      question_text: "ตัวอย่างคำถามข้อที่ 1?",
      option_a: "คำตอบ A",
      option_b: "คำตอบ B",
      option_c: "คำตอบ C",
      option_d: "คำตอบ D",
      correct_option: "A",
      explanation: "คำอธิบายเหตุผลของคำตอบข้อที่ 1"
    },
    {
      order_num: 1,
      question_text: "ตัวอย่างคำถามข้อที่ 2?",
      option_a: "คำตอบ A",
      option_b: "คำตอบ B",
      option_c: "คำตอบ C",
      option_d: "คำตอบ D",
      correct_option: "B",
      explanation: "คำอธิบายเหตุผลของคำตอบข้อที่ 2"
    }
  ], null, 2)

  // 1. Select Preset Lesson
  const handleSelectPreset = (lesson) => {
    sounds.playWin()
    onSaveQuestions(lesson.questions, lesson.title)
    onClose()
  }

  // 2. Parse & Import JSON
  const handleImportJson = () => {
    setImportError('')
    try {
      if (!importJsonText.trim()) {
        setImportError('กรุณาวางโค้ด JSON คำถามก่อนกดยืนยัน')
        return
      }
      const parsed = JSON.parse(importJsonText)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setImportError('รูปแบบ JSON ต้องเป็น Array ของคำถาม (อย่างน้อย 1 ข้อ)')
        return
      }

      // Validate structure
      const validated = parsed.map((q, idx) => {
        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
          throw new Error(`ข้อที่ ${idx + 1} กรอกข้อมูลโจทย์หรือช้อยส์ไม่ครบถ้วน`)
        }
        const correct = (q.correct_option || 'A').toUpperCase()
        if (!['A', 'B', 'C', 'D'].includes(correct)) {
          throw new Error(`ข้อที่ ${idx + 1} ช้อยส์ที่ถูกต้องต้องเป็น A, B, C หรือ D เท่านั้น`)
        }
        return {
          order_num: idx,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: correct,
          explanation: q.explanation || ''
        }
      })

      sounds.playWin()
      onSaveQuestions(validated, 'ชุดคำถามนำเข้าจาก JSON')
      onClose()
    } catch (err) {
      setImportError(err.message || 'รูปแบบ JSON ไม่ถูกต้อง')
    }
  }

  // 3. File Upload Handler (.json)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setImportJsonText(event.target?.result || '')
    }
    reader.readAsText(file)
  }

  // 4. Add Manual Question
  const handleAddManualQuestion = (e) => {
    e.preventDefault()
    if (!newQText || !newOptA || !newOptB || !newOptC || !newOptD) {
      alert('กรุณากรอกโจทย์และตัวเลือกให้ครบทั้ง 4 ตัวเลือก')
      return
    }

    const newQuestion = {
      order_num: manualList.length,
      question_text: newQText.trim(),
      option_a: newOptA.trim(),
      option_b: newOptB.trim(),
      option_c: newOptC.trim(),
      option_d: newOptD.trim(),
      correct_option: newCorrect,
      explanation: newExpl.trim()
    }

    const updated = [...manualList, newQuestion]
    setManualList(updated)
    sounds.playPop()

    // Reset Form
    setNewQText('')
    setNewOptA('')
    setNewOptB('')
    setNewOptC('')
    setNewOptD('')
    setNewCorrect('A')
    setNewExpl('')
  }

  const handleDeleteManualQuestion = (index) => {
    const updated = manualList.filter((_, i) => i !== index).map((q, idx) => ({ ...q, order_num: idx }))
    setManualList(updated)
    sounds.playTick()
  }

  const handleSaveManualList = () => {
    if (manualList.length === 0) {
      alert('ต้องมีคำถามอย่างน้อย 1 ข้อ')
      return
    }
    sounds.playWin()
    onSaveQuestions(manualList, 'ชุดคำถามปรับแต่งเอง')
    onClose()
  }

  const copyTemplateToClipboard = () => {
    navigator.clipboard.writeText(sampleTemplate)
    setCopiedTemplate(true)
    setTimeout(() => setCopiedTemplate(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">จัดการคลังข้อสอบ & เปลี่ยนบทเรียน</h3>
              <p className="text-xs text-slate-400">อัปโหลดคำถามใหม่ สลับบทเรียน และปรับแต่งโจทย์ตามต้องการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-3 text-xs md:text-sm font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>ชุดบทเรียนสำเร็จรูป</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-3 text-xs md:text-sm font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลด / วาง JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-xs md:text-sm font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>สร้าง/แก้ไขคำถาม ({manualList.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: PRESET LESSONS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-200 leading-relaxed">
                💡 เลือกชุดบทเรียนด้านล่างนี้เพื่อสลับข้อสอบในห้องได้ทันที ระบบจะบันทึกลงฐานข้อมูลและ Sync ไปยังผู้เล่นทุกคน
              </div>

              {/* Reset to Default 5 Questions Button */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="font-extrabold text-white text-sm flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>ชุดคำถามมาตรฐานเริ่มต้น (Default Quiz)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    รีเซ็ตคำถามทั้งหมดกลับเป็นชุดหลัก 5 ข้อ และเริ่มใหม่ที่ข้อ 1
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playWin()
                    onSaveQuestions(DEFAULT_QUESTIONS, 'ชุดคำถามเริ่มต้น (5 ข้อหลัก)')
                    onClose()
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตเป็นชุดเริ่มต้น</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRESET_LESSONS.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-purple-500/80 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-lg"
                  >
                    <div>
                      <div className="inline-flex px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold mb-2">
                        {lesson.questions.length} ข้อ
                      </div>
                      <h4 className="font-extrabold text-white text-base leading-snug mb-2">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {lesson.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset(lesson)}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>ใช้งานบทเรียนนี้</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT JSON / UPLOAD FILE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase">วางโค้ด JSON ข้อสอบ หรืออัปโหลดไฟล์:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyTemplateToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTemplate ? 'คัดลอกเทมเพลตแล้ว!' : 'คัดลอกตัวอย่าง JSON'}</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition cursor-pointer">
                    <FileText className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์ .json</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <textarea
                rows={10}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder={`[\n  {\n    "question_text": "คำถามข้อที่ 1?",\n    "option_a": "ช้อยส์ A",\n    "option_b": "ช้อยส์ B",\n    "option_c": "ช้อยส์ C",\n    "option_d": "ช้อยส์ D",\n    "correct_option": "A",\n    "explanation": "คำอธิบาย"\n  }\n]`}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-xs focus:outline-none focus:border-purple-400 leading-relaxed resize-none"
              />

              {importError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleImportJson}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>นำเข้าและเปิดใช้งานชุดคำถามนี้</span>
              </button>
            </div>
          )}

          {/* TAB 3: MANUAL QUESTION BUILDER */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              
              {/* Existing Questions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span>รายการคำถามในชุดปัจจุบัน ({manualList.length} ข้อ):</span>
                  <button
                    type="button"
                    onClick={handleSaveManualList}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    บันทึกชุดคำถามนี้ ({manualList.length} ข้อ)
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {manualList.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-purple-400 font-mono">ข้อที่ {idx + 1}:</span>
                          <span className="font-bold text-white">{q.question_text}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-0.5">
                          <span>A: {q.option_a}</span>
                          <span>B: {q.option_b}</span>
                          <span>C: {q.option_c}</span>
                          <span>D: {q.option_d}</span>
                          <span className="text-emerald-400 font-bold">เฉลย: {q.correct_option}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteManualQuestion(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="ลบข้อนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Question Form */}
              <form onSubmit={handleAddManualQuestion} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  + เพิ่มคำถามข้อใหม่:
                </div>

                <div>
                  <input
                    type="text"
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="พิมพ์โจทย์คำถาม..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newOptA}
                    onChange={(e) => setNewOptA(e.target.value)}
                    placeholder="ตัวเลือก A"
                    className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={newOptB}
                    onChange={(e) => setNewOptB(e.target.value)}
                    placeholder="ตัวเลือก B"
                    className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={newOptC}
                    onChange={(e) => setNewOptC(e.target.value)}
                    placeholder="ตัวเลือก C"
                    className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={newOptD}
                    onChange={(e) => setNewOptD(e.target.value)}
                    placeholder="ตัวเลือก D"
                    className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">เฉลย:</span>
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNewCorrect(opt)}
                        className={`w-8 h-8 rounded-lg font-black text-xs transition cursor-pointer ${
                          newCorrect === opt
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={newExpl}
                    onChange={(e) => setNewExpl(e.target.value)}
                    placeholder="คำอธิบายเฉลย (ไม่บังคับ)"
                    className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 w-full"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มคำถามนี้ลงในรายการ</span>
                </button>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
