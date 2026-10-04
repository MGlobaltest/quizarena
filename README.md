# Super Bet Arena (สังเวียนเดิมพันปัญญา) 🎰🧠

เว็บแอปพลิเคชัน Quiz โชว์ตอบคำถามแบบ Interactive Real-Time สำหรับการอบรม สัมมนา และห้องเรียน พัฒนาด้วย **Vite + React + Tailwind CSS** และเชื่อมต่อกับ **Supabase (Free Tier: Database + Realtime Presence & Broadcast)**

---

## 🌟 จุดเด่นและระบบการเล่น (Features)

1. **Host Screen (`/host`) — สำหรับวิทยากร / จอโปรเจกเตอร์**:
   - **Lobby พร้อม QR Code อัตโนมัติ**: ผู้เรียนใช้กล้องมือถือสแกนเพื่อเข้าร่วมได้ทันที
   - **Realtime Presence & DiceBear Avatar**: จับสถานะผู้เล่นที่เข้าร่วมห้องแบบสดๆ แสดง Avatar หุ่นยนต์ (Bottts) พร้อมชื่อเล่น
   - **สุ่มตัวแทนตอบประจำข้อ (Speaker Spotlight)**: มีระบบสุ่มตัวแทนพร้อมแอนิเมชัน Roulette
   - **Live 4-Box Grid (A, B, C, D)**: ดักจับ Event `PLAYER_SUBMIT` ผ่าน Supabase Broadcast เมื่อผู้เรียนกดส่ง Avatar ของทุกคนจะไหลเข้ากล่องช้อยส์แบบ Live
   - **เฉลยคำตอบ (Reveal Answer)**: เรียกใช้งาน Supabase Database Function (RPC) `settle_super_bet_round` เพื่อคำนวณกำไร/ขาดทุนของชิปเดิมพัน และอัปเดตคะแนนสด
   - **สรุปผลและ Victory Podium**: แสดง 3 อันดับแรกบนโพเดียมพร้อมเอฟเฟกต์ Confetti ฉลองชัยชนะ

2. **Player Mobile Screen (`/play`) — สำหรับผู้เรียน / จอมือถือ**:
   - **เข้าร่วมง่าย**: กรอกรหัสห้อง + ชื่อเล่น และสุ่มอวตาร DiceBear เริ่มต้นด้วย **100 ชิป (Points)**
   - **เมื่อได้รับบทบาทเป็น Speaker 🎤**:
     - หน้าจอจะขึ้นแถบไฮไลต์ให้เลือกตอบคำถามข้อ A, B, C หรือ D เพื่อสะสมแต้มให้ตนเอง (+50 ชิปเมื่อตอบถูก)
   - **เมื่อเป็นผู้เล่นทั่วไป**:
     - **เดิมพันความแม่นยำของ Speaker**: เลือกว่า "เชื่อว่า Speaker ตอบถูก" หรือ "คิดว่า Speaker ตอบผิด" พร้อมสไลเดอร์ปรับชิปเดิมพัน
     - **เลือกคำตอบสำรองของตนเอง**: เลือกช้อยส์ A, B, C, D เพื่อรับโบนัสความรู้ (+20 ชิปเมื่อตอบถูก)
   - **สรุปผลเรียลไทม์**: แสดงกำไร/ขาดทุนชิป พร้อมเสียงสังเคราะห์ (Web Audio API)

---

## 📁 โครงสร้างโปรเจกต์ (Folder Structure)

```text
Quiz/
├── public/
│   └── supabase_schema.sql         # สคริปต์ SQL สำหรับสร้างฐานข้อมูล Supabase
├── src/
│   ├── components/
│   │   ├── DiceBearAvatar.jsx      # คอมโพเนนต์แสดง Avatar จาก DiceBear API
│   │   ├── SoundToggle.jsx         # ปุ่มเปิด/ปิดเสียงเอฟเฟกต์
│   │   └── SupabaseConfigModal.jsx # โมดอลสำหรับตั้งค่า API Key & คัดลอก SQL
│   ├── data/
│   │   └── defaultQuestions.js     # คลังคำถามตัวอย่าง 5 ข้อ
│   ├── lib/
│   │   └── supabaseClient.js       # การตั้งค่าเชื่อมต่อ Supabase Client
│   ├── pages/
│   │   ├── HomePage.jsx            # หน้า Portal หลักเลือกระหว่าง Host และ Player
│   │   ├── HostPage.jsx            # หน้าจอวิทยากร (/host)
│   │   └── PlayPage.jsx            # หน้าจอมือถือผู้เรียน (/play)
│   ├── utils/
│   │   └── soundEffects.js         # ระบบเสียงสังเคราะห์ Web Audio API (ไม่ต้องพึ่ง mp3)
│   ├── App.jsx                     # การตั้งค่า Router
│   ├── index.css                   # Tailwind CSS v4 & Neon Glow Styles
│   └── main.jsx                    # จุดเริ่มต้น React App
├── .env.example                    # ตัวอย่างไฟล์ Environment Variables
├── package.json
├── supabase_schema.sql             # SQL Script สำหรับรันบน Supabase Free Tier
└── vite.config.js                  # การตั้งค่า Vite + Tailwind Plugin
```

---

## 🛠️ วิธีการตั้งค่า Supabase (Free Tier 100%)

### ขั้นตอนที่ 1: สร้างโปรเจกต์บน Supabase
1. เข้าไปที่ [supabase.com](https://supabase.com) แล้วลงชื่อเข้าใช้ (ฟรี)
2. สร้าง New Project (ตั้งชื่อและรหัสผ่านฐานข้อมูล)

### ขั้นตอนที่ 2: รัน SQL Script
1. ไปที่เมนู **SQL Editor** บนเมนูด้านซ้ายของ Supabase Dashboard
2. เปิดไฟล์ `supabase_schema.sql` ในโปรเจกต์นี้ คัดลอกโค้ดทั้งหมดแล้ววางลงใน SQL Editor
3. กดปุ่ม **Run**
   - สคริปต์จะทำการสร้างตาราง `rooms`, `questions`, `participants`, `round_submissions`
   - เปิดใช้งาน Realtime Publication บนทุกตาราง
   - สร้าง Row Level Security (RLS) แบบเปิดให้ใช้งานในคลาสเรียน
   - สร้าง Database Function (RPC) `settle_super_bet_round`

### ขั้นตอนที่ 3: นำ API Keys มาใส่ในโปรเจกต์
1. ไปที่เมนู **Project Settings** → **API**
2. คัดลอกค่า:
   - **Project URL**
   - **Project API Keys (anon public)**
3. นำไปใส่ในไฟล์ `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   *(หรือเปิดเว็บแอปแล้วกดปุ่ม **"ตั้งค่า Supabase"** ที่มุมขวาบนเพื่อวางคีย์ผ่านหน้าเว็บได้ทันที)*

---

## 🚀 วิธีการรันโปรเจกต์ (Quick Start)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. เริ่มรันเซิร์ฟเวอร์สำหรับทดสอบ
npm run dev
```

เปิด Browser ไปที่:
- **หน้าจอมือถือ (ผู้เรียน)**: `http://localhost:5173/` หรือ `http://localhost:5173/#/play` (สแกนแล้วเข้าเล่นทันที)
- **หน้าจอ Host (วิทยากร/จอโปรเจกเตอร์)**: `http://localhost:5173/#/host`
- **หน้าหลักรวมระบบ (Portal)**: `http://localhost:5173/#/portal`

---

## ☁️ วิธีการ Deploy ขึ้น Vercel

1. อัปโหลดโฟลเดอร์นี้ขึ้น **GitHub Repository**
2. ไปที่ [Vercel](https://vercel.com) แล้วกด **"Add New..." ➡️ "Project"**
3. เลือก Repository ที่สร้างไว้ (Vercel จะตรวจจับการตั้งค่า Vite อัตโนมัติ)
4. ไปที่หัวข้อ **Environment Variables** แล้วเพิ่ม:
   - `VITE_SUPABASE_URL` = URL ของ Supabase
   - `VITE_SUPABASE_ANON_KEY` = Anon Key ของ Supabase
5. กดปุ่ม **Deploy** เสร็จเรียบร้อย พร้อมใช้งานทันที!

