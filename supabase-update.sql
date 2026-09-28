-- ============================================================
-- UPDATE: Voting Override + Updated RPC Functions
-- Run this in Supabase SQL Editor AFTER the initial schema
-- ============================================================

-- ============================================================
-- TABLE: voting_override (singleton row)
-- Stores admin override state for temporary voting
-- ============================================================
CREATE TABLE IF NOT EXISTS voting_override (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the singleton row
INSERT INTO voting_override (id, is_enabled) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;

-- RLS for voting_override
ALTER TABLE voting_override ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to voting_override"
  ON voting_override FOR SELECT
  USING (true);

-- ============================================================
-- FUNCTION: toggle_voting_override (admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_voting_override(p_enabled BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only authenticated users (admins) can toggle
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;

  UPDATE voting_override
  SET is_enabled = p_enabled,
      enabled_at = CASE WHEN p_enabled THEN now() ELSE NULL END,
      enabled_by = CASE WHEN p_enabled THEN auth.uid() ELSE NULL END,
      updated_at = now()
  WHERE id = 1;

  RETURN json_build_object('success', TRUE, 'is_enabled', p_enabled);
END;
$$;

-- ============================================================
-- FUNCTION: get_voting_override_status
-- Returns current override state (for admin dashboard)
-- ============================================================
CREATE OR REPLACE FUNCTION get_voting_override_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_enabled_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ;
  v_colombo_now TIMESTAMP;
  v_current_time TIME;
  v_in_normal_window BOOLEAN := FALSE;
BEGIN
  v_now := now();
  v_colombo_now := v_now AT TIME ZONE 'Asia/Colombo';
  v_current_time := v_colombo_now::TIME;

  SELECT is_enabled, enabled_at INTO v_enabled, v_enabled_at
  FROM voting_override WHERE id = 1;

  -- Check if in normal window
  IF (v_current_time >= '07:00:00' AND v_current_time < '10:30:00') OR
     (v_current_time >= '12:00:00' AND v_current_time < '14:30:00') OR
     (v_current_time >= '17:00:00' AND v_current_time < '19:00:00') THEN
    v_in_normal_window := TRUE;
  END IF;

  -- Auto-expire if outside normal window and > 2 minutes
  IF v_enabled AND v_enabled_at IS NOT NULL AND NOT v_in_normal_window THEN
    IF v_now - v_enabled_at > INTERVAL '2 minutes' THEN
      UPDATE voting_override SET is_enabled = FALSE, enabled_at = NULL, enabled_by = NULL, updated_at = now() WHERE id = 1;
      v_enabled := FALSE;
      v_enabled_at := NULL;
    END IF;
  END IF;

  RETURN json_build_object(
    'is_enabled', v_enabled,
    'enabled_at', v_enabled_at,
    'in_normal_window', v_in_normal_window
  );
END;
$$;

-- ============================================================
-- UPDATED FUNCTION: get_current_meal_status
-- Now includes override awareness + next-meal logic
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
  v_target_date DATE;
  v_override_enabled BOOLEAN := FALSE;
  v_override_at TIMESTAMPTZ;
  v_override_active BOOLEAN := FALSE;
  v_in_normal_window BOOLEAN := FALSE;
BEGIN
  v_now := now();
  v_colombo_now := v_now AT TIME ZONE 'Asia/Colombo';
  v_current_date := v_colombo_now::DATE;
  v_current_time := v_colombo_now::TIME;
  v_day := trim(to_char(v_current_date, 'Day'));
  v_target_date := v_current_date;

  -- Ensure today's records exist
  PERFORM ensure_meal_records(v_current_date);

  -- Check override status
  SELECT is_enabled, enabled_at INTO v_override_enabled, v_override_at
  FROM voting_override WHERE id = 1;

  -- Determine current meal period (normal schedule)
  IF v_current_time >= '07:00:00' AND v_current_time < '10:30:00' THEN
    v_meal := 'Breakfast';
    v_meal_start := '07:00:00';
    v_meal_end := '10:30:00';
    v_is_open := TRUE;
    v_in_normal_window := TRUE;
  ELSIF v_current_time >= '12:00:00' AND v_current_time < '14:30:00' THEN
    v_meal := 'Lunch';
    v_meal_start := '12:00:00';
    v_meal_end := '14:30:00';
    v_is_open := TRUE;
    v_in_normal_window := TRUE;
  ELSIF v_current_time >= '17:00:00' AND v_current_time < '19:00:00' THEN
    v_meal := 'Evening Snack';
    v_meal_start := '17:00:00';
    v_meal_end := '19:00:00';
    v_is_open := TRUE;
    v_in_normal_window := TRUE;
  END IF;

  -- Handle override when outside normal window
  IF NOT v_in_normal_window AND v_override_enabled AND v_override_at IS NOT NULL THEN
    -- Check 2-minute expiry
    IF v_now - v_override_at > INTERVAL '2 minutes' THEN
      -- Auto-disable override
      UPDATE voting_override SET is_enabled = FALSE, enabled_at = NULL, enabled_by = NULL, updated_at = now() WHERE id = 1;
      v_override_enabled := FALSE;
    ELSE
      -- Override is valid — determine next upcoming meal
      v_is_open := TRUE;
      v_override_active := TRUE;

      IF v_current_time < '07:00:00' THEN
        v_meal := 'Breakfast';
        v_meal_start := '07:00:00';
        v_meal_end := '10:30:00';
        v_target_date := v_current_date;
      ELSIF v_current_time >= '10:30:00' AND v_current_time < '12:00:00' THEN
        v_meal := 'Lunch';
        v_meal_start := '12:00:00';
        v_meal_end := '14:30:00';
        v_target_date := v_current_date;
      ELSIF v_current_time >= '14:30:00' AND v_current_time < '17:00:00' THEN
        v_meal := 'Evening Snack';
        v_meal_start := '17:00:00';
        v_meal_end := '19:00:00';
        v_target_date := v_current_date;
      ELSIF v_current_time >= '19:00:00' THEN
        v_meal := 'Breakfast';
        v_meal_start := '07:00:00';
        v_meal_end := '10:30:00';
        v_target_date := v_current_date + 1;
      END IF;

      -- Ensure records exist for target date (might be next day)
      IF v_target_date != v_current_date THEN
        PERFORM ensure_meal_records(v_target_date);
      END IF;

      v_day := trim(to_char(v_target_date, 'Day'));
    END IF;
  END IF;

  -- If override is active during a normal window, just mark it
  IF v_in_normal_window AND v_override_enabled THEN
    v_override_active := TRUE;
  END IF;

  IF v_is_open THEN
    SELECT id INTO v_record_id
    FROM meal_records
    WHERE date = v_target_date AND meal = v_meal;
  END IF;

  RETURN json_build_object(
    'is_open', v_is_open,
    'current_date', v_target_date,
    'current_time', v_current_time::TEXT,
    'day', v_day,
    'meal', v_meal,
    'meal_start', v_meal_start::TEXT,
    'meal_end', v_meal_end::TEXT,
    'meal_record_id', v_record_id,
    'server_time', v_now,
    'override_active', v_override_active
  );
END;
$$;

-- ============================================================
-- UPDATED FUNCTION: submit_vote
-- Now includes override awareness + next-meal assignment
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
  v_target_date DATE;
  v_record_id UUID;
  v_vote_id UUID;
  v_in_normal_window BOOLEAN := FALSE;
  v_override_enabled BOOLEAN := FALSE;
  v_override_at TIMESTAMPTZ;
BEGIN
  -- Validate mood
  IF p_mood NOT IN ('very_happy', 'happy', 'normal', 'sad') THEN
    RETURN json_build_object('success', FALSE, 'error', 'Invalid mood value');
  END IF;

  v_now := now();
  v_colombo_now := v_now AT TIME ZONE 'Asia/Colombo';
  v_current_date := v_colombo_now::DATE;
  v_current_time := v_colombo_now::TIME;
  v_target_date := v_current_date;

  -- Determine current meal period (normal schedule)
  IF v_current_time >= '07:00:00' AND v_current_time < '10:30:00' THEN
    v_meal := 'Breakfast';
    v_in_normal_window := TRUE;
  ELSIF v_current_time >= '12:00:00' AND v_current_time < '14:30:00' THEN
    v_meal := 'Lunch';
    v_in_normal_window := TRUE;
  ELSIF v_current_time >= '17:00:00' AND v_current_time < '19:00:00' THEN
    v_meal := 'Evening Snack';
    v_in_normal_window := TRUE;
  END IF;

  -- If not in normal window, check override
  IF NOT v_in_normal_window THEN
    SELECT is_enabled, enabled_at INTO v_override_enabled, v_override_at
    FROM voting_override WHERE id = 1;

    IF NOT v_override_enabled OR v_override_at IS NULL THEN
      RETURN json_build_object('success', FALSE, 'error', 'Voting is currently closed. No active meal period.');
    END IF;

    -- Check 2-minute expiry
    IF v_now - v_override_at > INTERVAL '2 minutes' THEN
      UPDATE voting_override SET is_enabled = FALSE, enabled_at = NULL, enabled_by = NULL, updated_at = now() WHERE id = 1;
      RETURN json_build_object('success', FALSE, 'error', 'Voting override has expired.');
    END IF;

    -- Determine next upcoming meal
    IF v_current_time < '07:00:00' THEN
      v_meal := 'Breakfast';
      v_target_date := v_current_date;
    ELSIF v_current_time >= '10:30:00' AND v_current_time < '12:00:00' THEN
      v_meal := 'Lunch';
      v_target_date := v_current_date;
    ELSIF v_current_time >= '14:30:00' AND v_current_time < '17:00:00' THEN
      v_meal := 'Evening Snack';
      v_target_date := v_current_date;
    ELSIF v_current_time >= '19:00:00' THEN
      v_meal := 'Breakfast';
      v_target_date := v_current_date + 1;
    END IF;
  END IF;

  -- Ensure records exist
  PERFORM ensure_meal_records(v_target_date);

  -- Get the meal record
  SELECT id INTO v_record_id
  FROM meal_records
  WHERE date = v_target_date AND meal = v_meal;

  IF v_record_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Meal record not found');
  END IF;

  -- Insert the individual vote
  INSERT INTO meal_votes (meal_record_id, mood, voted_at)
  VALUES (v_record_id, p_mood, v_now)
  RETURNING id INTO v_vote_id;

  -- Update the aggregate count atomically
  IF p_mood = 'very_happy' THEN
    UPDATE meal_records SET very_happy_count = very_happy_count + 1, last_vote_time = v_now, updated_at = now() WHERE id = v_record_id;
  ELSIF p_mood = 'happy' THEN
    UPDATE meal_records SET happy_count = happy_count + 1, last_vote_time = v_now, updated_at = now() WHERE id = v_record_id;
  ELSIF p_mood = 'normal' THEN
    UPDATE meal_records SET normal_count = normal_count + 1, last_vote_time = v_now, updated_at = now() WHERE id = v_record_id;
  ELSIF p_mood = 'sad' THEN
    UPDATE meal_records SET sad_count = sad_count + 1, last_vote_time = v_now, updated_at = now() WHERE id = v_record_id;
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
-- GRANTS for new functions
-- ============================================================
GRANT EXECUTE ON FUNCTION toggle_voting_override(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_voting_override_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_voting_override_status() TO anon;
