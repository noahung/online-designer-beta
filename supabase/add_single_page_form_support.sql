-- ============================================================
-- Single-Page Form Support Migration
-- Run this in your Supabase SQL Editor after add_form_type.sql
-- ============================================================

-- ── 1. Add form_type column to forms table (idempotent) ──────
ALTER TABLE forms ADD COLUMN IF NOT EXISTS form_type text NOT NULL DEFAULT 'multi_step';
UPDATE forms SET form_type = 'multi_step' WHERE form_type IS NULL;


-- ── 2. Add sp_* values to the question_type enum ─────────────
-- We do this safely with DO blocks so re-running is harmless.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_short_text') THEN
    ALTER TYPE question_type ADD VALUE 'sp_short_text';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_long_text') THEN
    ALTER TYPE question_type ADD VALUE 'sp_long_text';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_email') THEN
    ALTER TYPE question_type ADD VALUE 'sp_email';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_phone') THEN
    ALTER TYPE question_type ADD VALUE 'sp_phone';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_address') THEN
    ALTER TYPE question_type ADD VALUE 'sp_address';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_website') THEN
    ALTER TYPE question_type ADD VALUE 'sp_website';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_multiple_choice') THEN
    ALTER TYPE question_type ADD VALUE 'sp_multiple_choice';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_dropdown') THEN
    ALTER TYPE question_type ADD VALUE 'sp_dropdown';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_picture_choice') THEN
    ALTER TYPE question_type ADD VALUE 'sp_picture_choice';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_yes_no') THEN
    ALTER TYPE question_type ADD VALUE 'sp_yes_no';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_checkbox') THEN
    ALTER TYPE question_type ADD VALUE 'sp_checkbox';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_legal') THEN
    ALTER TYPE question_type ADD VALUE 'sp_legal';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_number') THEN
    ALTER TYPE question_type ADD VALUE 'sp_number';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_date') THEN
    ALTER TYPE question_type ADD VALUE 'sp_date';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_file_upload') THEN
    ALTER TYPE question_type ADD VALUE 'sp_file_upload';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_rating') THEN
    ALTER TYPE question_type ADD VALUE 'sp_rating';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_opinion_scale') THEN
    ALTER TYPE question_type ADD VALUE 'sp_opinion_scale';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_nps') THEN
    ALTER TYPE question_type ADD VALUE 'sp_nps';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'sp_statement') THEN
    ALTER TYPE question_type ADD VALUE 'sp_statement';
  END IF;
END $$;


-- ── 3. Add new columns to form_steps for single-page fields ──
-- These store extra config that single-page field types need.
-- NOTE: responses table is NOT modified — single-page answers are stored
-- as response_answers rows (same as multi-step), keeping everything compatible.

ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS placeholder       text;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS allow_multiple    boolean DEFAULT false;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_min_label   text;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_max_label   text;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS number_min        numeric;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS number_max        numeric;


-- ── 4. Verify ─────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'form_steps'
  AND column_name IN (
    'placeholder','allow_multiple','scale_min_label',
    'scale_max_label','number_min','number_max',
    'scale_min','scale_max','max_file_size','allowed_file_types'
  )
ORDER BY column_name;

SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'question_type'
  AND e.enumlabel LIKE 'sp_%'
ORDER BY enumlabel;
