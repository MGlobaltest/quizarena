import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Tv, Smartphone, Database, Flame, 
  Coins, Users, Code2, ChevronRight, Zap 
} from 'lucide-react'
import SupabaseConfigModal from '../components/SupabaseConfigModal'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function HomePage() {
  const [showConfig, setShowConfig] = useState(false)
  const isConfigured = isSupabaseConfigured()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-600 font-sans">
      
      {/* Top Header */}
      <header className="h-20 border-b border-slate-800/80 px-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-black text-xl">
            S
          </div>
          <div>
            <h1 className="font-black text-xl text-white tracking-tight leading-none m-0">SUPER BET ARENA</h1>
            <p className="text-xs text-purple-400 font-semibold mt-0.5">สังเวียนเดิมพันปัญญา & ควิซโชว์เรียลไทม์</p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
            isConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{isConfigured ? 'Supabase Connected' : 'ตั้งค่า Supabase (Free Tier)'}</span>
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 flex flex-col justify-center items-center text-center">

        {/* Portals Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mb-12">
          
          {/* Host Portal Card */}
          <Link
            to="/host"
            className="group p-8 rounded-3xl bg-slate-900/80 border-2 border-slate-800 hover:border-purple-500 transition-all duration-300 shadow-xl hover:shadow-purple-500/10 flex flex-col items-center text-center hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Tv className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
              สำหรับวิทยากร / จอโปรเจกเตอร์
            </span>
            <h3 className="text-2xl font-black text-white mb-2">หน้าจอ Host (/host)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              แสดง Lobby QR Code, สุ่มตัวแทนตอบ (Speaker), กล่อง 4 ช้อยส์ Live Avatars, และปุ่มเฉลยคำตอบพร้อมสรุปคะแนน
            </p>
            <div className="w-full py-3 px-4 rounded-xl bg-purple-600 group-hover:bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 transition">
              <span>เปิดหน้าจอ Host</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Player Portal Card */}
          <Link
            to="/play"
            className="group p-8 rounded-3xl bg-slate-900/80 border-2 border-slate-800 hover:border-emerald-500 transition-all duration-300 shadow-xl hover:shadow-emerald-500/10 flex flex-col items-center text-center hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              สำหรับผู้เรียน / มือถือ
            </span>
            <h3 className="text-2xl font-black text-white mb-2">หน้าจอผู้เล่น (/play)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              กรอกชื่อ เลือกทีม, ตอบคำถามชิงคะแนนฐาน 500 แต้ม พร้อมรับโบนัสความเร็วสูงสุด +500 แต้ม
            </p>
            <div className="w-full py-3 px-4 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition">
              <span>เข้าสังเวียนผู้เล่น</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400 mb-2" />
            <div className="font-bold text-white text-xs">Speed Bonus</div>
            <div className="text-[11px] text-slate-400 mt-0.5">ตอบไวยิ่งได้แต้มเยอะ</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Flame className="w-5 h-5 text-rose-400 mb-2" />
            <div className="font-bold text-white text-xs">Speaker Roulette</div>
            <div className="text-[11px] text-slate-400 mt-0.5">สุ่มตัวแทนตอบคำถามสด</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Users className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="font-bold text-white text-xs">Live 4-Box Grid</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Avatar ไหลเข้ากล่องทันที</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Code2 className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="font-bold text-white text-xs">RPC Settlement</div>
            <div className="text-[11px] text-slate-400 mt-0.5">settle_super_bet_round</div>
          </div>
        </div>

      </main>



      {/* Modal */}
      <SupabaseConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />

    </div>
  )
}
