-- ============================================
-- Fix: Create parent_children table
-- The API code uses parent_children but original schema
-- only has parent_student_links. This creates the proper table.
-- ============================================

CREATE TABLE IF NOT EXISTS parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relation VARCHAR(50) CHECK (relation IN ('father', 'mother', 'guardian', 'other')),
  child_gender VARCHAR(10) CHECK (child_gender IN ('male', 'female')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'removed')),
  link_code VARCHAR(8),
  link_code_expires_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_children_parent_id ON parent_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_child_id ON parent_children(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_child_status ON parent_children(child_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_children_parent_status ON parent_children(parent_id, status);

-- Migrate data from old parent_student_links table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_student_links') THEN
    INSERT INTO parent_children (parent_id, child_id, relation, status, created_at)
    SELECT parent_id, student_id,
      LOWER(relationship_type),
      CASE WHEN is_active THEN 'active' ELSE 'removed' END,
      created_at
    FROM parent_student_links
    ON CONFLICT (parent_id, child_id) DO NOTHING;
  END IF;
END $$;
