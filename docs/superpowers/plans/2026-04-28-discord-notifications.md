# Discord Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send Discord notifications via Supabase Database Webhooks when a row is inserted into `posts`, `board_posts`, `artist_applications`, or `feedback` — main webhook for the first three, separate feedback webhook for the last.

**Architecture:** Each watched table has a Supabase Database Webhook posting to a single Next.js Route Handler at `/api/webhooks/discord-notify`. The handler verifies a shared-secret header, branches by `body.table`, enriches with the author's profile via the existing service-role client, builds a Discord embed, and forwards to one of two Discord webhook URLs. Failures return 5xx so Supabase retries.

**Tech Stack:** Next.js 14 App Router (Node.js runtime) · TypeScript · `@supabase/supabase-js` (existing service-role client at `src/lib/supabase/server.ts`) · Discord webhooks · Supabase Database Webhooks · `tsx` (devDep for the local verification script).

**Spec:** `docs/superpowers/specs/2026-04-28-discord-notifications-design.md`

---

## File Structure

### New
- `src/app/api/webhooks/discord-notify/route.ts` — POST handler, secret check, branching, send
- `src/lib/discord/types.ts` — Supabase webhook payload + per-table record types + Discord embed types
- `src/lib/discord/send.ts` — `sendDiscordWebhook()` with 5s AbortController timeout
- `src/lib/discord/embed.ts` — `truncate()`, `routeWebhook()`, four pure embed builders
- `fixtures/discord-webhook/posts-insert.json`
- `fixtures/discord-webhook/board_posts-insert.json`
- `fixtures/discord-webhook/artist_applications-insert.json`
- `fixtures/discord-webhook/feedback-insert.json`
- `scripts/verify-embeds.ts` — feeds fixtures into builders and prints embed JSON for visual review

### Modified
- `.env.example` — append four new env keys
- `package.json` — add `tsx` devDep, add `verify-embeds` script
- `README.md` — append section "Discord notifications setup"

### Unchanged (explicitly)
- All existing INSERT paths (`src/app/[locale]/(main)/upload/page.tsx`, `src/app/api/artist-application/route.ts`, etc.) — server-side guarantee comes from DB webhook, not from modifying clients.
- `src/lib/supabase/server.ts` — `createAdminClient()` is reused as-is.

---

## Conventions

- **Commit messages**: Korean with conventional-commit prefix (`feat:`, `docs:`, `chore:`), matching recent history (e.g. `feat: 어드민에서 수동 뉴스 수집 버튼 추가`).
- **TypeScript imports**: relative imports inside `src/lib/discord/*` (so `scripts/verify-embeds.ts` can import them via `tsx` without alias config). Path aliases (`@/`) are fine in `route.ts`.
- **Verification model**: project has no Jest/Vitest. Each task that produces logic includes a manual `npm run verify-embeds` (visual diff of embed JSON) and/or `curl` step. Steps that only emit types/strings are verified by `npm run type-check`.

---

## Task 1: 환경 변수 키와 검증 스크립트 의존성 추가

**Files:**
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Read current `.env.example` to find a sensible insertion point**

Run: `cat .env.example`

Look for an existing `SUPABASE_*` block; we'll append after the last Supabase entry.

- [ ] **Step 2: Append four new env keys to `.env.example`**

Append these lines (preserving any trailing newline at EOF):

```bash

# === Discord notifications (server-side, do NOT prefix with NEXT_PUBLIC_) ===
# Random ≥32 chars; same value goes into Supabase Database Webhook custom header `x-webhook-secret`
SUPABASE_WEBHOOK_SECRET=
# Discord webhook URLs (https://discord.com/api/webhooks/<id>/<token>)
DISCORD_WEBHOOK_MAIN=
DISCORD_WEBHOOK_FEEDBACK=
# App base URL used to build links inside Discord embeds (no trailing slash)
NEXT_PUBLIC_APP_URL=https://wallscape.app
```

Note: `SUPABASE_SERVICE_ROLE_KEY` is assumed to already exist; if it does not, also append it — but do not overwrite an existing value.

- [ ] **Step 3: Add `tsx` devDep and `verify-embeds` script**

Edit `package.json`:

In `scripts`, add (right after `"type-check"`):
```json
    "verify-embeds": "tsx scripts/verify-embeds.ts"
```

In `devDependencies`, add (alphabetical):
```json
    "tsx": "^4.19.0"
```

- [ ] **Step 4: Install the new dev dependency**

Run: `npm install`

Expected: `tsx` resolved and `package-lock.json` updated. No prod-dep changes.

- [ ] **Step 5: Commit**

```bash
git add .env.example package.json package-lock.json
git commit -m "chore: 디스코드 알림용 환경변수와 tsx 검증 스크립트 의존성 추가"
```

---

## Task 2: 타입 정의

**Files:**
- Create: `src/lib/discord/types.ts`

- [ ] **Step 1: Create `src/lib/discord/types.ts` with full content**

```ts
// Supabase Database Webhook payload (INSERT/UPDATE/DELETE share this shape)
export interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: Record<string, unknown> | null
  old_record: Record<string, unknown> | null
}

export type SupabaseWebhookTable =
  | 'posts'
  | 'board_posts'
  | 'artist_applications'
  | 'feedback'

export const SUPABASE_WEBHOOK_TABLES: SupabaseWebhookTable[] = [
  'posts',
  'board_posts',
  'artist_applications',
  'feedback',
]

// Discord embed shape (only the fields we use)
export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  timestamp?: string
  color?: number
  author?: { name: string; icon_url?: string }
  image?: { url: string }
  fields?: DiscordEmbedField[]
}

export interface DiscordWebhookBody {
  embeds: DiscordEmbed[]
  username?: string
}

// Profile fields needed to render an author block
export interface ProfileSummary {
  display_name: string | null
  username: string
  avatar_url: string | null
}

// Per-table record subsets (only fields the embed builders read)
export interface PostRecord {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string
  city: string | null
  district: string | null
  address: string | null
  category: string | null
  created_at: string
}

export interface BoardPostRecord {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  image_url: string | null
  created_at: string
}

export interface ArtistApplicationRecord {
  id: string
  user_id: string
  artist_name: string
  bio: string | null
  instagram_handle: string | null
  website: string | null
  note: string | null
  registration_type: 'self' | 'other'
  target_username: string | null
  created_at: string
}

export interface FeedbackRecord {
  id: string
  name: string
  email: string
  type: 'feedback' | 'bug' | 'contact' | 'partnership'
  message: string
  created_at: string
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0, no errors mentioning `src/lib/discord/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/discord/types.ts
git commit -m "feat: 디스코드 알림 타입 정의 추가"
```

---

## Task 3: Discord webhook 발송 헬퍼

**Files:**
- Create: `src/lib/discord/send.ts`

- [ ] **Step 1: Create `src/lib/discord/send.ts` with full content**

```ts
import type { DiscordWebhookBody } from './types'

const TIMEOUT_MS = 5000

export class DiscordSendError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'DiscordSendError'
  }
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  body: DiscordWebhookBody
): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new DiscordSendError(
        `Discord webhook returned ${res.status}: ${text.slice(0, 200)}`,
        res.status
      )
    }
  } catch (err) {
    if (err instanceof DiscordSendError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new DiscordSendError(`Discord webhook timed out after ${TIMEOUT_MS}ms`)
    }
    throw new DiscordSendError(`Discord webhook fetch failed: ${(err as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0, no errors mentioning `src/lib/discord/send.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/discord/send.ts
git commit -m "feat: 디스코드 webhook 발송 헬퍼 추가 (5초 타임아웃)"
```

---

## Task 4: Embed 빌더 (4종)

**Files:**
- Create: `src/lib/discord/embed.ts`

- [ ] **Step 1: Create `src/lib/discord/embed.ts` with full content**

```ts
import type {
  ArtistApplicationRecord,
  BoardPostRecord,
  DiscordEmbed,
  DiscordEmbedField,
  FeedbackRecord,
  PostRecord,
  ProfileSummary,
  SupabaseWebhookTable,
} from './types'

const COLOR_POSTS = 0x22c55e
const COLOR_BOARD = 0x3b82f6
const COLOR_ARTIST = 0xa855f7
const COLOR_FEEDBACK = 0xeab308

const FALLBACK_AUTHOR = '(알 수 없음)'
const FALLBACK_BODY = '(내용 없음)'
const FALLBACK_LOCATION = '(위치 미확인)'

const DEFAULT_APP_URL = 'https://wallscape.app'

export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return FALLBACK_BODY
  const trimmed = text.trim()
  if (!trimmed) return FALLBACK_BODY
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max - 1) + '…'
}

function authorName(profile: ProfileSummary | null): string {
  if (!profile) return FALLBACK_AUTHOR
  const display = profile.display_name?.trim()
  return display && display.length > 0 ? display : profile.username
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
}

export function routeWebhook(
  table: SupabaseWebhookTable
): 'main' | 'feedback' {
  return table === 'feedback' ? 'feedback' : 'main'
}

export function buildPostEmbed(
  record: PostRecord,
  profile: ProfileSummary | null
): DiscordEmbed {
  const locationParts = [record.city, record.district].filter(
    (p): p is string => Boolean(p && p.trim())
  )
  const location =
    locationParts.length > 0
      ? locationParts.join(' ')
      : record.address?.trim() || FALLBACK_LOCATION

  return {
    title: `🎨 새 그래피티 — ${record.title}`,
    description: truncate(record.description, 200),
    url: `${appUrl()}/ko/feed/${record.id}`,
    timestamp: record.created_at,
    color: COLOR_POSTS,
    author: {
      name: authorName(profile),
      icon_url: profile?.avatar_url ?? undefined,
    },
    image: { url: record.image_url },
    fields: [
      { name: '위치', value: location, inline: true },
      { name: '카테고리', value: record.category ?? '(없음)', inline: true },
    ],
  }
}

export function buildBoardPostEmbed(
  record: BoardPostRecord,
  profile: ProfileSummary | null
): DiscordEmbed {
  const embed: DiscordEmbed = {
    title: `💬 커뮤니티 — ${record.title}`,
    description: truncate(record.content, 200),
    url: `${appUrl()}/ko/community/${record.id}`,
    timestamp: record.created_at,
    color: COLOR_BOARD,
    author: {
      name: authorName(profile),
      icon_url: profile?.avatar_url ?? undefined,
    },
    fields: [{ name: '카테고리', value: record.category, inline: true }],
  }
  if (record.image_url) {
    embed.image = { url: record.image_url }
  }
  return embed
}

export function buildArtistApplicationEmbed(
  record: ArtistApplicationRecord,
  profile: ProfileSummary | null
): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    {
      name: '등록 유형',
      value: record.registration_type === 'other' ? '대리 등록' : '본인 등록',
      inline: true,
    },
  ]
  if (record.registration_type === 'other' && record.target_username) {
    fields.push({
      name: '대상 유저명',
      value: record.target_username,
      inline: true,
    })
  }
  if (record.instagram_handle) {
    fields.push({
      name: '인스타',
      value: `@${record.instagram_handle}`,
      inline: true,
    })
  }
  if (record.website) {
    fields.push({ name: '웹사이트', value: record.website, inline: false })
  }

  return {
    title: `🎤 아티스트 신청 — ${record.artist_name}`,
    description: truncate(record.note ?? record.bio, 200),
    url: `${appUrl()}/ko/admin`,
    timestamp: record.created_at,
    color: COLOR_ARTIST,
    author: {
      name: authorName(profile),
      icon_url: profile?.avatar_url ?? undefined,
    },
    fields,
  }
}

export function buildFeedbackEmbed(record: FeedbackRecord): DiscordEmbed {
  return {
    title: `📩 새 피드백 — ${record.type}`,
    description: truncate(record.message, 4000),
    url: `${appUrl()}/ko/admin/feedback`,
    timestamp: record.created_at,
    color: COLOR_FEEDBACK,
    author: { name: record.name?.trim() || FALLBACK_AUTHOR },
    fields: [
      { name: '유형', value: record.type, inline: true },
      { name: '이메일', value: record.email, inline: true },
    ],
  }
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/discord/embed.ts
git commit -m "feat: 디스코드 임베드 빌더 4종 추가 (posts/board/artist/feedback)"
```

---

## Task 5: Fixtures + 검증 스크립트로 빌더 결과 시각 확인

**Files:**
- Create: `fixtures/discord-webhook/posts-insert.json`
- Create: `fixtures/discord-webhook/board_posts-insert.json`
- Create: `fixtures/discord-webhook/artist_applications-insert.json`
- Create: `fixtures/discord-webhook/feedback-insert.json`
- Create: `scripts/verify-embeds.ts`

- [ ] **Step 1: Create `fixtures/discord-webhook/posts-insert.json`**

```json
{
  "type": "INSERT",
  "table": "posts",
  "schema": "public",
  "old_record": null,
  "record": {
    "id": "11111111-1111-1111-1111-111111111111",
    "user_id": "22222222-2222-2222-2222-222222222222",
    "title": "강남 빌딩 옥상 그래피티",
    "description": "오늘 발견한 멋진 작품. 색감이 인상적이라 공유합니다. 작가는 미상이지만 스타일이 독특함.",
    "image_url": "https://example.com/storage/post-images/sample.jpg",
    "city": "서울특별시",
    "district": "강남구",
    "address": "서울특별시 강남구 테헤란로 123",
    "category": "mural",
    "created_at": "2026-04-28T10:00:00.000Z"
  }
}
```

- [ ] **Step 2: Create `fixtures/discord-webhook/board_posts-insert.json`**

```json
{
  "type": "INSERT",
  "table": "board_posts",
  "schema": "public",
  "old_record": null,
  "record": {
    "id": "33333333-3333-3333-3333-333333333333",
    "user_id": "22222222-2222-2222-2222-222222222222",
    "title": "이번 주말 합법벽 작업하실 분?",
    "content": "토요일 오후에 마포구 합법벽에서 작업 예정입니다. 같이 하실 분 댓글 남겨주세요.",
    "category": "general",
    "image_url": null,
    "created_at": "2026-04-28T10:05:00.000Z"
  }
}
```

- [ ] **Step 3: Create `fixtures/discord-webhook/artist_applications-insert.json`**

```json
{
  "type": "INSERT",
  "table": "artist_applications",
  "schema": "public",
  "old_record": null,
  "record": {
    "id": "44444444-4444-4444-4444-444444444444",
    "user_id": "22222222-2222-2222-2222-222222222222",
    "artist_name": "ZIRO",
    "bio": "10년차 그래피티 작가. 서울/부산 활동.",
    "instagram_handle": "ziro_kr",
    "website": "https://ziro.example.com",
    "note": "본인 인증 자료 첨부함.",
    "registration_type": "self",
    "target_username": null,
    "created_at": "2026-04-28T10:10:00.000Z"
  }
}
```

- [ ] **Step 4: Create `fixtures/discord-webhook/feedback-insert.json`**

```json
{
  "type": "INSERT",
  "table": "feedback",
  "schema": "public",
  "old_record": null,
  "record": {
    "id": "55555555-5555-5555-5555-555555555555",
    "name": "홍길동",
    "email": "user@example.com",
    "type": "bug",
    "message": "지도 화면에서 마커를 클릭해도 팝업이 안 뜹니다. iOS Safari, 17.5 버전입니다.",
    "created_at": "2026-04-28T10:15:00.000Z"
  }
}
```

- [ ] **Step 5: Create `scripts/verify-embeds.ts`**

```ts
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildArtistApplicationEmbed,
  buildBoardPostEmbed,
  buildFeedbackEmbed,
  buildPostEmbed,
  routeWebhook,
} from '../src/lib/discord/embed'
import type {
  ArtistApplicationRecord,
  BoardPostRecord,
  FeedbackRecord,
  PostRecord,
  ProfileSummary,
  SupabaseWebhookPayload,
} from '../src/lib/discord/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = join(__dirname, '..', 'fixtures', 'discord-webhook')

const SAMPLE_PROFILE: ProfileSummary = {
  display_name: '테스터',
  username: 'tester',
  avatar_url: 'https://example.com/avatar.png',
}

function loadFixture<T>(file: string): T {
  const raw = readFileSync(join(FIXTURE_DIR, file), 'utf-8')
  const parsed = JSON.parse(raw) as SupabaseWebhookPayload
  return parsed.record as unknown as T
}

function header(label: string): void {
  console.log(`\n========== ${label} (route: ${routeWebhook(label as any)}) ==========`)
}

header('posts')
console.dir(
  buildPostEmbed(loadFixture<PostRecord>('posts-insert.json'), SAMPLE_PROFILE),
  { depth: null }
)

header('board_posts')
console.dir(
  buildBoardPostEmbed(
    loadFixture<BoardPostRecord>('board_posts-insert.json'),
    SAMPLE_PROFILE
  ),
  { depth: null }
)

header('artist_applications')
console.dir(
  buildArtistApplicationEmbed(
    loadFixture<ArtistApplicationRecord>('artist_applications-insert.json'),
    SAMPLE_PROFILE
  ),
  { depth: null }
)

header('feedback')
console.dir(
  buildFeedbackEmbed(loadFixture<FeedbackRecord>('feedback-insert.json')),
  { depth: null }
)
```

- [ ] **Step 6: Run the script and visually inspect the four embed objects**

Run: `npm run verify-embeds`

Expected: four labeled blocks of embed JSON. Visually confirm:
- `posts` has `image.url` set, `위치` field shows "서울특별시 강남구"
- `board_posts` has NO `image` key (fixture had null), category field present
- `artist_applications` has `등록 유형: 본인 등록`, instagram and website fields present
- `feedback` has `author.name = "홍길동"`, no `image` key, type and email fields present
- Hangul renders without mojibake

If any output is wrong, fix `embed.ts` (not the fixtures) and re-run before committing.

- [ ] **Step 7: Commit**

```bash
git add fixtures/discord-webhook scripts/verify-embeds.ts
git commit -m "test: 디스코드 임베드 빌더용 fixture와 검증 스크립트 추가"
```

---

## Task 6: Webhook 핸들러 작성

**Files:**
- Create: `src/app/api/webhooks/discord-notify/route.ts`

- [ ] **Step 1: Create `src/app/api/webhooks/discord-notify/route.ts` with full content**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  buildArtistApplicationEmbed,
  buildBoardPostEmbed,
  buildFeedbackEmbed,
  buildPostEmbed,
  routeWebhook,
} from '@/lib/discord/embed'
import { sendDiscordWebhook } from '@/lib/discord/send'
import {
  SUPABASE_WEBHOOK_TABLES,
  type ArtistApplicationRecord,
  type BoardPostRecord,
  type DiscordEmbed,
  type FeedbackRecord,
  type PostRecord,
  type ProfileSummary,
  type SupabaseWebhookPayload,
  type SupabaseWebhookTable,
} from '@/lib/discord/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isWatchedTable(table: string): table is SupabaseWebhookTable {
  return (SUPABASE_WEBHOOK_TABLES as string[]).includes(table)
}

async function fetchProfile(userId: string): Promise<ProfileSummary | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('id', userId)
      .maybeSingle()
    if (error || !data) return null
    return data as ProfileSummary
  } catch (err) {
    console.error('[discord-notify] profile fetch error', {
      userId,
      message: (err as Error).message,
    })
    return null
  }
}

export async function POST(request: NextRequest) {
  // 1. Secret check
  const provided = request.headers.get('x-webhook-secret')
  const expected = process.env.SUPABASE_WEBHOOK_SECRET
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Parse payload
  let payload: SupabaseWebhookPayload
  try {
    payload = (await request.json()) as SupabaseWebhookPayload
  } catch {
    return NextResponse.json({ ok: true, reason: 'invalid_json' })
  }

  if (
    payload.type !== 'INSERT' ||
    !payload.record ||
    !isWatchedTable(payload.table)
  ) {
    return NextResponse.json({ ok: true, reason: 'noop' })
  }

  const table: SupabaseWebhookTable = payload.table
  const record = payload.record as Record<string, unknown>
  const recordId = (record as { id?: string }).id ?? '(unknown)'

  // 3. Branch + enrich + build embed
  let embed: DiscordEmbed
  try {
    if (table === 'posts') {
      const r = record as unknown as PostRecord
      const profile = await fetchProfile(r.user_id)
      embed = buildPostEmbed(r, profile)
    } else if (table === 'board_posts') {
      const r = record as unknown as BoardPostRecord
      const profile = await fetchProfile(r.user_id)
      embed = buildBoardPostEmbed(r, profile)
    } else if (table === 'artist_applications') {
      const r = record as unknown as ArtistApplicationRecord
      const profile = await fetchProfile(r.user_id)
      embed = buildArtistApplicationEmbed(r, profile)
    } else {
      const r = record as unknown as FeedbackRecord
      embed = buildFeedbackEmbed(r)
    }
  } catch (err) {
    console.error('[discord-notify] embed build error', {
      table,
      id: recordId,
      message: (err as Error).message,
    })
    return NextResponse.json({ error: 'embed_build_failed' }, { status: 500 })
  }

  // 4. Send
  const route = routeWebhook(table)
  const webhookUrl =
    route === 'feedback'
      ? process.env.DISCORD_WEBHOOK_FEEDBACK
      : process.env.DISCORD_WEBHOOK_MAIN
  if (!webhookUrl) {
    console.error('[discord-notify] missing webhook env', { table, route })
    return NextResponse.json({ error: 'missing_webhook_env' }, { status: 500 })
  }

  try {
    await sendDiscordWebhook(webhookUrl, { embeds: [embed] })
    console.log('[discord-notify] sent', { table, id: recordId, route })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[discord-notify] send failed', {
      table,
      id: recordId,
      route,
      message: (err as Error).message,
    })
    return NextResponse.json({ error: 'discord_send_failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/discord-notify/route.ts
git commit -m "feat: Supabase Database Webhook 처리용 디스코드 알림 핸들러 추가"
```

---

## Task 7: 로컬 dev에서 핸들러 통합 검증 (curl)

This task does not produce code; it confirms the handler works end-to-end against a real Discord channel.

**Prerequisites the user must have provided beforehand:**
- A Discord server with two channels (e.g., `#wallscape-main`, `#wallscape-feedback`)
- A webhook URL for each channel
- `SUPABASE_SERVICE_ROLE_KEY` already set in `.env.local` (it should be — existing project uses it)

- [ ] **Step 1: Set local env values in `.env.local`**

Append (or update) in `.env.local`:

```bash
SUPABASE_WEBHOOK_SECRET=local-dev-secret-please-change
DISCORD_WEBHOOK_MAIN=<paste main channel webhook URL>
DISCORD_WEBHOOK_FEEDBACK=<paste feedback channel webhook URL>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do NOT commit `.env.local`.

- [ ] **Step 2: Start the dev server (background)**

Run: `npm run dev`

Wait for "Ready in" line. Confirm it's listening on `http://localhost:3000`.

- [ ] **Step 3: POST `posts` fixture and confirm Discord receipt**

In a separate terminal:

```bash
curl -i -X POST http://localhost:3000/api/webhooks/discord-notify \
  -H "x-webhook-secret: local-dev-secret-please-change" \
  -H "Content-Type: application/json" \
  --data-binary @fixtures/discord-webhook/posts-insert.json
```

Expected:
- HTTP 200 with body `{"ok":true}`
- Dev server log line: `[discord-notify] sent { table: 'posts', id: '...', route: 'main' }`
- Main Discord channel: green-bordered embed titled `🎨 새 그래피티 — 강남 빌딩 옥상 그래피티`, image (likely broken since fixture URL is fake — that's fine, just confirm the embed renders), 위치/카테고리 fields, author shown as "(알 수 없음)" (the fixture user_id does not exist in profiles)

- [ ] **Step 4: POST `board_posts` fixture**

```bash
curl -i -X POST http://localhost:3000/api/webhooks/discord-notify \
  -H "x-webhook-secret: local-dev-secret-please-change" \
  -H "Content-Type: application/json" \
  --data-binary @fixtures/discord-webhook/board_posts-insert.json
```

Expected: blue-bordered embed in main channel, no image, 카테고리 field.

- [ ] **Step 5: POST `artist_applications` fixture**

```bash
curl -i -X POST http://localhost:3000/api/webhooks/discord-notify \
  -H "x-webhook-secret: local-dev-secret-please-change" \
  -H "Content-Type: application/json" \
  --data-binary @fixtures/discord-webhook/artist_applications-insert.json
```

Expected: purple-bordered embed in main channel with 등록 유형/인스타/웹사이트 fields.

- [ ] **Step 6: POST `feedback` fixture and confirm it lands in feedback channel**

```bash
curl -i -X POST http://localhost:3000/api/webhooks/discord-notify \
  -H "x-webhook-secret: local-dev-secret-please-change" \
  -H "Content-Type: application/json" \
  --data-binary @fixtures/discord-webhook/feedback-insert.json
```

Expected: yellow-bordered embed in **feedback** channel (not main), author "홍길동", 유형/이메일 fields.

- [ ] **Step 7: Verify 401 on bad secret**

```bash
curl -i -X POST http://localhost:3000/api/webhooks/discord-notify \
  -H "x-webhook-secret: WRONG" \
  -H "Content-Type: application/json" \
  --data-binary @fixtures/discord-webhook/posts-insert.json
```

Expected: HTTP 401, body `{"error":"unauthorized"}`. **No Discord message should appear.**

- [ ] **Step 8: Verify 200 no-op on unknown table**

```bash
curl -i -X POST http://localhost:3000/api/webhooks/discord-notify \
  -H "x-webhook-secret: local-dev-secret-please-change" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"comments","schema":"public","record":{"id":"x"},"old_record":null}'
```

Expected: HTTP 200 with `{"ok":true,"reason":"noop"}`. No Discord message.

- [ ] **Step 9: Verify 200 no-op on UPDATE event**

```bash
curl -i -X POST http://localhost:3000/api/webhooks/discord-notify \
  -H "x-webhook-secret: local-dev-secret-please-change" \
  -H "Content-Type: application/json" \
  -d '{"type":"UPDATE","table":"posts","schema":"public","record":{"id":"x"},"old_record":{"id":"x"}}'
```

Expected: HTTP 200 with `{"ok":true,"reason":"noop"}`. No Discord message.

- [ ] **Step 10: Stop the dev server**

Stop `npm run dev` (Ctrl+C).

This task has no code changes to commit. If you noticed a defect in steps 3–9, return to Task 4 (embed) or Task 6 (handler), fix, re-run, then proceed.

---

## Task 8: README — Supabase Database Webhook 등록 절차 문서화

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read the current README to find an appropriate insertion point**

Run: `cat README.md`

Append the new section at the bottom (or insert before any "License" section if one exists).

- [ ] **Step 2: Append the following section to `README.md`**

```markdown

## Discord 알림 설정

새로운 포스트/커뮤니티 글/아티스트 신청/피드백이 등록되면 Discord 채널로 알림이 전송됩니다.

### 환경 변수 (Vercel + 로컬 `.env.local`)

| 키 | 설명 |
| --- | --- |
| `SUPABASE_WEBHOOK_SECRET` | Supabase Database Webhook이 보내는 `x-webhook-secret` 헤더와 매칭되는 랜덤 문자열 (32자 이상 권장) |
| `DISCORD_WEBHOOK_MAIN` | posts / board_posts / artist_applications 알림을 받을 디스코드 웹훅 URL |
| `DISCORD_WEBHOOK_FEEDBACK` | feedback 알림을 받을 별도 디스코드 웹훅 URL |
| `NEXT_PUBLIC_APP_URL` | 임베드 안의 링크를 빌드할 때 쓰는 베이스 URL (예: `https://wallscape.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | profiles 조회용 (이미 다른 곳에서 쓰면 그대로 재사용) |

### Supabase Studio에서 Database Webhook 등록

각 테이블마다 다음 4개의 Webhook을 등록합니다 (모두 같은 URL/헤더, table만 다름).

| 이름 | Table | Events | URL | HTTP Headers |
| --- | --- | --- | --- | --- |
| `discord-notify-posts` | `posts` | Insert | `${NEXT_PUBLIC_APP_URL}/api/webhooks/discord-notify` | `x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>` |
| `discord-notify-board` | `board_posts` | Insert | (동일) | (동일) |
| `discord-notify-artist` | `artist_applications` | Insert | (동일) | (동일) |
| `discord-notify-feedback` | `feedback` | Insert | (동일) | (동일) |

등록 위치: Supabase Dashboard → Database → Webhooks → "Create a new hook"
- Type of webhook: **HTTP Request**
- Method: **POST**
- HTTP Headers: 위 표 참고
- HTTP Params (Body): 비워둠 (기본 페이로드 사용)

### 핸들러

- 라우트: `src/app/api/webhooks/discord-notify/route.ts`
- 임베드 빌더: `src/lib/discord/embed.ts`
- 발송 헬퍼: `src/lib/discord/send.ts`
- 로컬 시각 검증: `npm run verify-embeds`

### 모니터링

- 발송 로그: Vercel function logs에서 `[discord-notify]` 검색
- 전송 실패: Supabase Studio → Database → Webhooks → 해당 webhook → Recent deliveries
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: 디스코드 알림 설정과 Supabase Database Webhook 등록 절차 추가"
```

---

## Task 9: 운영 배포 체크리스트 (수동, 별도 PR/커밋 없음)

This task has no code changes. It tracks the deploy/operate steps that the engineer or operator performs in external systems.

- [ ] **Step 1: Discord 채널과 웹훅 생성**

Discord 서버에 두 채널 생성:
- `#wallscape-main` — 메인 알림용
- `#wallscape-feedback` — 피드백 전용

각 채널 설정 → 통합 → 웹훅 → 새 웹훅 → URL 복사. URL 두 개 확보.

- [ ] **Step 2: Vercel preview 환경에 env 등록**

Vercel Dashboard → Project → Settings → Environment Variables → Preview 환경에 4개 키 추가:
- `SUPABASE_WEBHOOK_SECRET` (랜덤 32자 이상)
- `DISCORD_WEBHOOK_MAIN`
- `DISCORD_WEBHOOK_FEEDBACK`
- `NEXT_PUBLIC_APP_URL` = preview deployment URL (또는 production URL이라도 무관 — 임베드 링크용일 뿐)

`SUPABASE_SERVICE_ROLE_KEY`가 preview에 없으면 함께 추가.

- [ ] **Step 3: PR 생성 → preview 배포 확인**

Push 후 PR을 만들거나 직접 `vercel deploy`로 preview 배포.

Preview URL 확보 후 다음 curl로 확인:

```bash
curl -i -X POST <preview-url>/api/webhooks/discord-notify \
  -H "x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  --data-binary @fixtures/discord-webhook/posts-insert.json
```

Expected: 200 + Discord 메인 채널에 메시지 도착.

- [ ] **Step 4: Supabase staging에서 `posts` 1개만 webhook 등록 → e2e**

Supabase Studio → Database → Webhooks → Create:
- Name: `discord-notify-posts`
- Table: `posts`
- Events: Insert
- URL: `<preview-url>/api/webhooks/discord-notify`
- HTTP Headers: `x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>`

실제로 staging에 `posts` 1건 INSERT (앱에서 업로드 또는 SQL Editor) → Discord 메인 채널 도착 확인.

- [ ] **Step 5: 나머지 3개 webhook 등록**

`board_posts`, `artist_applications`, `feedback` 각각 같은 절차로 등록. 각 테이블에 1건씩 INSERT 시도해 도착 확인. `feedback`은 피드백 채널로 가는지 별도 확인.

- [ ] **Step 6: Production env 등록 + production 배포**

Vercel Dashboard → Production 환경에도 4개 env 동일하게 등록 (production 전용 시크릿/웹훅을 쓰고 싶으면 다른 값으로). `NEXT_PUBLIC_APP_URL`은 `https://wallscape.app`.

`master` 머지 → production 배포.

- [ ] **Step 7: Production Supabase에 4개 webhook 등록**

Production Supabase 프로젝트에도 4개 webhook을 같은 방식으로 등록. URL은 production app URL.

- [ ] **Step 8: 1주일 모니터링 체크포인트**

매일 1회 확인:
- Vercel function logs: `[discord-notify] error` / `[discord-notify] send failed` 발생 빈도
- Supabase Studio → Webhooks → Recent deliveries: 실패율 (>5%면 원인 추적)
- Discord 채널 알림 누락 신고 (운영자 수동)

문제 없으면 종료.

---

## Self-Review Notes

- **Spec coverage**: 4종 테이블 매핑(spec §4) → Tasks 4–6 / 보안(spec §5) → Tasks 1, 6, 7 / 에러 처리(spec §6) → Task 6 / 파일 구조(spec §7) → Tasks 2–6 / env(spec §8) → Tasks 1, 9 / Webhook 등록(spec §9) → Tasks 8, 9 / 검증(spec §10) → Tasks 5, 7, 9 / 배포 단계(spec §11) → Task 9 / 모니터링(spec §12) → Task 8 README 섹션. 누락 없음.
- **Type consistency**: `ProfileSummary`, `SupabaseWebhookTable`, `DiscordEmbed`, `DiscordEmbedField`, `DiscordWebhookBody`, `*Record` 모두 Task 2에서 정의된 그대로 Tasks 3–6에서 임포트하여 사용. `routeWebhook` 시그니처(`SupabaseWebhookTable → 'main' | 'feedback'`)는 Tasks 4와 6에서 일관.
- **No placeholders**: 모든 코드/명령은 그대로 실행 가능한 완성 형태로 기재. `.env.local` 값과 Discord webhook URL만 사용자가 입력해야 하는데, 이는 비밀값이라 plan에 기재 불가 — Task 7/9 step 안에 명시적으로 표시.
- **Verification model**: 자동 테스트 러너 도입은 spec에서 명시적으로 제외. Task 5의 `verify-embeds` 시각 검증과 Task 7의 curl e2e가 spec §10이 요구한 검증을 대체.
