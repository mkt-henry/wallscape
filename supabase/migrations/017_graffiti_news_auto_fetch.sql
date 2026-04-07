-- 그래피티 뉴스 자동 수집을 위한 컬럼 추가
ALTER TABLE graffiti_news ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE graffiti_news ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE graffiti_news ADD COLUMN IF NOT EXISTS is_auto BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE graffiti_news ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- source_url 중복 방지 (자동 수집 뉴스만)
CREATE UNIQUE INDEX IF NOT EXISTS idx_graffiti_news_source_url
  ON graffiti_news(source_url) WHERE source_url IS NOT NULL;
