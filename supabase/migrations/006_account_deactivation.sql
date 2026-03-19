-- profiles에 deactivated_at 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- 재활성화 요청 테이블
CREATE TABLE IF NOT EXISTS reactivation_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  username     TEXT NOT NULL,
  display_name TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note   TEXT,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reactivation_requests_status ON reactivation_requests(status);
CREATE INDEX IF NOT EXISTS idx_reactivation_requests_user_id ON reactivation_requests(user_id);
