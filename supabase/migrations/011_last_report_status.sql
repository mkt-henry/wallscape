-- Add last_report_status to track the most recent report's status
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS last_report_status TEXT CHECK (last_report_status IN ('still_there', 'gone'));
