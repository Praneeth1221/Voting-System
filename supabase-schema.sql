-- ============================================================
-- EMPLOYEE MEAL FEEDBACK & MOOD VOTING SYSTEM
-- Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: meal_records
-- One row per meal per day (3 rows per day)
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  day TEXT NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('Breakfast', 'Lunch', 'Evening Snack')),
  scheduled_start TIME NOT NULL,
  scheduled_end TIME NOT NULL,
  very_happy_count INTEGER NOT NULL DEFAULT 0,
  happy_count INTEGER NOT NULL DEFAULT 0,
  normal_count INTEGER NOT NULL DEFAULT 0,
  sad_count INTEGER NOT NULL DEFAULT 0,
  last_vote_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, meal)
);

-- ============================================================
-- TABLE: meal_votes
-- One row per individual vote
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_record_id UUID NOT NULL REFERENCES meal_records(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('very_happy', 'happy', 'normal', 'sad')),
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_meal_records_date ON meal_records(date);
CREATE INDEX IF NOT EXISTS idx_meal_votes_meal_record_id ON meal_votes(meal_record_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_date_meal ON meal_records(date, meal);

-- ============================================================
-- FUNCTION: ensure_meal_records
-- Creates the 3 daily meal records if they don't exist
-- ============================================================
CREATE OR REPLACE FUNCTION ensure_meal_records(p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day TEXT;
BEGIN
  v_day := to_char(p_date, 'Day');
  v_day := trim(v_day);

  INSERT INTO meal_records (date, day, meal, scheduled_start, scheduled_end)
  VALUES
    (p_date, v_day, 'Breakfast', '07:00:00', '10:30:00'),
    (p_date, v_day, 'Lunch', '12:00:00', '14:30:00'),
    (p_date, v_day, 'Evening Snack', '17:00:00', '19:00:00')
  ON CONFLICT (date, meal) DO NOTHING;
END;
$$;

-- ============================================================
-- FUNCTION: get_current_meal_status
-- Returns the current meal info based on Asia/Colombo time
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_meal_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_colombo_now TIMESTAMP;
  v_current_date DATE;
  v_current_time TIME;
  v_day TEXT;
  v_meal TEXT;
  v_meal_start TIME;
  v_meal_end TIME;
  v_is_open BOOLEAN := FALSE;
  v_record_id UUID;
BEGIN
  v_now := now();
  v_colombo_now := v_now AT TIME ZONE 'Asia/Colombo';
  v_current_date := v_colombo_now::DATE;
  v_current_time := v_colombo_now::TIME;
  v_day := trim(to_char(v_current_date, 'Day'));

  -- Ensure today's records exist
  PERFORM ensure_meal_records(v_current_date);

  -- Determine current meal period
  IF v_current_time >= '07:00:00' AND v_current_time < '10:30:00' THEN
    v_meal := 'Breakfast';
    v_meal_start := '07:00:00';
    v_meal_end := '10:30:00';
    v_is_open := TRUE;
  ELSIF v_current_time >= '12:00:00' AND v_current_time < '14:30:00' THEN
    v_meal := 'Lunch';
    v_meal_start := '12:00:00';
    v_meal_end := '14:30:00';
    v_is_open := TRUE;
  ELSIF v_current_time >= '17:00:00' AND v_current_time < '19:00:00' THEN
    v_meal := 'Evening Snack';
    v_meal_start := '17:00:00';
    v_meal_end := '19:00:00';
    v_is_open := TRUE;
  END IF;

  IF v_is_open THEN
    SELECT id INTO v_record_id
    FROM meal_records
    WHERE date = v_current_date AND meal = v_meal;
  END IF;

  RETURN json_build_object(
    'is_open', v_is_open,
    'current_date', v_current_date,
    'current_time', v_current_time::TEXT,
    'day', v_day,
    'meal', v_meal,
    'meal_start', v_meal_start::TEXT,
    'meal_end', v_meal_end::TEXT,
    'meal_record_id', v_record_id,
    'server_time', v_now
  );
END;
$$;

-- ============================================================
-- FUNCTION: submit_vote
-- Atomically validates, inserts vote, and updates counts
-- ============================================================
CREATE OR REPLACE FUNCTION submit_vote(p_mood TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_colombo_now TIMESTAMP;
  v_current_date DATE;
  v_current_time TIME;
  v_meal TEXT;
  v_record_id UUID;
  v_vote_id UUID;
  v_count_column TEXT;
BEGIN
  -- Validate mood
  IF p_mood NOT IN ('very_happy', 'happy', 'normal', 'sad') THEN
    RETURN json_build_object('success', FALSE, 'error', 'Invalid mood value');
  END IF;

  v_now := now();
  v_colombo_now := v_now AT TIME ZONE 'Asia/Colombo';
  v_current_date := v_colombo_now::DATE;
  v_current_time := v_colombo_now::TIME;

  -- Determine current meal period
  IF v_current_time >= '07:00:00' AND v_current_time < '10:30:00' THEN
    v_meal := 'Breakfast';
  ELSIF v_current_time >= '12:00:00' AND v_current_time < '14:30:00' THEN
    v_meal := 'Lunch';
  ELSIF v_current_time >= '17:00:00' AND v_current_time < '19:00:00' THEN
    v_meal := 'Evening Snack';
  ELSE
    RETURN json_build_object('success', FALSE, 'error', 'Voting is currently closed. No active meal period.');
  END IF;

  -- Ensure records exist
  PERFORM ensure_meal_records(v_current_date);

  -- Get the meal record
  SELECT id INTO v_record_id
  FROM meal_records
  WHERE date = v_current_date AND meal = v_meal;

  IF v_record_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Meal record not found');
  END IF;

  -- Insert the individual vote
  INSERT INTO meal_votes (meal_record_id, mood, voted_at)
  VALUES (v_record_id, p_mood, v_now)
  RETURNING id INTO v_vote_id;

  -- Update the aggregate count atomically
  IF p_mood = 'very_happy' THEN
    UPDATE meal_records
    SET very_happy_count = very_happy_count + 1,
        last_vote_time = v_now,
        updated_at = now()
    WHERE id = v_record_id;
  ELSIF p_mood = 'happy' THEN
    UPDATE meal_records
    SET happy_count = happy_count + 1,
        last_vote_time = v_now,
        updated_at = now()
    WHERE id = v_record_id;
  ELSIF p_mood = 'normal' THEN
    UPDATE meal_records
    SET normal_count = normal_count + 1,
        last_vote_time = v_now,
        updated_at = now()
    WHERE id = v_record_id;
  ELSIF p_mood = 'sad' THEN
    UPDATE meal_records
    SET sad_count = sad_count + 1,
        last_vote_time = v_now,
        updated_at = now()
    WHERE id = v_record_id;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'vote_id', v_vote_id,
    'meal', v_meal,
    'mood', p_mood,
    'voted_at', v_now
  );
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_votes ENABLE ROW LEVEL SECURITY;

-- meal_records: Anyone can read (for employee UI display)
CREATE POLICY "Allow public read access to meal_records"
  ON meal_records FOR SELECT
  USING (true);

-- meal_records: Only service role / RPC can insert/update
-- (SECURITY DEFINER functions bypass RLS)

-- meal_votes: Only authenticated users can read votes
CREATE POLICY "Allow authenticated read access to meal_votes"
  ON meal_votes FOR SELECT
  TO authenticated
  USING (true);

-- Grant execute on functions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_current_meal_status() TO anon;
GRANT EXECUTE ON FUNCTION get_current_meal_status() TO authenticated;
GRANT EXECUTE ON FUNCTION submit_vote(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION submit_vote(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_meal_records(DATE) TO anon;
GRANT EXECUTE ON FUNCTION ensure_meal_records(DATE) TO authenticated;
