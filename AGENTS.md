# SONG Player

Personal streaming PWA — Next.js 16 + App Router + Auth.js + PostgreSQL + Drizzle ORM

## Domain Documentation

도메인 정의, 비즈니스 정책, 제약 조건은 [`docs/README.md`](docs/README.md) 참조.

## Architecture

아키텍처 원칙, 레이어별 역할/규칙, 검증 전략, 테스트 전략은 [`docs/architecture.md`](docs/architecture.md) 참조.

```
song/
├── app/                    # Presentation Layer — Route Handlers (HTTP 입출력)
├── server/
│   ├── domain/             # Domain Layer — 엔티티 + 규칙 + Port 인터페이스 (순수, 의존 제로)
│   ├── application/        # Application Layer — 유스케이스 + 스키마 + wiring
│   ├── infrastructure/     # Infrastructure Layer — DB repositories + 외부 API 구현체
│   ├── lib/                # route-helpers (requireAuth, validateBody, validateParams, handleErrors), env
│   └── auth.ts             # Auth.js config
├── src/                    # Client-side (types, services, queries, hooks, store, components)
├── docs/                   # Domain + Architecture 문서
├── proxy.ts                # Auth middleware
└── (config files)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server with Turbopack |
| `npm run build` | Production build (standalone) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run db:push` | Push Drizzle schema to DB (dev) |
| `npm run db:generate` | Generate SQL migration files |
| `npm run db:migrate` | Run SQL migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Path Aliases

| Alias | Resolves To | Usage |
|-------|-------------|-------|
| `@/*` | `./src/*` | Client-side imports |
| `@/server/*` | `./server/*` | Server-side imports (from route handlers) |

## Coding Conventions

아키텍처 원칙, 레이어별 역할/규칙은 [`docs/architecture.md`](docs/architecture.md) 참조.

- TypeScript strict mode
- ESM modules (`"type": "module"`)
- File naming: `kebab-case.ts` / `kebab-case.tsx`
- No comments unless explicitly requested
- Named exports only (no default exports) — except Next.js pages/layouts which require `export default`
- Zod for runtime validation
- `force-dynamic` for authenticated pages (AudioPlayer uses `document`)
- **camelCase** for all property names (DB columns, API fields, client types)
- **snake_case** for DB table names only (PostgreSQL convention)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Auth.js session secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth Client Secret |
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgres://song:password@localhost:5432/song`) |

## Key Technical Decisions

- **Clean Architecture + Factory DI** — 4-레이어 분리, Factory 함수로 의존성 주입. 상세는 [`docs/architecture.md`](docs/architecture.md)
- **Auth.js (next-auth v5)** handles Google OAuth + JWT sessions
- **PostgreSQL 17** via Docker with healthcheck
- **Drizzle ORM** with postgres.js driver — type-safe query builder, no raw SQL
- **camelCase columns** in Drizzle schema → camelCase API responses → camelCase client types
- **snake_case table names** in PostgreSQL (internal, not exposed via API)
- **`output: 'standalone'`** for minimal Docker image
- **`proxy.ts`** (not `middleware.ts`) — Next.js 16 convention
- **`async params`** in route handlers — Next.js 16 requirement
- **Node.js runtime** (not Edge) — required for postgres.js
- **`apiFetch<T>()`** throws on non-ok responses, returns parsed JSON — no manual `!res.ok` checks
- **Track adapters** (`src/lib/track-adapters.ts`) — canonical `toAudio()` functions for all track types
- **Queue separation** — `queue` (user-selected) vs `recommendedQueue` (autoplay/recommended). User queue is never modified by autoplay
- **Track tap → bottom sheet** — tapping any track opens a bottom sheet with options
- **Autoplay append-only** — when queue is exhausted, autoplay fetches related tracks into `recommendedQueue` (never replaces user queue)

## TDD 워크플로우 (필수)

이 프로젝트는 **Test-Driven Development**로 진행합니다.

### Red-Green-Refactor 사이클

```
1. Red   → 실패하는 테스트를 먼저 작성
2. Green → 테스트를 통과하는 최소 코드 작성
3. Refactor → 테스트가 깨지지 않게 리팩토링
```

### 작업 순서 (AI 에이전트 필수 준수)

```
기능 추가/수정 시:
1. 요구사항 분석 → 테스트 케이스 설계
2. 테스트 파일 먼저 작성 (또는 기존 테스트 확인)
3. 테스트 실행 → 실패 확인 (Red)
4. 구현 코드 작성
5. 테스트 실행 → 통과 확인 (Green)
6. 리팩토링 → 테스트 여전히 통과 확인
7. 빌드 + 린트 + 타입체크 통과 확인

버그 수정 시:
1. 버그 재현 테스트 작성 (회귀 테스트)
2. 테스트 실행 → 실패 확인
3. 버그 수정
4. 테스트 실행 → 통과 확인
5. 기존 테스트 전체 실행 → 사이드 이펙트 없는지 확인
```

### 테스트 레이어 전략 (Testing Trophy)

```
         /  E2E  \           적게, 느리게, 크리티컬 플로우만
        / 통합 테스트  \       적절히
       /  단위 테스트    \     많이, 빠르게, 격리해서
```

- **단위 테스트 (Vitest)**: 유틸리티, 파서, 스토어, 훅 — 가장 많이
- **컴포넌트 테스트 (RTL + Vitest)**: 렌더링, 사용자 인터랙션 — 적절히
- **API 테스트 (Vitest + MSW)**: 라우트 핸들러, 스키마 검증 — 적절히
- **E2E (Playwright)**: 로그인 → 검색 → 재생 같은 크리티컬 플로우만

### 기능별 커버리지 기준

| 레이어 | 대상 디렉토리 | 목표 | 테스트 도구 | 스킬 |
|--------|-------------|------|------------|------|
| 도메인 규칙 | `server/domain/rules/` | 90%+ | Vitest (node) | `utility-testing` |
| 유스케이스 | `server/application/use-cases/` | 80%+ | Vitest (node) | — |
| Repository | `server/infrastructure/persistence/` | 80%+ | Vitest (node) | — |
| 외부 API 파서 | `server/infrastructure/external/` | 80%+ | Vitest (node) | — |
| API 라우트 | `app/api/` | 80%+ | Vitest + MSW (node) | `api-testing`, `youtube-mocking` |
| 유틸리티 | `src/lib/` | 90%+ | Vitest (jsdom) | `utility-testing` |
| 커스텀 훅 | `src/hooks/` | 90%+ | Vitest + RTL (jsdom) | `hook-testing` |
| 상태관리 | `src/store/` | 90%+ | Vitest (jsdom) | — |
| API 서비스 | `src/services/api/` | 80%+ | Vitest (jsdom) | — |
| UI 컴포넌트 | `src/components/` | 70%+ | Vitest + RTL (jsdom) | `component-testing` |
| 쿼리 훅 | `src/queries/` | 70%+ | Vitest + RTL (jsdom) | `hook-testing` |
| E2E | 크리티컬 플로우 | 3+ 시나리오 | Playwright | — |

### API 라우트 테스트 작성 가이드

각 라우트 핸들러 테스트는 다음 케이스를 포함해야 함:

1. **정상 요청** — 올바른 입력 → 올바른 응답 (status + body)
2. **인증 없음** — session 없이 요청 → 401
3. **입력 검증 실패** — 잘못된 body/params → 400
4. **리소스 없음** — 존재하지 않는 ID → 404
5. **서버 에러** — DB/외부 API 실패 → 500

MSW로 외부 의존성을 모킹하고, `server/db`의 `db` 객체는 `vi.mock()`으로 격리. YouTube.js 모킹은 `youtube-mocking` 스킬 참조.

### 서버 테스트 환경

```typescript
// @vitest-environment node
```

서버 코드 테스트는 반드시 `node` 환경 사용 (`jsdom` 불가).

### 모델 테스트 Mock 패턴

```typescript
// Drizzle db 객체 모킹
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
};

vi.mock('@/server/db', () => ({
  db: mockDb,
}));

// 체인 말단에서 resolved value 설정
mockDb.orderBy.mockResolvedValueOnce([row]);
mockDb.where.mockResolvedValueOnce([row]);
mockDb.returning.mockResolvedValueOnce([{ id: 1 }]);
```

### 유스케이스 테스트 패턴 (Factory DI)

```typescript
// vi.mock() 없이 mock Port 객체를 Factory에 직접 주입
const mockLikeRepo: ILikeRepository = {
  getAll: vi.fn().mockResolvedValue([mockLike]),
  add: vi.fn(),
  remove: vi.fn(),
  isLiked: vi.fn(),
  getLikedVideoIds: vi.fn(),
};

const getLikes = createGetLikes(mockLikeRepo);
```

### 테스트 파일 배치

```
src/lib/format-duration.ts                    → src/lib/__tests__/format-duration.test.ts
src/hooks/use-search.ts                       → src/hooks/__tests__/use-search.test.ts
src/components/audio-card.tsx                  → src/components/__tests__/audio-card.test.tsx
server/domain/rules/audio-filter.ts           → server/domain/rules/__tests__/audio-filter.test.ts
server/application/use-cases/likes.ts          → server/application/use-cases/__tests__/likes.test.ts
server/infrastructure/persistence/repositories/like.repository.ts → server/infrastructure/persistence/repositories/__tests__/like.repository.test.ts
app/api/youtube/search/route.ts               → app/api/youtube/search/__tests__/route.test.ts
```

### 무엇을 테스트하고 무엇을 테스트하지 않는가

**테스트 O:** 컴포넌트 렌더링, 사용자 인터랙션, 유틸리티 함수, API 라우트 핸들러, Zod 스키마 검증, Zustand 스토어, 커스텀 훅, 에러/로딩 상태

**테스트 X:** 내부 구현 세부사항, 서드파티 라이브러리, CSS, Next.js 프레임워크 자체, async Server Components (E2E로 대체)

### E2E 기기 테스트 (Android)

Playwright 프로젝트가 2개로 분리되어 있음:

| 프로젝트 | 대상 | 실행 명령어 |
|----------|------|------------|
| `chromium` | 로컬 Chromium (일반 E2E) | `npx playwright test --project=chromium` |
| `android-real` | 실제 Android 기기 | `npx playwright test --project=android-real` |

#### 기기 사전 요구사항

- USB 디버깅 활성화된 Android 기기
- Chromium 계열 브라우저 설치 (`com.android.chrome` / `org.chromium.chrome` / LineageOS Jelly)
- 네트워크 테스트(`networkDisconnectScenario`)는 **루트 권한 필요** (`svc wifi` 명령)

#### 기기 연결 설정

```bash
# 1. 기기 연결 확인
adb devices

# 2. 포트 포워딩 (기기에서 localhost:3000 → 호스트 3000)
adb reverse tcp:3000 tcp:3000

# 3. CDP 원격 디버깅 (선택, PUPPETEER/CDP로 기기 제어 시)
adb forward tcp:9222 localabstract:chrome_devtools_remote
```

- `adb reverse`는 세션 재시작마다 재실행 필요 (영구 저장 안 됨)
- Docker 배포 테스트 시: `adb reverse tcp:3000 tcp:3001` (호스트 포트 3001)

#### 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `ANDROID_CDP_ENDPOINT` | 아니오 | CDP WebSocket URL (예: `ws://localhost:9222`). 미설정 시 로컬 브라우저 사용 |

#### 기기 테스트 파일 구조

```
e2e/pwa/
├── pwa-fixtures.ts                    # AndroidAdapter 인스턴스 제공
├── fixtures/
│   ├── base.ts                        # DeviceAdapter 인터페이스 + BaseDeviceAdapter
│   ├── android.ts                     # adb 셸 명령으로 기기 제어
│   └── ios.ts                         # iOS (향후 확장)
├── scenarios/
│   ├── background-playback.ts         # 백그라운드 재생 시나리오
│   └── media-session.ts               # MediaSession 제어 시나리오
└── specs/
    ├── android/
    │   ├── device-control.spec.ts     # 기기 제어 테스트 (5개, android-real 프로젝트)
    │   └── media-session.spec.ts      # MediaSession 통합 테스트 (4개, chromium 프로젝트)
    └── ...
```

#### 주의사항

- `android.ts`의 `bringToForeground()`가 `http://localhost:3000` 하드코딩 → `adb reverse` 필수
- `android-real` 프로젝트는 `workers: 1` (기기는 병렬 불가)
- `timeout: 90000` (기기 테스트는 네트워크/렌더링이 느림)

## 코드 생성 규칙

> 상세 패턴은 스킬 참조: `api-route-development`, `zod-validation`, `react-components`, `parser-patterns`, `api-layer`
> 레이어별 역할/규칙은 [`docs/architecture.md`](docs/architecture.md) 참조

### 타입 가져오기

```typescript
import type { Audio } from '@/types';
import { AudioStatus } from '@/types';
```

### Repository 작성

```typescript
import { db } from '@/server/db';
import { likes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getAllLikes(userId: string): Promise<LikeDTO[]> {
  const rows = await db.select().from(likes)
    .where(eq(likes.userId, userId));
  return rows.map(toLikeDTO);
}

// 다중 WHERE 조건은 and() 사용 (체인드 .where() 금지)
await db.select().from(table)
  .where(and(eq(table.col1, val1), eq(table.col2, val2)));

// INSERT ... ON CONFLICT UPDATE
await db.insert(likes).values({ ... })
  .onConflictDoUpdate({
    target: [likes.userId, likes.videoId],
    set: { title: '...', likedAt: now },
  });
```

### DTO 변환

```typescript
import { toLikeDTO } from './dto';

// Repository 함수는 Drizzle row → DTO 변환 후 반환
const rows = await db.select().from(likes).where(...);
return rows.map(toLikeDTO);
```

### API 라우트 작성

```typescript
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';

export const GET = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }
  const likes = await useCases.likes.getAll(session.user.id);
  return NextResponse.json(likes);
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }
  const { data, error: bodyError } = validateBody(Schema, await request.json());
  if (bodyError) { return bodyError; }
  const result = await useCases.likes.add(session.user.id, data);
  return NextResponse.json(result, { status: 201 });
});
```

### 트랙 타입 변환

```typescript
import { searchResultToAudio, likeToAudio, historyToAudio, playlistTrackToAudio, flatTrackToAudio } from '@/lib/track-adapters';
// 각 트랙 타입에 맞는 어댑터 사용 — 절대 인라인 매핑 금지
setQueue(likes.map(likeToAudio), 0);
```

### 에러 응답 패턴

```typescript
return NextResponse.json({ error: 'message' }, { status: 400 });
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

## 컨텍스트 효율성

- 대규모 파일(>500줄)은 Grep으로 줄 번호 먼저 찾고 → 해당 범위만 Read
- 빌드/테스트 출력은 파일로 한 번 캡처 → 저장된 파일에서 분석
- 관련 편집을 그룹화 → 한 번의 빌드

## 금지 사항

- default export 사용 금지 (named export만)
- `@song/types` import 사용 금지 (`@/types` 사용)
- `any` 타입 사용 금지 (모르면 `unknown` 사용)
- 인라인 트랙 매핑 금지 (`track-adapters.ts`의 어댑터 사용)
- 테스트 없이 기능 추가 금지 (TDD)
- `middleware.ts` 파일 생성 금지 (`proxy.ts` 사용)
- 불필요한 주석 추가 금지
- 빌드/린트/테스트 없이 커밋 금지
- 체인드 `.where()` 사용 금지 (`and()` 사용)
- `getDb()` 패턴 사용 금지 (`db` 객체 직접 import)
- snake_case 프로퍼티 사용 금지 (camelCase만)

## API Specification

Base path: `/api`
Auth: Auth.js session cookies (protected routes marked with 🔒, enforced by `proxy.ts`)

### Public Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/[...nextauth]` | Auth.js endpoints |
| GET | `/api/health` | Health check |
| GET | `/api/melon/chart` | Melon chart data |
| GET | `/api/youtube/search` | Search YouTube |
| GET | `/api/youtube/audio/info` | Video info |
| GET | `/api/youtube/audio/stream/:id` | Proxy audio stream (Range support) |
| GET | `/api/youtube/audio/related` | Related videos |
| GET | `/api/shared/:shareId` | Shared playlist |

### Protected Routes 🔒

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/home` | Aggregated home data |
| GET | `/api/recommendations` | Personalized recommendations |
| GET/POST | `/api/playlists` | List/Create playlists |
| GET/PATCH/DELETE | `/api/playlists/:id` | Playlist CRUD |
| POST/DELETE | `/api/playlists/:id/tracks` | Add/Remove tracks |
| PUT | `/api/playlists/:id/reorder` | Reorder tracks |
| POST | `/api/playlists/:id/duplicate` | Duplicate playlist |
| POST | `/api/playlists/:id/share` | Toggle playlist sharing |
| POST | `/api/playlists/:id/move` | Move playlist to folder |
| GET | `/api/playlists/:id/smart-tracks` | Get smart playlist tracks |
| GET/POST | `/api/folders` | List/Create folders |
| PATCH/DELETE | `/api/folders/:id` | Update/Delete folder |
| GET/POST | `/api/likes` | List/Add likes |
| DELETE | `/api/likes/:videoId` | Remove like |
| GET | `/api/likes/:videoId/check` | Check like status |
| GET/POST | `/api/history` | List/Add history |
| DELETE | `/api/history` | Clear history |
| GET | `/api/channels/followed` | Followed channels |
| GET | `/api/channels/:id` | Channel info |
| POST/DELETE | `/api/channels/:id/follow` | Follow/Unfollow |

## 작업 완료 체크리스트

### 기능 추가 시
- [ ] `doc-sync` pre-check: 관련 `docs/` 파일 읽고 기존 정책과 충돌 없는지 확인 (`skill({ name: "doc-sync" })`)
- [ ] 테스트 케이스 설계
- [ ] 실패하는 테스트 작성 (Red)
- [ ] 구현 코드 작성 (Green)
- [ ] 리팩토링
- [ ] `npm run build` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run test` 통과
- [ ] `npm run typecheck` 통과
- [ ] `doc-sync` post-check: 코드 변경 후 `docs/` 업데이트 필요 항목 식별 및 반영
- [ ] `docs/ubiquitous-language.md` 신규 용어 추가 여부 확인
- [ ] `docs/README.md` 인덱스/관계 변경 여부 확인
- [ ] API 엔드포인트 변경 시 본 문서 API Specification 테이블 업데이트

### 버그 수정 시
- [ ] 회귀 테스트 작성 (Red)
- [ ] 버그 수정 (Green)
- [ ] 기존 테스트 전체 통과 확인
- [ ] `npm run build` 통과
- [ ] `npm run lint` 통과
- [ ] 문서화된 정책(동작)이 변경된 경우 `doc-sync` 실행 후 `docs/` 업데이트
