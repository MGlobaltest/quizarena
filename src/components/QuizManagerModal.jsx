import React, { useState, useEffect } from 'react'
import { 
  BookOpen, Upload, Plus, Trash2, Check, Copy, 
  CheckCircle2, AlertCircle, X, Sparkles, FileText, ArrowRight, RotateCcw,
  Download, Eye, EyeOff, Search, FolderOpen, Calendar, CheckSquare
} from 'lucide-react'
import { DEFAULT_QUESTIONS, PRESET_LESSONS } from '../data/defaultQuestions'
import { sounds } from '../utils/soundEffects'
import { formatThaiDisplayDateTime } from '../utils/thaiTime'

export default function QuizManagerModal({ isOpen, onClose, currentQuestions, activeTitle = '', onSaveQuestions }) {
  // 1. Saved Quiz Sets in localStorage
  const [savedQuizSets, setSavedQuizSets] = useState(() => {
    try {
      const stored = localStorage.getItem('sba_saved_quiz_sets')
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.warn('Error reading saved quiz sets:', e)
      return []
    }
  })

  // 2. Active Tab State ('saved' | 'presets' | 'import' | 'manual')
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const stored = localStorage.getItem('sba_saved_quiz_sets')
      const parsed = stored ? JSON.parse(stored) : []
      return parsed.length > 0 ? 'saved' : 'presets'
    } catch (e) {
      return 'presets'
    }
  })

  // Search & Preview in Saved Library
  const [searchSavedQuery, setSearchSavedQuery] = useState('')
  const [expandedPreviewId, setExpandedPreviewId] = useState(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // Import JSON Form State
  const [importJsonText, setImportJsonText] = useState('')
  const [importTitle, setImportTitle] = useState('')
  const [importDesc, setImportDesc] = useState('')
  const [copiedTemplate, setCopiedTemplate] = useState(false)
  const [importError, setImportError] = useState('')

  // Manual Question Form State
  const [manualList, setManualList] = useState(currentQuestions || [])
  const [manualSetTitle, setManualSetTitle] = useState('')
  const [newQText, setNewQText] = useState('')
  const [newOptA, setNewOptA] = useState('')
  const [newOptB, setNewOptB] = useState('')
  const [newOptC, setNewOptC] = useState('')
  const [newOptD, setNewOptD] = useState('')
  const [newCorrect, setNewCorrect] = useState('A')
  const [newExpl, setNewExpl] = useState('')

  // Sync manualList if currentQuestions changes when opening
  useEffect(() => {
    if (isOpen && currentQuestions) {
      setManualList(currentQuestions)
    }
  }, [isOpen, currentQuestions])

  if (!isOpen) return null

  // Persist saved quiz sets to localStorage
  const persistSavedSets = (newSets) => {
    setSavedQuizSets(newSets)
    try {
      localStorage.setItem('sba_saved_quiz_sets', JSON.stringify(newSets))
    } catch (e) {
      console.warn('Error persisting quiz sets:', e)
    }
  }

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

  // Download questions as JSON file helper
  const downloadJson = (questionsList, title = 'quiz_questions') => {
    try {
      sounds.playPop()
      const jsonStr = JSON.stringify(questionsList, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      const safeName = (title || 'quiz_questions').replace(/[/\\?%*:|"<>]/g, '_').trim()
      link.setAttribute('download', `${safeName}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download JSON error:', err)
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ JSON')
    }
  }

  // Robust Validation and Formatting of raw JSON questions
  const validateAndFormatQuestions = (rawArray) => {
    if (!Array.isArray(rawArray) || rawArray.length === 0) {
      throw new Error('รูปแบบ JSON ต้องเป็น Array ของคำถาม (อย่างน้อย 1 ข้อ)')
    }

    return rawArray.map((q, idx) => {
      const qText = (q.question_text || q.question || '').toString().trim()
      const optA = (q.option_a || q.a || q.A || (Array.isArray(q.options) ? q.options[0] : '') || '').toString().trim()
      const optB = (q.option_b || q.b || q.B || (Array.isArray(q.options) ? q.options[1] : '') || '').toString().trim()
      const optC = (q.option_c || q.c || q.C || (Array.isArray(q.options) ? q.options[2] : '') || '').toString().trim()
      const optD = (q.option_d || q.d || q.D || (Array.isArray(q.options) ? q.options[3] : '') || '').toString().trim()

      if (!qText || !optA || !optB || !optC || !optD) {
        throw new Error(`ข้อที่ ${idx + 1} กรอกข้อมูลโจทย์หรือตัวเลือก A, B, C, D ไม่ครบถ้วน`)
      }

      let correct = (q.correct_option || q.answer || q.correct || 'A').toString().trim().toUpperCase()
      if (correct === '0') correct = 'A'
      if (correct === '1') correct = 'B'
      if (correct === '2') correct = 'C'
      if (correct === '3') correct = 'D'

      if (!['A', 'B', 'C', 'D'].includes(correct)) {
        throw new Error(`ข้อที่ ${idx + 1} ตัวเลือกที่ถูกต้องต้องเป็น A, B, C หรือ D เท่านั้น (พบค่า: "${correct}")`)
      }

      return {
        order_num: idx,
        question_text: qText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correct,
        explanation: (q.explanation || q.explain || '').toString().trim()
      }
    })
  }

  // 1. Action: Select Preset Lesson
  const handleSelectPreset = (lesson) => {
    sounds.playWin()
    onSaveQuestions(lesson.questions, lesson.title)
    onClose()
  }

  // 2. Action: Select and Activate Saved Set from Library
  const handleSelectSavedSet = (savedSet) => {
    sounds.playWin()
    onSaveQuestions(savedSet.questions, savedSet.title)
    onClose()
  }

  // 3. Action: Delete Saved Set from Library
  const handleDeleteSavedSet = (setId, setTitle) => {
    const ok = window.confirm(`ต้องการลบชุดคำถาม "${setTitle}" ออกจากคลังที่บันทึกไว้หรือไม่?`)
    if (!ok) return
    sounds.playTick()
    const updated = savedQuizSets.filter(s => s.id !== setId)
    persistSavedSets(updated)
  }

  // 4. File Upload Handler (.json)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    if (!importTitle) {
      setImportTitle(baseName)
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setImportJsonText(event.target?.result || '')
      setImportError('')
    }
    reader.readAsText(file)
  }

  // 5. Parse, Save to Library & Activate Immediately
  const handleImportAndActivate = () => {
    setImportError('')
    try {
      if (!importJsonText.trim()) {
        setImportError('กรุณาวางโค้ด JSON คำถาม หรืออัปโหลดไฟล์ .json ก่อนกดยืนยัน')
        return
      }
      const parsed = JSON.parse(importJsonText)
      const validated = validateAndFormatQuestions(parsed)

      const title = importTitle.trim() || `ชุดคำถาม JSON (${validated.length} ข้อ)`
      const thaiNow = formatThaiDisplayDateTime()

      const newSet = {
        id: 'quiz-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title,
        description: importDesc.trim() || `บันทึกเมื่อ ${thaiNow}`,
        createdAt: thaiNow,
        questions: validated
      }

      // Record in saved sets library
      const updatedSets = [newSet, ...savedQuizSets.filter(s => s.title !== title)]
      persistSavedSets(updatedSets)

      sounds.playWin()
      onSaveQuestions(validated, title)
      onClose()
    } catch (err) {
      setImportError(err.message || 'รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบไวยากรณ์')
    }
  }

  // 6. Parse and Save to Library Only (Do not activate yet)
  const handleSaveToLibraryOnly = () => {
    setImportError('')
    try {
      if (!importJsonText.trim()) {
        setImportError('กรุณาวางโค้ด JSON คำถาม หรืออัปโหลดไฟล์ .json ก่อน')
        return
      }
      const parsed = JSON.parse(importJsonText)
      const validated = validateAndFormatQuestions(parsed)

      const title = importTitle.trim() || `ชุดคำถาม JSON (${validated.length} ข้อ)`
      const thaiNow = formatThaiDisplayDateTime()

      const newSet = {
        id: 'quiz-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title,
        description: importDesc.trim() || `บันทึกเมื่อ ${thaiNow}`,
        createdAt: thaiNow,
        questions: validated
      }

      // Record in saved sets library
      const updatedSets = [newSet, ...savedQuizSets.filter(s => s.title !== title)]
      persistSavedSets(updatedSets)

      sounds.playPop()
      setSaveSuccessMsg(`บันทึกชุดคำถาม "${title}" (${validated.length} ข้อ) ลงคลังเรียบร้อยแล้ว! สามารถเลือกใช้งานได้จากแท็บนี้`)
      setImportJsonText('')
      setImportTitle('')
      setImportDesc('')
      setActiveTab('saved')
      setTimeout(() => setSaveSuccessMsg(''), 5000)
    } catch (err) {
      setImportError(err.message || 'รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบไวยากรณ์')
    }
  }

  // 7. Manual Question Handlers
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

  // Save manual list to library
  const handleSaveManualToLibrary = () => {
    if (manualList.length === 0) {
      alert('ต้องมีคำถามอย่างน้อย 1 ข้อ')
      return
    }
    const title = manualSetTitle.trim() || `ชุดคำถามปรับแต่งเอง (${manualList.length} ข้อ)`
    const thaiNow = formatThaiDisplayDateTime()

    const newSet = {
      id: 'quiz-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      description: `สร้างด้วยระบบ Manual Builder เมื่อ ${thaiNow}`,
      createdAt: thaiNow,
      questions: manualList
    }

    const updatedSets = [newSet, ...savedQuizSets.filter(s => s.title !== title)]
    persistSavedSets(updatedSets)
    sounds.playPop()
    setSaveSuccessMsg(`บันทึกชุดคำถาม "${title}" (${manualList.length} ข้อ) ลงคลังเรียบร้อยแล้ว!`)
    setActiveTab('saved')
    setTimeout(() => setSaveSuccessMsg(''), 5000)
  }

  const handleSaveManualListAndUse = () => {
    if (manualList.length === 0) {
      alert('ต้องมีคำถามอย่างน้อย 1 ข้อ')
      return
    }
    const title = manualSetTitle.trim() || `ชุดคำถามปรับแต่งเอง (${manualList.length} ข้อ)`
    const thaiNow = formatThaiDisplayDateTime()

    const newSet = {
      id: 'quiz-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      description: `สร้างด้วยระบบ Manual Builder เมื่อ ${thaiNow}`,
      createdAt: thaiNow,
      questions: manualList
    }

    const updatedSets = [newSet, ...savedQuizSets.filter(s => s.title !== title)]
    persistSavedSets(updatedSets)

    sounds.playWin()
    onSaveQuestions(manualList, title)
    onClose()
  }

  const copyTemplateToClipboard = () => {
    navigator.clipboard.writeText(sampleTemplate)
    setCopiedTemplate(true)
    setTimeout(() => setCopiedTemplate(false), 2000)
  }

  // Filtered saved quiz sets by search query
  const filteredSavedSets = savedQuizSets.filter(s => {
    if (!searchSavedQuery.trim()) return true
    const q = searchSavedQuery.toLowerCase()
    return s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">จัดการคลังข้อสอบ & เปลี่ยนบทเรียน</h3>
                {savedQuizSets.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                    บันทึกไว้ {savedQuizSets.length} ชุด
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">อัปโหลดไฟล์ JSON บันทึกคลังชุดคำถาม และเลือกสลับใช้งานได้ตลอดเวลา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Save Success Notification Banner */}
        {saveSuccessMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMsg('')}
              className="text-emerald-400/70 hover:text-emerald-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 gap-2 sm:gap-4 overflow-x-auto">
          {/* TAB 1: SAVED SETS LIBRARY */}
          <button
            type="button"
            onClick={() => {
              sounds.playTick()
              setActiveTab('saved')
            }}
            className={`pb-3 text-xs sm:text-sm font-extrabold transition border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'saved'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-purple-400" />
            <span>คลังชุดคำถามที่บันทึกไว้</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'saved' ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {savedQuizSets.length}
            </span>
          </button>

          {/* TAB 2: PRESET LESSONS */}
          <button
            type="button"
            onClick={() => {
              sounds.playTick()
              setActiveTab('presets')
            }}
            className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ชุดบทเรียนสำเร็จรูป</span>
          </button>

          {/* TAB 3: UPLOAD / IMPORT JSON */}
          <button
            type="button"
            onClick={() => {
              sounds.playTick()
              setActiveTab('import')
            }}
            className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'import'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>อัปโหลด / บันทึกไฟล์ JSON</span>
          </button>

          {/* TAB 4: MANUAL BUILDER */}
          <button
            type="button"
            onClick={() => {
              sounds.playTick()
              setActiveTab('manual')
            }}
            className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>สร้าง/แก้ไขคำถาม ({manualList.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ========================================================= */}
          {/* TAB 1: SAVED QUIZ SETS (RECORDED SETS FOR LATER USE)      */}
          {/* ========================================================= */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              
              {/* Header Bar with Search & Quick Upload */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                  <input
                    type="text"
                    value={searchSavedQuery}
                    onChange={(e) => setSearchSavedQuery(e.target.value)}
                    placeholder="ค้นหาชุดคำถามที่บันทึกไว้..."
                    className="bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none w-full"
                  />
                  {searchSavedQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchSavedQuery('')}
                      className="text-slate-500 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('import')}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลด JSON เพิ่ม</span>
                  </button>
                </div>
              </div>

              {/* Empty State */}
              {savedQuizSets.length === 0 ? (
                <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-800 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center shadow-inner">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base">ยังไม่มีชุดคำถามที่บันทึกไว้ในคลัง</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      เมื่อคุณอัปโหลดไฟล์ JSON หรือบันทึกชุดข้อสอบ ระบบจะจดจำไว้ในคลังนี้โดยอัตโนมัติ เพื่อให้คุณสามารถคลิกเลือกนำกลับมาใช้งานได้ตลอดเวลา
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('import')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>อัปโหลดไฟล์ JSON ตอนนี้</span>
                  </button>
                </div>
              ) : filteredSavedSets.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/30 border border-slate-800 text-slate-400 text-xs">
                  ไม่พบชุดคำถามที่ตรงกับคำค้นหา "{searchSavedQuery}"
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSavedSets.map((quizSet) => {
                    const isExpanded = expandedPreviewId === quizSet.id
                    const qCount = quizSet.questions?.length || 0

                    return (
                      <div
                        key={quizSet.id}
                        className="rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-purple-500/60 transition shadow-lg overflow-hidden"
                      >
                        {/* Main Set Row */}
                        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                                {qCount} ข้อ
                              </span>
                              <h4 className="font-extrabold text-white text-sm sm:text-base truncate">
                                {quizSet.title}
                              </h4>
                              {activeTitle && activeTitle === quizSet.title && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>กำลังใช้งานอยู่</span>
                                </span>
                              )}
                            </div>

                            {quizSet.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 mb-1">
                                {quizSet.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {quizSet.createdAt || 'บันทึกแล้ว'}
                              </span>
                            </div>
                          </div>

                          {/* Set Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Toggle Preview Questions Button */}
                            <button
                              type="button"
                              onClick={() => setExpandedPreviewId(isExpanded ? null : quizSet.id)}
                              className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                                isExpanded
                                  ? 'bg-purple-950/40 text-purple-300 border-purple-500/40'
                                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-750 hover:bg-slate-800'
                              }`}
                              title="ดูตัวอย่างคำถามในชุดนี้"
                            >
                              {isExpanded ? <EyeOff className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">{isExpanded ? 'ปิดตัวอย่าง' : 'ดูคำถาม'}</span>
                            </button>

                            {/* Download JSON Button */}
                            <button
                              type="button"
                              onClick={() => downloadJson(quizSet.questions, quizSet.title)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                              title="ดาวน์โหลดชุดคำถามนี้เป็นไฟล์ .json"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="hidden sm:inline">JSON</span>
                            </button>

                            {/* Delete Set Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedSet(quizSet.id, quizSet.title)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-750 hover:border-rose-500/30 transition cursor-pointer"
                              title="ลบชุดคำถามนี้ออกจากคลัง"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Primary Action: Use This Set */}
                            <button
                              type="button"
                              onClick={() => handleSelectSavedSet(quizSet)}
                              className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                            >
                              <span>ใช้งานชุดนี้</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Accordion Preview of Questions in this Set */}
                        {isExpanded && (
                          <div className="p-4 border-t border-slate-750 bg-slate-950/70 space-y-2.5 max-h-64 overflow-y-auto animate-fadeIn">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                              <span>รายการคำถามทั้งหมดในชุด ({quizSet.questions.length} ข้อ):</span>
                              <button
                                type="button"
                                onClick={() => handleSelectSavedSet(quizSet)}
                                className="text-emerald-400 hover:underline flex items-center gap-1 font-extrabold"
                              >
                                <span>คลิกเพื่อเริ่มแข่งขันด้วยชุดนี้</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            {quizSet.questions.map((q, qIdx) => (
                              <div
                                key={qIdx}
                                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="font-extrabold text-purple-400 font-mono shrink-0">
                                    ข้อ {qIdx + 1}:
                                  </span>
                                  <span className="font-bold text-white leading-snug">
                                    {q.question_text}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-slate-300 pt-1">
                                  <div className={`p-1.5 rounded-lg border ${q.correct_option === 'A' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                                    A: {q.option_a}
                                  </div>
                                  <div className={`p-1.5 rounded-lg border ${q.correct_option === 'B' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                                    B: {q.option_b}
                                  </div>
                                  <div className={`p-1.5 rounded-lg border ${q.correct_option === 'C' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                                    C: {q.option_c}
                                  </div>
                                  <div className={`p-1.5 rounded-lg border ${q.correct_option === 'D' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                                    D: {q.option_d}
                                  </div>
                                </div>
                                {q.explanation && (
                                  <div className="text-[10px] text-amber-300/80 pt-0.5">
                                    💡 <strong>คำอธิบาย:</strong> {q.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRESET LESSONS                                     */}
          {/* ========================================================= */}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadJson(DEFAULT_QUESTIONS, 'SuperBetArena_Default_Questions')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
                    title="ดาวน์โหลดชุดเริ่มต้นเป็นไฟล์ JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playWin()
                      onSaveQuestions(DEFAULT_QUESTIONS, 'ชุดคำถามเริ่มต้น (5 ข้อหลัก)')
                      onClose()
                    }}
                    className="px-4 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตเป็นชุดเริ่มต้น</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRESET_LESSONS.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-purple-500/80 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="inline-flex px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold">
                          {lesson.questions.length} ข้อ
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadJson(lesson.questions, lesson.title)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="ดาวน์โหลด JSON บทเรียนนี้"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
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

          {/* ========================================================= */}
          {/* TAB 3: IMPORT JSON / UPLOAD FILE & RECORD FOR LATER       */}
          {/* ========================================================= */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
                📥 <strong>อัปโหลดและบันทึกชุดคำถาม:</strong> เมื่ออัปโหลดแล้ว ระบบจะทำการบันทึกลง <strong>"คลังชุดคำถามที่บันทึกไว้"</strong> โดยอัตโนมัติ เพื่อให้คุณสามารถเลือกสลับนำมาใช้งานได้ตลอดเวลา
              </div>

              {/* Set Title and Description Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    🏷️ ตั้งชื่อชุดคำถาม (Quiz Title): <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    placeholder="เช่น คำถามรอบชิงชนะเลิศ, Product Quiz Q3..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    📝 คำอธิบายสั้นๆ (ไม่บังคับ):
                  </label>
                  <input
                    type="text"
                    value={importDesc}
                    onChange={(e) => setImportDesc(e.target.value)}
                    placeholder="เช่น ใช้สำหรับการแข่งขันรอบบ่าย..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Upload JSON file / Paste Section */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase">
                  วางโค้ด JSON ข้อสอบ หรือเลือกไฟล์จากเครื่อง:
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyTemplateToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTemplate ? 'คัดลอกเทมเพลตแล้ว!' : 'คัดลอกตัวอย่าง JSON'}</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/20">
                    <FileText className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์ .json จากเครื่อง</span>
                    <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <textarea
                rows={9}
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value)
                  setImportError('')
                }}
                placeholder={`[\n  {\n    "question_text": "คำถามข้อที่ 1?",\n    "option_a": "ช้อยส์ A",\n    "option_b": "ช้อยส์ B",\n    "option_c": "ช้อยส์ C",\n    "option_d": "ช้อยส์ D",\n    "correct_option": "A",\n    "explanation": "คำอธิบาย"\n  }\n]`}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-xs focus:outline-none focus:border-purple-400 leading-relaxed resize-none shadow-inner"
              />

              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Action Buttons: 1. Save & Activate Now  2. Save to Library for Later */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveToLibraryOnly}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <FolderOpen className="w-4 h-4 text-purple-400" />
                  <span>บันทึกเก็บลงคลัง (ยังไม่เริ่มใช้ตอนนี้)</span>
                </button>

                <button
                  type="button"
                  onClick={handleImportAndActivate}
                  className="py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกลงคลังและเปิดใช้งานทันที</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: MANUAL QUESTION BUILDER                            */}
          {/* ========================================================= */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              
              {/* Existing Questions List */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-bold">
                  <span>รายการคำถามในชุดปัจจุบัน ({manualList.length} ข้อ):</span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadJson(manualList, manualSetTitle || 'custom_questions')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-750 transition cursor-pointer flex items-center gap-1.5"
                      title="ส่งออกคำถามชุดนี้เป็นไฟล์ JSON"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>ดาวน์โหลด JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveManualToLibrary}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>บันทึกลงคลัง</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveManualListAndUse}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
                    >
                      บันทึกและเปิดใช้งาน ({manualList.length} ข้อ)
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
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
