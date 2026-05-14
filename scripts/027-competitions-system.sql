-- ============================================
-- Competition System Enhancement
-- Adds tajweed rules, badges, judging workflow,
-- and halqa-level leaderboard support
-- ============================================

-- 1. Enhance competitions table
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS tajweed_rules TEXT[];
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS badge_key VARCHAR(50);
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS points_multiplier DECIMAL(3,1) DEFAULT 1.0;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS halqa_id UUID REFERENCES halaqat(id) ON DELETE SET NULL;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS min_verses INTEGER DEFAULT 0;

-- 2. Enhance competition_entries table
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
  CHECK (status IN ('pending', 'evaluated', 'winner', 'disqualified'));
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS tajweed_scores JSONB DEFAULT '{}';
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS verses_count INTEGER DEFAULT 0;
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS halqa_id UUID REFERENCES halaqat(id) ON DELETE SET NULL;

-- 3. Create competition_judges junction table
CREATE TABLE IF NOT EXISTS competition_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_judges_competition ON competition_judges(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_judges_judge ON competition_judges(judge_id);

-- 4. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_competition_entries_status ON competition_entries(status);
CREATE INDEX IF NOT EXISTS idx_competition_entries_halqa ON competition_entries(halqa_id);
CREATE INDEX IF NOT EXISTS idx_competitions_halqa ON competitions(halqa_id);
CREATE INDEX IF NOT EXISTS idx_competitions_featured ON competitions(is_featured) WHERE is_featured = TRUE;

-- 5. Add competition-related badge definitions
INSERT INTO badge_definitions (badge_key, badge_name, badge_description, badge_icon, badge_color, points_awarded, criteria_type, criteria_value, category, display_order)
VALUES
  ('competition_winner', 'فائز بالمسابقة', 'فزت بالمركز الأول في مسابقة', '🏆', '#FFD700', 200, 'manual', 1, 'special', 9),
  ('tajweed_champion', 'بطل التجويد', 'فزت في مسابقة التجويد', '⭐', '#EC4899', 250, 'manual', 1, 'mastery', 10),
  ('ramadan_champion', 'بطل رمضان', 'فزت في مسابقة رمضان للحفظ', '🌙', '#6366F1', 300, 'manual', 1, 'special', 11),
  ('monthly_star', 'نجم الشهر', 'فزت في المسابقة الشهرية', '🌟', '#F59E0B', 150, 'manual', 1, 'special', 12)
ON CONFLICT (badge_key) DO NOTHING;

-- 6. Add halqa_id to user_points for halqa-level leaderboard
ALTER TABLE user_points ADD COLUMN IF NOT EXISTS halqa_id UUID REFERENCES halaqat(id) ON DELETE SET NULL;
