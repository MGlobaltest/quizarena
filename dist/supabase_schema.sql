-- =========================================================================
-- SUPER BET ARENA - DATABASE SCHEMA & REALTIME SETUP (FREE TIER COMPATIBLE)
-- =========================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- TABLE: rooms
-- -------------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null default 'Super Bet Arena Quiz',
  status text not null default 'lobby', -- 'lobby', 'question_active', 'revealed', 'finished'
  current_question_index integer not null default 0,
  speaker_id uuid,
  speaker_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------------------------------------------------------
-- TABLE: questions
-- -------------------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  order_num integer not null default 0,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------------------------------------------------------
-- TABLE: participants
-- -------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null,
  avatar_url text not null,
  score integer not null default 100, -- ทุกคนเริ่มต้นด้วย 100 Points
  is_connected boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_room_nickname unique(room_id, nickname)
);

-- -------------------------------------------------------------------------
-- TABLE: round_submissions
-- -------------------------------------------------------------------------
create table if not exists public.round_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  is_speaker boolean not null default false,
  selected_option text check (selected_option in ('A', 'B', 'C', 'D')),
  bet_target text check (bet_target in ('SPEAKER_CORRECT', 'SPEAKER_WRONG')),
  bet_amount integer not null default 0,
  points_awarded integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_round_participant unique(question_id, participant_id)
);

-- -------------------------------------------------------------------------
-- REALTIME PUBLICATION SETUP (Free Tier 100% Compatible)
-- ใช้ DO block ตรวจสอบว่าตารางอยู่ใน publication หรือยัง เพื่อป้องกัน Error
-- -------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'questions'
  ) then
    alter publication supabase_realtime add table public.questions;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table public.participants;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'round_submissions'
  ) then
    alter publication supabase_realtime add table public.round_submissions;
  end if;
end;
$$;

-- Enable Full Replica Identity for real-time diffs
alter table public.rooms replica identity full;
alter table public.participants replica identity full;
alter table public.round_submissions replica identity full;
alter table public.questions replica identity full;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ใช้ DROP POLICY IF EXISTS เพื่อให้รันซ้ำได้โดยไม่ติด Error
-- -------------------------------------------------------------------------
alter table public.rooms enable row level security;
alter table public.questions enable row level security;
alter table public.participants enable row level security;
alter table public.round_submissions enable row level security;

-- Rooms Policies
drop policy if exists "Allow all read on rooms" on public.rooms;
drop policy if exists "Allow all insert on rooms" on public.rooms;
drop policy if exists "Allow all update on rooms" on public.rooms;
create policy "Allow all read on rooms" on public.rooms for select using (true);
create policy "Allow all insert on rooms" on public.rooms for insert with check (true);
create policy "Allow all update on rooms" on public.rooms for update using (true);

-- Questions Policies
drop policy if exists "Allow all read on questions" on public.questions;
drop policy if exists "Allow all insert on questions" on public.questions;
drop policy if exists "Allow all update on questions" on public.questions;
create policy "Allow all read on questions" on public.questions for select using (true);
create policy "Allow all insert on questions" on public.questions for insert with check (true);
create policy "Allow all update on questions" on public.questions for update using (true);

-- Participants Policies
drop policy if exists "Allow all read on participants" on public.participants;
drop policy if exists "Allow all insert on participants" on public.participants;
drop policy if exists "Allow all update on participants" on public.participants;
create policy "Allow all read on participants" on public.participants for select using (true);
create policy "Allow all insert on participants" on public.participants for insert with check (true);
create policy "Allow all update on participants" on public.participants for update using (true);

-- Round Submissions Policies
drop policy if exists "Allow all read on round_submissions" on public.round_submissions;
drop policy if exists "Allow all insert on round_submissions" on public.round_submissions;
drop policy if exists "Allow all update on round_submissions" on public.round_submissions;
create policy "Allow all read on round_submissions" on public.round_submissions for select using (true);
create policy "Allow all insert on round_submissions" on public.round_submissions for insert with check (true);
create policy "Allow all update on round_submissions" on public.round_submissions for update using (true);

-- -------------------------------------------------------------------------
-- DATABASE FUNCTION (RPC): settle_super_bet_round
-- -------------------------------------------------------------------------
create or replace function public.settle_super_bet_round(
  p_room_id uuid,
  p_question_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_correct_opt text;
  v_speaker_submission record;
  v_is_speaker_correct boolean := false;
  v_sub record;
  v_net_change integer;
  v_speaker_reward integer := 50;  -- แต้มรางวัล Speaker หากตอบถูก (+50)
  v_speaker_penalty integer := 0;  -- Speaker ตอบผิด ไม่ติดลบ
  v_bonus_knowledge integer := 20; -- โบนัสตอบถูกด้วยตัวเองสำหรับผู้เล่นทั่วไป (+20)
  v_processed_count integer := 0;
  v_results json;
begin
  -- 1. ตรวจสอบช้อยส์ที่ถูกต้องของคำถาม
  select correct_option into v_correct_opt
  from public.questions
  where id = p_question_id;

  if v_correct_opt is null then
    raise exception 'Question not found or correct option missing';
  end if;

  -- 2. ค้นหาคำตอบของ Speaker
  select * into v_speaker_submission
  from public.round_submissions
  where question_id = p_question_id and is_speaker = true
  limit 1;

  if found and v_speaker_submission.selected_option is not null then
    if upper(v_speaker_submission.selected_option) = upper(v_correct_opt) then
      v_is_speaker_correct := true;
    else
      v_is_speaker_correct := false;
    end if;
  end if;

  -- 3. วนลูปคำนวณคะแนนสำหรับผู้เล่นทุกคนที่ส่งคำตอบในรอบนี้
  for v_sub in
    select s.*, p.nickname, p.score as current_score
    from public.round_submissions s
    join public.participants p on p.id = s.participant_id
    where s.question_id = p_question_id
  loop
    v_net_change := 0;

    if v_sub.is_speaker then
      -- กรณีเป็น Speaker:
      if v_is_speaker_correct then
        v_net_change := v_speaker_reward;
      else
        v_net_change := -v_speaker_penalty;
      end if;
    else
      -- กรณีเป็น ผู้เล่นทั่วไป (ทายผล Speaker + เลือกคำตอบสำรองของตนเอง):
      if v_sub.bet_target = 'SPEAKER_CORRECT' then
        if v_is_speaker_correct then
          v_net_change := v_net_change + v_sub.bet_amount; -- ได้กำไรตามที่แทง
        else
          v_net_change := v_net_change - v_sub.bet_amount; -- เสียชิปที่แทง
        end if;
      elsif v_sub.bet_target = 'SPEAKER_WRONG' then
        if not v_is_speaker_correct then
          v_net_change := v_net_change + v_sub.bet_amount; -- ได้กำไรตามที่แทง
        else
          v_net_change := v_net_change - v_sub.bet_amount; -- เสียชิปที่แทง
        end if;
      end if;

      -- คำนวณโบนัสความรู้ตนเอง (Knowledge Bonus)
      if v_sub.selected_option is not null and upper(v_sub.selected_option) = upper(v_correct_opt) then
        v_net_change := v_net_change + v_bonus_knowledge;
      end if;
    end if;

    -- บันทึกคะแนนที่ได้ลง round_submissions
    update public.round_submissions
    set points_awarded = v_net_change
    where id = v_sub.id;

    -- อัปเดตยอดแต้มรวมในตาราง participants (ไม่ให้แต้มต่ำกว่า 0)
    update public.participants
    set score = greatest(0, score + v_net_change)
    where id = v_sub.participant_id;

    v_processed_count := v_processed_count + 1;
  end loop;

  -- 4. อัปเดตสถานะห้องเป็น 'revealed'
  update public.rooms
  set status = 'revealed',
      updated_at = timezone('utc'::text, now())
  where id = p_room_id;

  -- 5. ส่งสรุปข้อมูลผลลัพธ์กลับไปยังแอป
  select json_build_object(
    'success', true,
    'correct_option', v_correct_opt,
    'is_speaker_correct', v_is_speaker_correct,
    'processed_count', v_processed_count,
    'leaderboard', (
      select json_agg(
        json_build_object(
          'id', id,
          'nickname', nickname,
          'avatar_url', avatar_url,
          'score', score
        ) order by score desc
      )
      from public.participants
      where room_id = p_room_id
    )
  ) into v_results;

  return v_results;
end;
$$;
