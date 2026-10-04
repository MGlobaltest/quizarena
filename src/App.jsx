import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import HostPage from './pages/HostPage'
import PlayPage from './pages/PlayPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* ผู้เข้าร่วมที่สแกน QR Code หรือเข้าผ่าน Root Domain จะเข้าสู่หน้าจอผู้เล่น (/play) ทันที */}
        <Route path="/" element={<Navigate to="/play" replace />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/host" element={<HostPage />} />
        {/* หน้า Portal รวมสำหรับผู้ควบคุม/แอดมิน */}
        <Route path="/portal" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/play" replace />} />
      </Routes>
    </HashRouter>
  )
}
