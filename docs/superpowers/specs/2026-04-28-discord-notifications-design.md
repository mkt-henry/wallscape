# Discord 포스팅 알림 — 디자인 문서

- 작성일: 2026-04-28
- 상태: Draft (구현 전)
- 범위: 유저가 콘텐츠 작성 시 Discord 채널로 알림 전송

## 1. 목적과 범위

운영자(어드민)가 Wallscape에 새로 등록되는 콘텐츠를 실시간으로 모니터링할 수 있도록, 작성 이벤트를 Discord 채널로 즉시 알린다.

### 알림 대상

| 테이블 | 의미 | 알림 대상 채널 |
| --- | --- | --- |
| `posts` | 그래피티 사진 포스트 | 메인 |
| `board_posts` | 커뮤니티 게시판 글 | 메인 |
| `artist_applications` | 아티스트 등록 신청 | 메인 |
| `feedback` | 사이트 피드백/문의 | 피드백 |

### 명시적 비범위 (YAGNI)

- 멱등성 보장 (중복 알림 허용)
- 큐/재시도 인프라 (Supabase 내장 재시도로 충분)
- 사용자별 알림 ON/OFF
- i18n 메시지 (한국어 고정, 운영자 대상)
- DELETE/UPDATE 이벤트 처리
- 자동화 테스트 러너 도입

## 2. 신뢰성 요구사항

- **서버 보장**: DB INSERT 성공 시 알림 발송이 보장되어야 한다. 클라이언트 네트워크 상태와 무관해야 한다.
- 가시성 설정(`show_in_feed`/`show_in_profile`/`show_in_map`)이 모두 false인 비공개 포스트도 알림 대상이다.
- 디스코드 일시 장애에 대해서는 Supabase Database Webhook의 자체 재시도에 의존한다 (별도 큐 도입 X).

## 3. 아키텍처

```
[Client INSERT]
      │
      ▼
[Supabase Postgres] ──Database Webhook (per table, x-webhook-secret 헤더)──▶
      │
      ▼
POST /api/webhooks/discord-notify  (Next.js Route Handler, Node runtime)
      1. 시크릿 검증 (401 if 불일치)
      2. body.type === 'INSERT' && body.table 화이트리스트 검증 (else 200 no-op)
      3. table별 분기 → embed 빌더 호출
      4. profiles 조회로 작성자 enrich (feedback 제외)
      5. 대상 웹훅 fetch POST (5초 타임아웃)
         - feedback → DISCORD_WEBHOOK_FEEDBACK
         - 그 외     → DISCORD_WEBHOOK_MAIN
      6. 성공 시 200, 실패 시 5xx (Supabase 재시도 트리거)
      │
      ▼
[Discord]
```

설계 결정:
- **단일 엔드포인트**가 4개 DB Webhook을 모두 처리. `body.table`로 분기.
- **Node runtime** (Vercel Fluid Compute 기본).
- **공유 시크릿 방식** 인증 — Supabase가 HMAC 서명을 미지원하므로 커스텀 헤더 매칭.

## 4. 데이터 매핑 (Embed)

### 공통 페이로드 (Supabase → 핸들러)
```json
{
  "type": "INSERT",
  "table": "posts",
  "schema": "public",
  "record": { /* 새로 삽입된 row 전체 */ },
  "old_record": null
}
```

### 라우팅 / 임베드 메타

| 테이블 | 웹훅 | 색상 | 제목 prefix | 링크 |
| --- | --- | --- | --- | --- |
| `posts` | MAIN | 0x22c55e (녹) | 🎨 새 그래피티 | `${APP_URL}/ko/feed/{id}` |
| `board_posts` | MAIN | 0x3b82f6 (청) | 💬 커뮤니티 새 글 | `${APP_URL}/ko/community/{id}` |
| `artist_applications` | MAIN | 0xa855f7 (보) | 🎤 아티스트 신청 | `${APP_URL}/ko/admin` |
| `feedback` | FEEDBACK | 0xeab308 (황) | 📩 피드백 | `${APP_URL}/ko/admin/feedback` |

### `posts` 임베드
- `title`: `🎨 새 그래피티 — {posts.title || '(제목 없음)'}`
- `description`: `posts.description` 발췌 200자 (없으면 `(내용 없음)`)
- `author.name`: profiles.nickname
- `author.icon_url`: profiles.avatar_url
- `image.url`: `posts.image_url`
- `fields`:
  - 위치: `${city ?? ''} ${district ?? ''}`.trim() || `address` || `(위치 미확인)`
  - 카테고리: `posts.category`
- `timestamp`: `posts.created_at`
- `url`: 포스트 상세 링크

### `board_posts` 임베드
- `title`: `💬 커뮤니티 — {board_posts.title}`
- `description`: `board_posts.content` 발췌 200자
- `author`: profiles.nickname / avatar_url
- `image.url`: 014 마이그레이션이 추가한 이미지 컬럼이 있으면 매핑 (구현 시 컬럼명 확정)
- `fields`: 카테고리(`board_posts.category`)
- `timestamp`: `board_posts.created_at`

### `artist_applications` 임베드
- `title`: `🎤 아티스트 신청 — {artist_name}`
- `description`: `note || bio` 발췌 200자
- `author`: profiles.nickname / avatar_url (신청한 user_id 기준)
- `fields`:
  - 등록 유형: `registration_type` (self/other)
  - 대상 유저명: `target_username` (registration_type = 'other' 일 때)
  - 인스타: `instagram_handle`
  - 웹사이트: `website`
- `timestamp`: `created_at`

### `feedback` 임베드
- `title`: `📩 새 피드백 — {type}`
- `description`: `message` 전체 (피드백은 1000자 안쪽이라 그대로. 디스코드 한도 4096 미만이면 cap 없음)
- `author.name`: `record.name` (feedback은 user_id 없음, profiles 조회 없음)
- `fields`:
  - 유형: `type` (feedback/bug/contact/partnership)
  - 이메일: `email`
- `timestamp`: `created_at`

### 본문 발췌 규칙
- `truncate(text, 200)` — 200자 초과 시 199자 + `…`
- null/빈 문자열은 `(내용 없음)`로 폴백

## 5. 보안

- **시크릿 검증**: `x-webhook-secret` 헤더와 `SUPABASE_WEBHOOK_SECRET` env 비교. 불일치 시 401.
- **Service role 키 격리**: profiles 조회는 `src/lib/supabase/admin.ts` 신규 헬퍼에서만 사용. 클라이언트 노출 금지.
- **Discord webhook URL 비공개**: `DISCORD_WEBHOOK_MAIN`, `DISCORD_WEBHOOK_FEEDBACK` 둘 다 `NEXT_PUBLIC_` 접두사 금지.
- **페이로드 화이트리스트**: `body.type === 'INSERT'` && `body.table ∈ {posts, board_posts, artist_applications, feedback}` 외에는 200 no-op (재시도 트리거 안 함).

## 6. 에러 처리 정책

| 상황 | 응답 코드 | 동작 |
| --- | --- | --- |
| 시크릿 불일치 | 401 | Supabase가 재시도 안 함 (영구 실패) |
| 알 수 없는 table / event | 200 | no-op |
| profiles 조회 실패 | 200 (계속) | 작성자 표시 `(알 수 없음)`로 폴백 후 알림 발송 |
| Discord 4xx | 500 | 5xx → Supabase 재시도. 페이로드 문제일 가능성 → 로그 모니터링 |
| Discord 5xx / 타임아웃 | 500 | Supabase 자동 재시도 |
| Discord 429 (rate limit) | 500 | 재시도 (워크로드 빈도 낮음) |

### 타임아웃
- Discord fetch에 `AbortController` 5초 타임아웃 (Supabase webhook 자체 타임아웃보다 짧게).

### 로깅
- 정상: `console.log('[discord-notify] sent', { table, id })`
- 오류: `console.error('[discord-notify] error', { table, id, message })`
- 모든 로그는 prefix `[discord-notify]`로 검색 가능.

### 멱등성
- Supabase 재시도 시 같은 row의 알림이 중복 발송 가능. **MVP에서는 허용**.
- 후속 작업으로 `notification_log(table, record_id UNIQUE)` 추가 가능 (이번 스코프 X).

## 7. 파일 구조

### 신규
```
src/
├─ app/api/webhooks/discord-notify/
│  └─ route.ts                # POST 핸들러
├─ lib/
│  ├─ discord/
│  │  ├─ embed.ts             # 4종 embed 빌더, truncate, routeWebhook
│  │  ├─ send.ts              # Discord webhook fetch (타임아웃, 에러)
│  │  └─ types.ts             # SupabaseWebhookPayload, EmbedTable 등
│  └─ supabase/
│     └─ admin.ts             # service role 클라이언트
fixtures/
└─ discord-webhook/
   ├─ posts-insert.json
   ├─ board_posts-insert.json
   ├─ artist_applications-insert.json
   └─ feedback-insert.json
scripts/
└─ verify-embeds.ts           # 로컬 검증 스크립트 (npx tsx)
```

### 수정
- `.env.example` — 신규 env 키 추가
- README — Supabase Database Webhook 등록 절차 문서화

### 변경 없음
- 기존 INSERT 코드 (`src/app/[locale]/(main)/upload/page.tsx`, `src/app/api/artist-application/route.ts` 등)는 건드리지 않음.

## 8. 환경 변수

```bash
# Supabase Database Webhook → API 시크릿 (랜덤 32자 이상)
SUPABASE_WEBHOOK_SECRET=

# Service role (기존이 있으면 재사용)
SUPABASE_SERVICE_ROLE_KEY=

# Discord webhooks
DISCORD_WEBHOOK_MAIN=
DISCORD_WEBHOOK_FEEDBACK=

# 임베드 링크 빌드용
NEXT_PUBLIC_APP_URL=https://wallscape.app
```

## 9. Supabase Database Webhook 설정

각 테이블에 1개씩 총 4개 등록. 모두 같은 URL로 전송. Studio UI에서 수동 등록 후 README 문서화.

| 이름 | 테이블 | 이벤트 | URL | 헤더 |
| --- | --- | --- | --- | --- |
| `discord-notify-posts` | `posts` | INSERT | `${APP_URL}/api/webhooks/discord-notify` | `x-webhook-secret: $SECRET` |
| `discord-notify-board` | `board_posts` | INSERT | (동일) | (동일) |
| `discord-notify-artist` | `artist_applications` | INSERT | (동일) | (동일) |
| `discord-notify-feedback` | `feedback` | INSERT | (동일) | (동일) |

## 10. 검증 / 테스트

### 단위 검증
- `src/lib/discord/embed.ts` 함수들은 순수 함수로 작성.
- `scripts/verify-embeds.ts`에서 4종 fixture를 빌더에 통과시켜 콘솔에 embed JSON 출력. PR 머지 전 1회 시각 확인.
- 자동 테스트 러너(jest/vitest)는 본 스코프에서 도입하지 않음. 향후 도입 시 그대로 유닛 테스트로 전환 가능.

### 통합 검증
- 로컬 dev에서 fixture로 curl POST → 실제 Discord 테스트 채널로 전송 확인.
- Vercel preview 배포 후 Supabase staging에 `posts` 1개만 webhook 등록 → 실제 INSERT로 e2e 확인.
- 4종 모두 도착 확인 후 production 등록.

### 에러 경로 수동 확인
- 잘못된 시크릿 → 401
- 화이트리스트 외 table → 200 no-op
- 일부러 잘못된 Discord URL → 5xx + 로그 확인

### 배포 전 체크리스트
- [ ] 4종 테이블 INSERT 시 알림 도착
- [ ] `posts` 알림에 이미지 썸네일 표시
- [ ] `feedback`은 별도 웹훅으로 분리 도착
- [ ] 시크릿 누락/오답 시 401
- [ ] profiles 조회 실패해도 알림 발송 (폴백 확인)
- [ ] 가시성 false 포스트도 알림 도착
- [ ] 본문 200자+ 컷 동작
- [ ] 한글 깨짐 없이 표시

## 11. 배포 단계

1. Discord 메인/피드백 채널 + 웹훅 생성, URL 확보
2. 로컬 env 설정, `.env.example` 업데이트
3. `embed.ts`/`send.ts`/`admin.ts` 작성 → `scripts/verify-embeds.ts`로 콘솔 검증
4. `route.ts` 작성 → fixture curl 테스트
5. Vercel preview 배포 + preview env 등록
6. Supabase staging에 `posts` webhook 1개 등록 → e2e 확인
7. 4종 webhook 모두 등록 + production env 등록 + production 배포
8. 1주일 모니터링 (Vercel function logs, Supabase webhook delivery 페이지)

## 12. 모니터링

- Vercel function logs: prefix `[discord-notify]` 검색
- Supabase Studio Database Webhooks → "Recent deliveries" 실패율 확인
- 알림 누락 의심 시: Supabase webhook delivery → Vercel 함수 로그 → Discord webhook 응답 순으로 추적
