-- 019: Discord 알림 (pg_net 트리거)
-- posts / board_posts / artist_applications / feedback INSERT 시 Discord 알림 발송

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ----------------------------------------------------------------
-- 설정 테이블 (webhook URL은 git에 포함하지 않고 Supabase Studio에서 직접 설정)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discord_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO discord_config (key, value) VALUES
  ('webhook_main',     ''),
  ('webhook_feedback', ''),
  ('app_url',          'https://wallscape.app')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE discord_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discord_config_deny_all" ON discord_config USING (false);

-- ----------------------------------------------------------------
-- 내부 헬퍼
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION _discord_cfg(k TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT value FROM discord_config WHERE key = k;
$$;

CREATE OR REPLACE FUNCTION _discord_truncate(txt TEXT, max_len INT DEFAULT 200)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN txt IS NULL OR trim(txt) = '' THEN '(내용 없음)'
    WHEN length(trim(txt)) <= max_len    THEN trim(txt)
    ELSE left(trim(txt), max_len - 1) || '…'
  END;
$$;

CREATE OR REPLACE FUNCTION _discord_send(wh_key TEXT, embed JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  url TEXT := _discord_cfg(wh_key);
BEGIN
  IF url IS NULL OR url = '' THEN
    RAISE WARNING '[discord] webhook not configured: %', wh_key;
    RETURN;
  END IF;
  PERFORM net.http_post(
    url  := url,
    body := jsonb_build_object('embeds', jsonb_build_array(embed))
  );
END;
$$;

-- ----------------------------------------------------------------
-- posts 트리거
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION _discord_notify_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  author       TEXT;
  avatar       TEXT;
  location_str TEXT;
  embed        JSONB;
BEGIN
  SELECT
    COALESCE(NULLIF(trim(display_name), ''), username),
    avatar_url
  INTO author, avatar
  FROM profiles WHERE id = NEW.user_id;

  author := COALESCE(author, '(알 수 없음)');

  location_str := trim(COALESCE(NEW.city, '') || ' ' || COALESCE(NEW.district, ''));
  IF location_str = '' THEN
    location_str := COALESCE(NEW.address, '(위치 미확인)');
  END IF;

  embed := jsonb_build_object(
    'title',       '🎨 새 그래피티 — ' || NEW.title,
    'description', _discord_truncate(NEW.description),
    'url',         _discord_cfg('app_url') || '/ko/feed/' || NEW.id,
    'color',       2278750,  -- #22c55e
    'timestamp',   NEW.created_at,
    'author',      jsonb_build_object('name', author) ||
                   CASE WHEN avatar IS NOT NULL AND avatar != ''
                        THEN jsonb_build_object('icon_url', avatar)
                        ELSE '{}'::jsonb END,
    'image',       jsonb_build_object('url', NEW.image_url),
    'fields',      jsonb_build_array(
                     jsonb_build_object('name', '위치',     'value', location_str,                        'inline', true),
                     jsonb_build_object('name', '카테고리', 'value', COALESCE(NEW.category, '(없음)'), 'inline', true)
                   )
  );

  PERFORM _discord_send('webhook_main', embed);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[discord_notify_post] %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discord_notify_posts ON posts;
CREATE TRIGGER discord_notify_posts
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION _discord_notify_post();

-- ----------------------------------------------------------------
-- board_posts 트리거
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION _discord_notify_board_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  author TEXT;
  avatar TEXT;
  embed  JSONB;
BEGIN
  SELECT
    COALESCE(NULLIF(trim(display_name), ''), username),
    avatar_url
  INTO author, avatar
  FROM profiles WHERE id = NEW.user_id;

  author := COALESCE(author, '(알 수 없음)');

  embed := jsonb_build_object(
    'title',       '💬 커뮤니티 — ' || NEW.title,
    'description', _discord_truncate(NEW.content),
    'url',         _discord_cfg('app_url') || '/ko/community/' || NEW.id,
    'color',       3900150,  -- #3b82f6
    'timestamp',   NEW.created_at,
    'author',      jsonb_build_object('name', author) ||
                   CASE WHEN avatar IS NOT NULL AND avatar != ''
                        THEN jsonb_build_object('icon_url', avatar)
                        ELSE '{}'::jsonb END,
    'fields',      jsonb_build_array(
                     jsonb_build_object('name', '카테고리', 'value', NEW.category, 'inline', true)
                   )
  ) ||
  CASE WHEN NEW.image_url IS NOT NULL
       THEN jsonb_build_object('image', jsonb_build_object('url', NEW.image_url))
       ELSE '{}'::jsonb END;

  PERFORM _discord_send('webhook_main', embed);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[discord_notify_board_post] %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discord_notify_board_posts ON board_posts;
CREATE TRIGGER discord_notify_board_posts
  AFTER INSERT ON board_posts
  FOR EACH ROW EXECUTE FUNCTION _discord_notify_board_post();

-- ----------------------------------------------------------------
-- artist_applications 트리거
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION _discord_notify_artist_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  author TEXT;
  avatar TEXT;
  fields JSONB;
  embed  JSONB;
BEGIN
  SELECT
    COALESCE(NULLIF(trim(display_name), ''), username),
    avatar_url
  INTO author, avatar
  FROM profiles WHERE id = NEW.user_id;

  author := COALESCE(author, '(알 수 없음)');

  fields := jsonb_build_array(
    jsonb_build_object(
      'name', '등록 유형',
      'value', CASE WHEN NEW.registration_type = 'other' THEN '대리 등록' ELSE '본인 등록' END,
      'inline', true
    )
  );
  IF NEW.registration_type = 'other' AND NEW.target_username IS NOT NULL THEN
    fields := fields || jsonb_build_array(
      jsonb_build_object('name', '대상 유저명', 'value', NEW.target_username, 'inline', true)
    );
  END IF;
  IF NEW.instagram_handle IS NOT NULL THEN
    fields := fields || jsonb_build_array(
      jsonb_build_object('name', '인스타', 'value', '@' || NEW.instagram_handle, 'inline', true)
    );
  END IF;
  IF NEW.website IS NOT NULL THEN
    fields := fields || jsonb_build_array(
      jsonb_build_object('name', '웹사이트', 'value', NEW.website, 'inline', false)
    );
  END IF;

  embed := jsonb_build_object(
    'title',       '🎤 아티스트 신청 — ' || NEW.artist_name,
    'description', _discord_truncate(COALESCE(NEW.note, NEW.bio)),
    'url',         _discord_cfg('app_url') || '/ko/admin',
    'color',       11032055,  -- #a855f7
    'timestamp',   NEW.created_at,
    'author',      jsonb_build_object('name', author) ||
                   CASE WHEN avatar IS NOT NULL AND avatar != ''
                        THEN jsonb_build_object('icon_url', avatar)
                        ELSE '{}'::jsonb END,
    'fields',      fields
  );

  PERFORM _discord_send('webhook_main', embed);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[discord_notify_artist_application] %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discord_notify_artist_applications ON artist_applications;
CREATE TRIGGER discord_notify_artist_applications
  AFTER INSERT ON artist_applications
  FOR EACH ROW EXECUTE FUNCTION _discord_notify_artist_application();

-- ----------------------------------------------------------------
-- feedback 트리거
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION _discord_notify_feedback()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  embed JSONB;
BEGIN
  embed := jsonb_build_object(
    'title',       '📩 새 피드백 — ' || NEW.type,
    'description', _discord_truncate(NEW.message, 4000),
    'url',         _discord_cfg('app_url') || '/ko/admin/feedback',
    'color',       15381256,  -- #eab308
    'timestamp',   NEW.created_at,
    'author',      jsonb_build_object(
                     'name', COALESCE(NULLIF(trim(NEW.name), ''), '(알 수 없음)')
                   ),
    'fields',      jsonb_build_array(
                     jsonb_build_object('name', '유형',   'value', NEW.type,  'inline', true),
                     jsonb_build_object('name', '이메일', 'value', NEW.email, 'inline', true)
                   )
  );

  PERFORM _discord_send('webhook_feedback', embed);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[discord_notify_feedback] %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discord_notify_feedback ON feedback;
CREATE TRIGGER discord_notify_feedback
  AFTER INSERT ON feedback
  FOR EACH ROW EXECUTE FUNCTION _discord_notify_feedback();
