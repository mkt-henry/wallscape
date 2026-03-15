-- ============================================================
-- Feedback / Contact submissions
-- ============================================================

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback', 'bug', 'contact', 'partnership')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anyone can insert, only service role can read/update/delete
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (TRUE);

-- Blocked via RLS for anon/authenticated — use service role key in admin API
CREATE POLICY "Only admins can read feedback"
  ON feedback FOR SELECT
  USING (FALSE);

CREATE POLICY "Only admins can update feedback"
  ON feedback FOR UPDATE
  USING (FALSE);

CREATE POLICY "Only admins can delete feedback"
  ON feedback FOR DELETE
  USING (FALSE);
