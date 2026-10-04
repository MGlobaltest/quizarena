export const PRESET_LESSONS = [
  {
    id: 'lesson-cloud',
    title: 'บทที่ 1: Cloud & Realtime Architecture',
    description: 'สถาปัตยกรรมคลาวด์, WebSockets, และระบบเรียลไทม์',
    questions: [
      {
        order_num: 0,
        question_text: "ในระบบ Cloud Architecture ข้อใดคือคุณสมบัติเด่นของ 'Microservices'?",
        option_a: "ระบบรวมศูนย์อยู่ที่ฐานข้อมูลเดียวทั้งหมด",
        option_b: "แต่ละ Service แยกอิสระและ Deploy แยกกันได้",
        option_c: "ต้องใช้ภาษาคอมพิวเตอร์เดียวกันทั้งระบบ",
        option_d: "ต้องใช้เซิร์ฟเวอร์ขนาดใหญ่ตัวเดียวเสมอ",
        correct_option: "B",
        explanation: "Microservices ออกแบบมาเพื่อให้แต่ละ Service แยกอิสระ สามารถ Scale และ Deploy ได้อย่างยืดหยุ่น"
      },
      {
        order_num: 1,
        question_text: "โปรโตคอลใดที่ Supabase Realtime ใช้เป็นแกนหลักในการรับส่งข้อมูลสองทาง (Bi-directional)?",
        option_a: "HTTP/1.0 Polling",
        option_b: "FTP (File Transfer)",
        option_c: "WebSockets (Phoenix Channels)",
        option_d: "Simple Mail Transfer (SMTP)",
        correct_option: "C",
        explanation: "Supabase Realtime ใช้ WebSockets ผ่าน Elixir Phoenix Channels ในการกระจาย Presence และ Broadcast ได้อย่างรวดเร็วระดับมิลลิวินาที"
      },
      {
        order_num: 2,
        question_text: "ในสังเวียน Super Bet Arena ผู้เล่นทั่วไปมีสิทธิ์ทำคะแนนอย่างไรในแต่ละข้อ?",
        option_a: "รอเวลาหมดโดยไม่ต้องกดอะไรเลย",
        option_b: "วางเดิมพันเชื่อ/ไม่เชื่อ Speaker + ตอบช้อยส์ของตนเองเพื่อรับโบนัส",
        option_c: "กดแย่งไมค์จาก Speaker กลางคัน",
        option_d: "โอนคะแนนให้ผู้เล่นคนอื่นได้อิสระ",
        correct_option: "B",
        explanation: "ผู้เล่นสามารถลงชิปเดิมพันว่า Speaker จะตอบถูกหรือผิด และยังสามารถเลือกคำตอบของตนเองเพื่อรับโบนัสความรู้เพิ่มได้อีกด้วย"
      },
      {
        order_num: 3,
        question_text: "DiceBear API ที่นำมาใช้แสดงภาพอวตารผู้เล่นในโปรเจกต์นี้ มีข้อดีอย่างไร?",
        option_a: "ต้องเสียค่าธรรมเนียมรายเดือนขั้นต่ำ 50$",
        option_b: "สร้าง SVG Avatar สไตล์ Bottts ฟรีได้ทันทีตาม Seed คำค้น",
        option_c: "ต้องใช้เวลาโหลดเรนเดอร์ภาพครั้งละ 30 วินาที",
        option_d: "รองรับการแสดงผลเฉพาะบนคอมพิวเตอร์ Mac",
        correct_option: "B",
        explanation: "DiceBear API ให้บริการสร้าง SVG Avatar อัตโนมัติคุณภาพสูงฟรี โดยไม่ต้องเสียค่าบริการและไม่ต้องเก็บไฟล์บนเซิร์ฟเวอร์"
      },
      {
        order_num: 4,
        question_text: "ในการเชื่อมต่อ Supabase JavaScript SDK คำสั่งใดใช้เรียก Database Function (RPC)?",
        option_a: "supabase.rpc('function_name', params)",
        option_b: "supabase.execute('function_name', params)",
        option_c: "supabase.query('function_name', params)",
        option_d: "supabase.runProcedure('function_name', params)",
        correct_option: "A",
        explanation: "คำสั่ง supabase.rpc(fnName, params) เป็นคำสั่งมาตรฐานสำหรับเรียก PostgreSQL Stored Function บน Supabase"
      }
    ]
  },
  {
    id: 'lesson-ai',
    title: 'บทที่ 2: Artificial Intelligence & LLM Essentials',
    description: 'ความรู้พื้นฐานเกี่ยวกับ AI, โมเดลภาษาขนาดใหญ่ และ Prompt Engineering',
    questions: [
      {
        order_num: 0,
        question_text: "คำว่า 'LLM' ในวงการปัญญาประดิษฐ์ย่อมาจากคำว่าอะไร?",
        option_a: "Large Language Model",
        option_b: "Long Learning Machine",
        option_c: "Linear Logic Matrix",
        option_d: "Low Latency Module",
        correct_option: "A",
        explanation: "LLM ย่อมาจาก Large Language Model หรือโมเดลภาษาขนาดใหญ่ที่ได้รับการเทรนด้วยข้อมูลมหาศาล"
      },
      {
        order_num: 1,
        question_text: "เทคนิค 'RAG' (Retrieval-Augmented Generation) ช่วยแก้ปัญหาใดของ AI ได้ดีที่สุด?",
        option_a: "การลดขนาดของโมเดลให้เล็กลง",
        option_b: "การดึงข้อมูลเฉพาะทางจากฐานข้อมูลภายนอกมาตอบเพื่อลดอาการหลอน (Hallucination)",
        option_c: "การแปลภาษาแบบเรียลไทม์",
        option_d: "การเรนเดอร์ภาพกราฟิก 3 มิติ",
        correct_option: "B",
        explanation: "RAG ช่วยค้นหาข้อมูลจริงจากคลังเอกสารขององค์กรมาป้อนเป็นบริบทให้กับ LLM ทำให้ได้คำตอบที่ถูกต้องแม่นยำ"
      },
      {
        order_num: 2,
        question_text: "ข้อใดคือหลักการที่ดีในการเขียน 'Prompt' เพื่อสั่งงาน AI ให้ได้ผลลัพธ์แม่นยำ?",
        option_a: "สั่งงานสั้นที่สุดโดยไม่ระบุบริบทใดๆ",
        option_b: "กำหนดบทบาท (Role), บริบท (Context), และรูปแบบผลลัพธ์ที่ต้องการให้ชัดเจน",
        option_c: "ใช้ภาษาทางการที่ซับซ้อนมากที่สุด",
        option_d: "หลีกเลี่ยงการให้ตัวอย่างคำตอบ",
        correct_option: "B",
        explanation: "การกำหนด Role, Context, Constraints และ Few-shot Examples เป็นหัวใจสำคัญของ Prompt Engineering ที่มีประสิทธิภาพ"
      },
      {
        order_num: 3,
        question_text: "คำว่า 'Temperature' ในการตั้งค่าพารามิเตอร์ของ LLM ส่งผลต่อสิ่งใด?",
        option_a: "ความร้อนของเครื่อง GPU เซิร์ฟเวอร์",
        option_b: "ความเร็วในการประมวลผล",
        option_c: "ความสุ่มและความคิดสร้างสรรค์ของคำตอบ (Creativity/Randomness)",
        option_d: "ความยาวของข้อความ",
        correct_option: "C",
        explanation: "Temperature ต่ำ (เช่น 0.2) จะให้คำตอบตรงไปตรงมาและแน่นอน ส่วน Temperature สูง (เช่น 0.8) จะให้ความหลากหลายและความคิดสร้างสรรค์"
      },
      {
        order_num: 4,
        question_text: "หน่วยนับที่เล็กที่สุดที่โมเดล LLM ใช้ในการแบ่งคำและประมวลผลข้อความเรียกว่าอะไร?",
        option_a: "Pixel",
        option_b: "Token",
        option_c: "Bytecode",
        option_d: "Vector Point",
        correct_option: "B",
        explanation: "Token คือหน่วยย่อยของคำหรือพยางค์ที่ LLM ใช้คำนวณและวัดปริมาณการประมวลผล"
      }
    ]
  },
  {
    id: 'lesson-security',
    title: 'บทที่ 3: Cybersecurity & Web Security',
    description: 'ความปลอดภัยไซเบอร์, การพิสูจน์ตัวตน และการป้องกันช่องโหว่เว็บแอป',
    questions: [
      {
        order_num: 0,
        question_text: "การยืนยันตัวตนแบบ '2FA' (Two-Factor Authentication) มีประโยชน์หลักอย่างไร?",
        option_a: "ทำให้การล็อกอินรวดเร็วขึ้นเป็น 2 เท่า",
        option_b: "เพิ่มความปลอดภัยด้วยการใช้หลักฐาน 2 อย่างในการยืนยันตัวตน",
        option_c: "เปลี่ยนรหัสผ่านให้อัตโนมัติทุกวัน",
        option_d: "ป้องกันไวรัสคอมพิวเตอร์ในเครื่อง",
        correct_option: "B",
        explanation: "2FA ช่วยป้องกันกรณีรหัสผ่านหลุด โดยต้องใช้ปัจจัยที่ 2 เช่น OTP บนมือถือ หรือ Authenticator App ยืนยันร่วมด้วย"
      },
      {
        order_num: 1,
        question_text: "การโจมตีแบบ 'Phishing' มักเกิดขึ้นในรูปแบบใดมากที่สุด?",
        option_a: "การเจาะรหัสผ่านผ่านระบบ Wi-Fi",
        option_b: "การส่งอีเมลหรือลิงก์ปลอมหลอกล่อให้เหยื่อกรอกข้อมูลสำคัญ",
        option_c: "การส่งข้อมูลขยะให้เซิร์ฟเวอร์ล่ม (DDoS)",
        option_d: "การเสียบแฟลชไดรฟ์ที่มีไวรัส",
        correct_option: "B",
        explanation: "Phishing คือการหลอกลวงทางวิศวกรรมสังคม (Social Engineering) ผ่านอีเมลหรือหน้าเว็บปลอมที่ทำเลียนแบบองค์กรจริง"
      },
      {
        order_num: 2,
        question_text: "ในมาตรฐาน Web Security โปรโตคอล 'HTTPS' แตกต่างจาก 'HTTP' อย่างไร?",
        option_a: "HTTPS ทำงานเร็วกว่า HTTP 10 เท่า",
        option_b: "HTTPS มีการเข้ารหัสข้อมูลระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์ด้วย SSL/TLS",
        option_c: "HTTPS ใช้ได้เฉพาะบนเครื่องคอมพิวเตอร์",
        option_d: "HTTPS ไม่ต้องใช้หมายเลขพอร์ต",
        correct_option: "B",
        explanation: "HTTPS มีการเข้ารหัสลับ (Encryption) ป้องกันการถูกดักจับข้อมูลกลางทาง (Man-in-the-Middle Attack)"
      },
      {
        order_num: 3,
        question_text: "ช่องโหว่ 'SQL Injection' (SQLi) สามารถป้องกันได้อย่างมีประสิทธิภาพด้วยวิธีใด?",
        option_a: "การใช้ Parameterized Queries (Prepared Statements)",
        option_b: "การตั้งรหัสผ่านฐานข้อมูลให้ยาวขึ้น",
        option_c: "การเปลี่ยนพอร์ตของฐานข้อมูล",
        option_d: "การปิดการเชื่อมต่ออินเทอร์เน็ตของฐานข้อมูล",
        correct_option: "A",
        explanation: "Parameterized Queries แยกโค้ด SQL ออกจาก Input ของผู้ใช้อย่างเด็ดขาด ทำให้คำสั่งแปลกปลอมไม่สามารถถูกสั่งประมวลผลได้"
      },
      {
        order_num: 4,
        question_text: "ใน Supabase นโยบาย 'RLS' (Row Level Security) ทำหน้าที่อะไร?",
        option_a: "ตรวจสอบความเร็วของฐานข้อมูล",
        option_b: "กำหนดสิทธิ์การเข้าถึง (Read/Write) ของข้อมูลในระดับแถว (Row) ตามเงื่อนไข",
        option_c: "สำรองข้อมูลอัตโนมัติทุกชั่วโมง",
        option_d: "ลบข้อมูลที่ซ้ำซ้อนทิ้ง",
        correct_option: "B",
        explanation: "Row Level Security บน PostgreSQL ช่วยควบคุมอย่างละเอียดว่าผู้ใช้คนใดมีสิทธิ์เห็นหรือแก้ไขข้อมูลแถวไหนในตาราง"
      }
    ]
  }
];

export const DEFAULT_QUESTIONS = PRESET_LESSONS[0].questions;
