-- ============================================
-- Phase: مكتبة الكتب العامة (Public Books Library)
-- Shared between academy (student/teacher/admin) and
-- maqraa (student/reader/admin). Multi-language PDFs.
-- ============================================

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  description TEXT,
  cover_image_url TEXT,
  cover_image_key TEXT,
  pages_count INTEGER,
  publish_date DATE,
  category VARCHAR(50),
  is_published BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_is_published ON books(is_published);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_display_order ON books(display_order);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);

CREATE TABLE IF NOT EXISTS book_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  language VARCHAR(20) NOT NULL,
  language_label VARCHAR(120),
  pdf_url TEXT NOT NULL,
  pdf_key TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, language)
);

CREATE INDEX IF NOT EXISTS idx_book_files_book_id ON book_files(book_id);
CREATE INDEX IF NOT EXISTS idx_book_files_language ON book_files(language);
