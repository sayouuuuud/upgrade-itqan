-- ============================================
-- Community Platform: Forum + Articles + Consultations
-- - Extends forum_posts/forum_replies with community scope + Q&A mode
-- - Adds moderation primitives (hidden, reports, reply likes)
-- - Adds articles + article comments + article likes
-- - Wires triggers + indexes
-- ============================================

BEGIN;

-- ============================================
-- 1) FORUM EXPANSION (extend existing forum_posts/forum_replies)
-- ============================================

-- community: which sub-platform this thread belongs to.
--   'academy' = academy members only
--   'maqraa'  = maqraa (quran reciter) members only
-- post_type:
--   'discussion' = classic forum thread
--   'qna'        = consultation (open Q&A, anyone can answer, best-answer enabled)
ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS community VARCHAR(20) DEFAULT 'academy'
    CHECK (community IN ('academy','maqraa')),
  ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'discussion'
    CHECK (post_type IN ('discussion','qna')),
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
  ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS best_reply_id UUID,  -- FK added below to avoid forward-ref ordering
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Expand category enum without dropping data: the existing CHECK constraint allowed
-- only a fixed set. We replace it with a wider set that covers academy + maqraa.
ALTER TABLE forum_posts
  DROP CONSTRAINT IF EXISTS forum_posts_category_check;
ALTER TABLE forum_posts
  ADD CONSTRAINT forum_posts_category_check
  CHECK (category IN (
    -- academy categories
    'general','tarbiya','academic','announcements','questions','advice',
    -- maqraa categories
    'tajweed','qiraat','hifd',
    -- legacy values kept for back-compat with existing rows
    'quran','fiqh','youth','sisters'
  ));

CREATE INDEX IF NOT EXISTS idx_forum_posts_community
  ON forum_posts(community, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_post_type
  ON forum_posts(post_type, community);
CREATE INDEX IF NOT EXISTS idx_forum_posts_hidden
  ON forum_posts(is_hidden);

-- Best answer for Q&A threads. References forum_replies(id) added now that
-- forum_replies already exists from the academy expansion migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'forum_posts_best_reply_id_fkey'
      AND table_name = 'forum_posts'
  ) THEN
    ALTER TABLE forum_posts
      ADD CONSTRAINT forum_posts_best_reply_id_fkey
      FOREIGN KEY (best_reply_id) REFERENCES forum_replies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 2) REPLY LIKES (likes_count column existed without a tracking table)
-- ============================================

CREATE TABLE IF NOT EXISTS forum_reply_likes (
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reply_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user
  ON forum_reply_likes(user_id);

-- Keep forum_replies.likes_count in sync via trigger
CREATE OR REPLACE FUNCTION sync_forum_reply_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_replies
      SET likes_count = likes_count + 1
      WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_replies
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_forum_reply_likes_count ON forum_reply_likes;
CREATE TRIGGER trg_sync_forum_reply_likes_count
  AFTER INSERT OR DELETE ON forum_reply_likes
  FOR EACH ROW EXECUTE FUNCTION sync_forum_reply_likes_count();

-- ============================================
-- 3) FORUM REPORTS (bullhorn)
-- ============================================

CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post','reply')),
  target_id   UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community   VARCHAR(20) NOT NULL CHECK (community IN ('academy','maqraa')),
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed','actioned')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_reports_status
  ON forum_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_reports_community
  ON forum_reports(community, status);
CREATE INDEX IF NOT EXISTS idx_forum_reports_target
  ON forum_reports(target_type, target_id);

-- ============================================
-- 4) ARTICLES
-- ============================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community VARCHAR(20) NOT NULL DEFAULT 'academy'
    CHECK (community IN ('academy','maqraa')),
  title VARCHAR(255) NOT NULL,
  slug  VARCHAR(280) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,              -- markdown
  cover_image_url TEXT,
  category VARCHAR(40) NOT NULL CHECK (category IN
    -- academy
    ('tarbiya','academic','general',
    -- maqraa
     'tajweed','qiraat','hifd',
    -- shared
     'fiqh','aqeedah','seerah','tafseer','parenting')),
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_review','published','rejected','archived')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejected_reason TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reading_minutes INTEGER,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_status_pub
  ON articles(community, status, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_articles_author
  ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category
  ON articles(community, category);
CREATE INDEX IF NOT EXISTS idx_articles_slug
  ON articles(slug);

-- ============================================
-- 5) ARTICLE LIKES
-- ============================================

CREATE TABLE IF NOT EXISTS article_likes (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_article_likes_user
  ON article_likes(user_id);

CREATE OR REPLACE FUNCTION sync_article_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE articles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_article_likes_count ON article_likes;
CREATE TRIGGER trg_sync_article_likes_count
  AFTER INSERT OR DELETE ON article_likes
  FOR EACH ROW EXECUTE FUNCTION sync_article_likes_count();

-- ============================================
-- 6) ARTICLE COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  hidden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  hidden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article
  ON article_comments(article_id, created_at);
CREATE INDEX IF NOT EXISTS idx_article_comments_author
  ON article_comments(author_id);

CREATE OR REPLACE FUNCTION sync_article_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE articles SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_article_comments_count ON article_comments;
CREATE TRIGGER trg_sync_article_comments_count
  AFTER INSERT OR DELETE ON article_comments
  FOR EACH ROW EXECUTE FUNCTION sync_article_comments_count();

-- ============================================
-- 7) updated_at TRIGGERS for new tables
-- (reuse update_academy_updated_at() from 011-academy-expansion.sql)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_articles_updated_at') THEN
    CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
      FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_article_comments_updated_at') THEN
    CREATE TRIGGER update_article_comments_updated_at BEFORE UPDATE ON article_comments
      FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
END $$;

COMMIT;
