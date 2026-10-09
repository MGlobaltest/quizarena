import React, { useState } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY, saveSupabaseCredentials, isSupabaseConfigured, clearSupabaseCredentials } from '../lib/supabaseClient'
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, X } from 'lucide-react'

export default function SupabaseConfigModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(SUPABASE_URL.includes('placeholder') ? '' : SUPABASE_URL)
  const [key, setKey] = useState(SUPABASE_ANON_KEY.includes('placeholder') ? '' : SUPABASE_ANON_KEY)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('credentials') // 'credentials' | 'sql'

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    if (!url || !key) {
      alert('กรุณากรอก Supabase URL และ Anon Key ให้ครบถ้วน')
      return
    }
    saveSupabaseCredentials(url, key)
  }

  const handleCopySql = () => {
    fetch('/supabase_schema.sql')
      .then(res => res.text())
      .then(sql => {
        navigator.clipboard.writeText(sql)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        alert('กรุณาคัดลอกไฟล์ supabase_schema.sql ในโฟลเดอร์โปรเจกต์')
      })
  }

  const isConfigured = isSupabaseConfigured()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">ตั้งค่า Supabase (Free Tier)</h3>
              <p className="text-xs text-slate-400">เชื่อมต่อ Realtime Database & Broadcast</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-medium ${
          isConfigured 
            ? 'bg-emerald-950/40 text-emerald-300 border-b border-emerald-800/40' 
            : 'bg-amber-950/40 text-amber-300 border-b border-amber-800/40'
        }`}>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Supabase พร้อมทำงาน (Realtime Active)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>ยังไม่ได้ระบุ Supabase URL / Anon Key จริง</span>
              </>
            )}
          </div>
          <span className="text-[11px] opacity-75">Free Tier 100%</span>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 text-sm font-semibold transition border-b-2 ${
              activeTab === 'credentials'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            API Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 text-sm font-semibold transition border-b-2 ${
              activeTab === 'sql'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SQL Script & Schema
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'credentials' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Anon Public Key
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-sm font-mono resize-none"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">หาค่า API ได้ที่ไหน?</div>
                <div>1. ไปที่ Supabase Dashboard → เข้าโปรเจกต์ของคุณ</div>
                <div>2. เมนู <strong>Project Settings → API</strong></div>
                <div>3. คัดลอก <strong>Project URL</strong> และ <strong>Project API Keys (anon public)</strong></div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  บันทึกการตั้งค่า
                </button>
                {isConfigured && (
                  <button
                    type="button"
                    onClick={clearSupabaseCredentials}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 text-xs font-semibold rounded-xl transition"
                  >
                    ล้างค่า
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                สร้างตาราง <code className="text-emerald-400">rooms</code>, <code className="text-emerald-400">questions</code>, <code className="text-emerald-400">participants</code>, <code className="text-emerald-400">round_submissions</code> และฟังก์ชัน RPC <code className="text-amber-400">settle_super_bet_round</code> ใน Supabase SQL Editor
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition border border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL สคริปต์'}
                </button>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition"
                >
                  <span>เปิด Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>ไฟล์สคริปต์อยู่ในโฟลเดอร์โปรเจกต์: <strong className="text-white">supabase_schema.sql</strong></p>
                <p>รองรับ Free Tier 100% พร้อมเปิด Realtime Publication และ RLS แล้ว</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
