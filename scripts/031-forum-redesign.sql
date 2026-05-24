-- ============================================
-- Forum redesign: Reddit-style upvotes, nested replies, member bans, rules
--
-- - Adds upvote tracking on forum_posts (forum_post_likes + counter)
-- - Adds parent_reply_id on forum_replies for nested comment trees
-- - Adds community_bans for per-community member bans
-- - Adds community_rules for editable rule lists shown in the forum sidebar
-- ============================================

BEGIN;

-- ============================================
-- 1) POST UPVOTES
-- ============================================

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS forum_post_likes (
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user
  ON forum_post_likes(user_id);

CREATE OR REPLACE FUNCTION sync_forum_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts
      SET upvotes_count = upvotes_count + 1
      WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts
      SET upvotes_count = GREATEST(0, upvotes_count - 1)
      WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_forum_post_likes_count ON forum_post_likes;
CREATE TRIGGER trg_sync_forum_post_likes_count
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION sync_forum_post_likes_count();

CREATE INDEX IF NOT EXISTS idx_forum_posts_upvotes
  ON forum_posts(community, upvotes_count DESC);

-- ============================================
-- 2) NESTED REPLIES
-- ============================================

ALTER TABLE forum_replies
  ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_forum_replies_parent
  ON forum_replies(parent_reply_id);

-- ============================================
-- 3) COMMUNITY BANS
--
-- A row here means the user cannot post/reply in this community.
-- Read access is still controlled by the standard `canAccessCommunity` rules;
-- a ban is a softer, community-scoped restriction managed by the community
-- admin from the manage page.
-- ============================================

CREATE TABLE IF NOT EXISTS community_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community VARCHAR(20) NOT NULL CHECK (community IN ('academy','maqraa')),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_bans_user
  ON community_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_community_bans_community
  ON community_bans(community);

-- ============================================
-- 4) COMMUNITY RULES
--
-- One row per (community, position). Rules are displayed in the forum's
-- right rail. Admin can add/edit/reorder them from the manage page.
-- ============================================

CREATE TABLE IF NOT EXISTS community_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community VARCHAR(20) NOT NULL CHECK (community IN ('academy','maqraa')),
  position INTEGER NOT NULL DEFAULT 0,
  title VARCHAR(160) NOT NULL,
  body TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_rules_community
  ON community_rules(community, position);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_community_rules_updated_at BEFORE UPDATE ON community_rules
      FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
END $$;

-- Seed a handful of default rules per community so the sidebar isn't empty
-- on first load. Safe to re-run because we key off (community, position).
INSERT INTO community_rules (community, position, title, body)
SELECT 'academy', 1, 'احترام جميع الأعضاء', 'تجنب أي محتوى مسيء أو شخصي. النقاش بأدب أساس المجتمع.'
WHERE NOT EXISTS (SELECT 1 FROM community_rules WHERE community = 'academy' AND position = 1);

INSERT INTO community_rules (community, position, title, body)
SELECT 'academy', 2, 'محتوى مفيد فقط', 'لا للسبام أو الإعلانات. شارك تجاربك التعليمية وأسئلتك المفيدة.'
WHERE NOT EXISTS (SELECT 1 FROM community_rules WHERE community = 'academy' AND position = 2);

INSERT INTO community_rules (community, position, title, body)
SELECT 'academy', 3, 'استخدم القسم المناسب', 'اختر الفئة الصحيحة لموضوعك ليسهل وصوله للمهتمين.'
WHERE NOT EXISTS (SELECT 1 FROM community_rules WHERE community = 'academy' AND position = 3);

INSERT INTO community_rules (community, position, title, body)
SELECT 'maqraa', 1, 'احترام جميع الأعضاء', 'تجنب أي محتوى مسيء أو شخصي. النقاش بأدب أساس المجتمع.'
WHERE NOT EXISTS (SELECT 1 FROM community_rules WHERE community = 'maqraa' AND position = 1);

INSERT INTO community_rules (community, position, title, body)
SELECT 'maqraa', 2, 'محتوى متعلق بالقرآن', 'النقاش يدور حول التلاوة والتجويد والقراءات والحفظ والإجازات.'
WHERE NOT EXISTS (SELECT 1 FROM community_rules WHERE community = 'maqraa' AND position = 2);

INSERT INTO community_rules (community, position, title, body)
SELECT 'maqraa', 3, 'الإسناد للمصادر', 'اذكر المصدر عند نقل مسائل علمية أو روايات.'
WHERE NOT EXISTS (SELECT 1 FROM community_rules WHERE community = 'maqraa' AND position = 3);

COMMIT;
