# Wallscape 🎨

위치 기반 그래피티 공유 SNS - 도시의 예술을 발견하고 기록하세요.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router) + TypeScript
- **스타일링**: Tailwind CSS (다크 모드, 모바일 퍼스트)
- **상태 관리**: Zustand
- **서버 상태**: TanStack Query v5
- **백엔드**: Supabase (Auth, PostgreSQL, Storage)
- **지도**: 카카오맵 JavaScript API + PostGIS
- **배포**: Vercel

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/your-org/wallscape.git
cd wallscape
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열고 다음 값들을 채워넣으세요:

```env
# Supabase - https://app.supabase.com 프로젝트 설정 > API에서 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 카카오 개발자 - https://developers.kakao.com 내 애플리케이션 > 앱 키
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your-javascript-key
NEXT_PUBLIC_KAKAO_REST_API_KEY=your-rest-api-key
```

### 3. Supabase 설정

#### 3.1 새 프로젝트 생성

[Supabase Dashboard](https://app.supabase.com)에서 새 프로젝트를 생성합니다.

#### 3.2 데이터베이스 마이그레이션 실행

Supabase Dashboard > SQL Editor에서 순서대로 실행:

```sql
-- 1단계: 기본 스키마 (PostGIS, 테이블, RLS)
-- supabase/migrations/001_initial_schema.sql 내용 붙여넣기

-- 2단계: 스토리지 버킷 및 정책
-- supabase/migrations/002_storage_policies.sql 내용 붙여넣기
```

또는 Supabase CLI 사용:

```bash
npx supabase init
npx supabase link --project-ref your-project-id
npx supabase db push
```

#### 3.3 소셜 로그인 설정 (선택)

**Google OAuth:**
1. Supabase Dashboard > Authentication > Providers > Google
2. [Google Cloud Console](https://console.cloud.google.com)에서 OAuth 클라이언트 ID 생성
3. 승인된 리디렉션 URI: `https://your-project-id.supabase.co/auth/v1/callback`

**Kakao OAuth:**
1. [카카오 개발자](https://developers.kakao.com) > 내 애플리케이션 > 카카오 로그인 활성화
2. Redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
3. Supabase Dashboard > Authentication > Providers > Kakao에 앱 키 입력

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 앱이 실행됩니다.

## 프로젝트 구조

```
wallscape/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 페이지 (로그인/회원가입)
│   │   ├── (main)/            # 메인 앱 (하단 네비게이션 포함)
│   │   │   ├── feed/          # 피드 페이지
│   │   │   ├── map/           # 지도 페이지
│   │   │   ├── upload/        # 업로드 페이지
│   │   │   ├── activity/      # 알림 페이지
│   │   │   └── profile/       # 프로필 페이지
│   │   ├── onboarding/        # 온보딩
│   │   └── search/            # 검색
│   ├── components/
│   │   ├── feed/              # 피드 컴포넌트
│   │   ├── layout/            # 레이아웃 컴포넌트
│   │   ├── map/               # 지도 컴포넌트
│   │   ├── profile/           # 프로필 컴포넌트
│   │   ├── ui/                # 공통 UI 컴포넌트
│   │   └── upload/            # 업로드 컴포넌트
│   ├── hooks/                  # 커스텀 훅
│   ├── lib/
│   │   ├── supabase/          # Supabase 클라이언트
│   │   └── utils.ts           # 유틸리티 함수
│   ├── stores/                 # Zustand 스토어
│   └── types/                  # TypeScript 타입
├── supabase/
│   └── migrations/            # SQL 마이그레이션
├── public/                     # 정적 파일
├── .env.local.example         # 환경변수 예시
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 주요 기능

### 피드
- 최신순 / 인기순 / 내 주변 / 팔로잉 정렬
- 무한 스크롤 (IntersectionObserver + TanStack Query)
- 더블탭 좋아요

### 지도
- 카카오맵 기반 전체화면 지도
- 게시물 위치 커스텀 마커
- 마커 클릭 시 하단 시트로 미리보기
- 내 위치 이동

### 업로드
- 단계별 플로우 (사진 → 위치 → 정보)
- EXIF GPS 자동 추출
- 카카오 주소 검색
- 이미지 자동 리사이즈

### 프로필
- 그리드 레이아웃
- 팔로우/팔로잉
- 게시물/팔로워/팔로잉 카운트

## Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 저장소 연결
2. Environment Variables에 `.env.local` 값들 추가
3. Deploy!

```bash
# 또는 CLI로 배포
npm install -g vercel
vercel --prod
```

### Vercel KV (선택, 요청 제한용)

Vercel Dashboard > Storage > KV Database 생성 후 환경변수 추가:
```env
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

## 데이터베이스 스키마

```
profiles ─────────────────────────────────┐
  id (uuid, FK → auth.users)              │
  username, display_name, avatar_url      │
  bio, website, location                  │
  post_count, follower_count, ...         │
                                          │
posts ──────────────────── FK(user_id) ───┘
  id, image_url, title, description
  lat, lng, location (GEOMETRY Point)
  tags[], address, city, district
  like_count, comment_count, ...

comments ──── FK(post_id, user_id, parent_id)
likes    ──── FK(user_id, post_id|comment_id)
bookmarks ─── FK(user_id, post_id)
follows  ──── FK(follower_id, following_id)
notifications FK(user_id, actor_id, post_id)
```

## 라이센스

MIT

## Discord daily overview

Migration `020_discord_daily_overview.sql` adds a scheduled Discord activity summary.
It runs every day at `00:00 UTC`, which is `09:00 Asia/Seoul`.

Set the overview Discord webhook URL in Supabase SQL Editor:

```sql
update discord_config
set value = 'https://discord.com/api/webhooks/<id>/<token>'
where key = 'webhook_overview';
```

Send a manual test message:

```sql
select public._discord_notify_daily_overview();
```

Change the delivery time by replacing the cron expression. Supabase cron uses UTC:

```sql
select cron.unschedule('wallscape-discord-daily-overview');
select cron.schedule(
  'wallscape-discord-daily-overview',
  '0 0 * * *',
  $$select public._discord_notify_daily_overview();$$
);
```
