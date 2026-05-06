-- =============================================
-- 002_images_table.sql
-- Binary image storage in PostgreSQL
-- =============================================

CREATE TABLE IF NOT EXISTS images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data        BYTEA NOT NULL,
  mime_type   VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
  filename    VARCHAR(255),
  file_size   INTEGER,
  folder      VARCHAR(100) DEFAULT 'general',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_folder ON images(folder);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at);
