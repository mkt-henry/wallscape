-- 그래피티 뉴스 테이블
CREATE TABLE IF NOT EXISTS graffiti_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0 NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 활성화
ALTER TABLE graffiti_news ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "Anyone can read news"
  ON graffiti_news FOR SELECT
  USING (true);

-- 관리자만 작성 가능
CREATE POLICY "Admin can insert news"
  ON graffiti_news FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'bpark0718@gmail.com');

-- 관리자만 수정 가능
CREATE POLICY "Admin can update news"
  ON graffiti_news FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'bpark0718@gmail.com');

-- 관리자만 삭제 가능
CREATE POLICY "Admin can delete news"
  ON graffiti_news FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'bpark0718@gmail.com');

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_graffiti_news_updated_at
  BEFORE UPDATE ON graffiti_news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- view_count 증가 함수
CREATE OR REPLACE FUNCTION increment_news_view(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE graffiti_news SET view_count = view_count + 1 WHERE id = news_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
