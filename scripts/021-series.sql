-- ============================================
-- Phase: سلاسل الدروس (Lesson Series)
-- Series feature: group courses and/or paths
-- into a named series (e.g. تفسير القرآن الكريم)
-- ============================================

-- ============================================
-- 1. SERIES TABLE (السلاسل)
-- ============================================

CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  subject VARCHAR(50) CHECK (subject IN ('quran', 'tajweed', 'fiqh', 'aqeedah', 'seerah', 'tafseer', 'arabic', 'general')),
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_teacher_id ON series(teacher_id);
CREATE INDEX IF NOT EXISTS idx_series_subject ON series(subject);
CREATE INDEX IF NOT EXISTS idx_series_is_published ON series(is_published);
CREATE INDEX IF NOT EXISTS idx_series_display_order ON series(display_order);

-- ============================================
-- 2. SERIES ITEMS (عناصر السلسلة)
--    Each item is either a course or a path
-- ============================================

CREATE TABLE IF NOT EXISTS series_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('course', 'path')),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_series_item_ref CHECK (
    (item_type = 'course' AND course_id IS NOT NULL AND path_id IS NULL) OR
    (item_type = 'path' AND path_id IS NOT NULL AND course_id IS NULL)
  ),
  UNIQUE(series_id, course_id),
  UNIQUE(series_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_series_items_series_id ON series_items(series_id);
CREATE INDEX IF NOT EXISTS idx_series_items_course_id ON series_items(course_id);
CREATE INDEX IF NOT EXISTS idx_series_items_path_id ON series_items(path_id);
CREATE INDEX IF NOT EXISTS idx_series_items_order ON series_items(series_id, order_index);
