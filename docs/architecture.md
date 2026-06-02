# Architecture — Clean Architecture + Factory DI

> 서버 사이드 아키텍처 원칙. 모든 서버 코드는 이 문서의 규칙을 따른다.

---

## Overview

4-레이어 Clean Architecture + Factory 함수 기반 수동 DI.

```
┌──────────────────────────────────────┐
│  Presentation  (app/api/)            │  HTTP 입출력
├──────────────────────────────────────┤
│  Application   (server/application/) │  유스케이스 + 스키마 + 조립
├──────────────────────────────────────┤
│  Domain        (server/domain/)      │  엔티티 + 규칙 + 포트 인터페이스
├──────────────────────────────────────┤
│  Infrastructure (server/infrastructure/) │  DB + 외부 API 구현체
└──────────────────────────────────────┘
```

### 의존성 방향

```
Presentation → Application → Domain ← Infrastructure
```

- 모든 레이어는 **Domain만** 바라볼 수 있다
- Domain은 **어떤 레이어도** import 하지 않는다 (순수 TypeScript + Zod)
- Infrastructure는 Domain의 Port 인터페이스를 **구현**한다
- Presentation은 Application의 유스케이스를 **호출**한다
- **역방향 의존 금지**: Infrastructure → Application, Domain → Infrastructure 등

---

## 디렉토리 구조

```
server/
├── domain/                             # 순수, 외부 의존 제로
│   ├── entities/                       # Zod 스키마 + 도메인 타입
│   ├── rules/                          # 순수 비즈니스 규칙 함수 (I/O 없음)
│   └── ports/                          # 인터페이스 정의 (repositories, providers)
│
├── application/                        # 프레임워크 독립
│   ├── use-cases/                      # Factory 함수 (포트만 사용)
│   ├── schemas/                        # API 요청/응답 Zod 스키마
│   └── wiring.ts                       # 전체 의존성 조립 (유일한 new/mapping 지점)
│
├── infrastructure/                     # 외부 세계 구현체
│   ├── persistence/                    # DB
│   │   ├── repositories/               # Port 구현체 (DB 쿼리)
│   │   └── mappers/                    # DB row → Domain entity (Zod .parse)
│   └── external/                       # 외부 API
│       ├── youtube/                    # client, parsers, schemas
│       └── melon/                      # scraper, parsers
│
├── db/                                 # DB 연결 + 스키마
│   ├── index.ts                        # Drizzle + postgres.js 연결
│   └── schema.ts                       # Drizzle 테이블 정의
│
├── lib/                                # 프레임워크 유틸
│   ├── route-helpers.ts                # requireAuth, validateBody, validateParams, handleErrors
│   └── env.ts
│
└── auth.ts                             # Auth.js 설정
```

---

## Domain Layer (`server/domain/`)

### 역할

도메인의 **핵심 정의**. 이 프로젝트가 "무엇인지"를 기술한다.

- 엔티티의 형태를 Zod 스키마로 정의
- 비즈니스 규칙을 순수 함수로 구현
- 외부 세계가 제공해야 할 것을 Port 인터페이스로 선언

### 해야 할 것

- Zod 스키마로 엔티티 shape 정의
- `z.infer<>`로 도메인 타입 도출
- I/O가 없는 순수 비즈니스 규칙 함수
- Port 인터페이스 정의 (DB/외부API가 구현해야 할 계약)

### 하지 말아야 할 것

- DB 접근 (`db` import, Drizzle 등)
- 외부 API 호출 (`fetch`, Innertube 등)
- 파일 시스템, 네트워크, `console.log` 등 모든 I/O
- `server/infrastructure/`, `server/application/` import
- 프레임워크 의존 (Next.js, Drizzle 등)

### 하위 디렉토리

| 디렉토리 | 내용 |
|----------|------|
| `entities/` | 각 도메인 객체의 Zod 스키마. 예: audio, like, playlist, history, channel, search, melon, user, related, lyrics |
| `rules/` | 순수 함수 비즈니스 규칙. 예: 오디오 길이 필터링, 스마트 재생목록 조건 평가, 온보딩 필요 여부 판단 |
| `ports/` | 인터페이스. `repositories.ts` (DB 접근), `providers.ts` (외부 API 접근) |

---

## Application Layer (`server/application/`)

### 역할

비즈니스 **흐름의 오케스트레이션**. "어떻게 할 것인지"를 기술한다.

- 유스케이스를 Factory 함수로 제공
- 필요한 Port를 매개변수로 받아 조합
- API 계약(요청/응답 스키마) 정의
- 모든 의존성을 한 곳에서 조립

### 해야 할 것

- Factory 함수로 유스케이스 생성 (Port만 매개변수로 받음)
- 요청 body/query/path param 검증 스키마 정의
- 응답 shape 검증 스키마 정의
- `wiring.ts`에서 모든 의존성 조립

### 하지 말아야 할 것

- 직접적인 DB 접근 (`db` import)
- 직접적인 외부 API 호출 (`getInnertube`, `fetch` 등)
- 구체적인 구현체 import (`infrastructure/` 직접 참조)
- I/O 수행 (모든 I/O는 Port를 통해 위임)

### 하위 디렉토리

| 디렉토리 | 내용 |
|----------|------|
| `use-cases/` | 도메인별 Factory 함수. 예: likes, playlists, history, search, audio, channels, recommendations, onboarding, home |
| `schemas/` | `request.ts` (모든 요청 검증), `response.ts` (모든 응답 검증) |
| `wiring.ts` | Infrastructure 구현체를 Application 유스케이스에 주입. 유일하게 Infrastructure를 import 하는 곳 |

### Factory 함수 패턴

유스케이스는 Factory 함수로, 필요한 Port를 매개변수로 받아 클로저를 반환한다. 이 패턴으로 테스트에서 mock 객체를 직접 주입할 수 있다.

`wiring.ts`는 프로젝트에서 **유일하게** Infrastructure의 구체적인 구현체를 import 하는 곳이다. 라우트 핸들러는 `wiring.ts`가 조립한 유스케이스만 사용한다.

---

## Infrastructure Layer (`server/infrastructure/`)

### 역할

Domain Port의 **구현체**. 외부 세계와의 통신을 담당한다.

- DB 쿼리 실행 및 결과 매핑
- 외부 API 호출 및 응답 파싱
- DB row를 Domain entity로 변환 (DTO 매핑 + Zod 검증)

### 해야 할 것

- Domain `ports/`에 정의된 인터페이스 구현
- DB 쿼리 (Drizzle ORM 사용)
- 외부 API 호출 (YouTube Innertube, Melon HTML scraping, GitHub REST)
- 외부 API raw 응답을 Zod 스키마로 검증 후 Domain entity로 변환
- DB row를 `mappers/`에서 Domain entity로 변환 (Zod `.parse()`로 검증)
- 캐싱, 재시도 등 인프라 관심사 처리

### 하지 말아야 할 것

- 비즈니스 규칙 포함 (예: "오디오는 30초~15분만")
- 다른 Infrastructure 모듈 직접 호출 (필요시 Application 레이어에서 조합)
- `application/` 또는 `app/api/` import
- API 라우트 로직 (인증, HTTP 상태 코드 등)

### 하위 디렉토리

| 디렉토리 | 내용 |
|----------|------|
| `persistence/connection.ts` | Drizzle + postgres.js 연결 |
| `persistence/schema.ts` | Drizzle 테이블 정의 |
| `persistence/repositories/` | 각 도메인별 Repository. Domain `ports/repositories.ts` 인터페이스 구현 |
| `persistence/mappers/` | DB row → Domain entity 변환. 변환 후 반드시 Zod `.parse()`로 검증 |
| `external/youtube/` | YouTube Innertube 클라이언트, 응답 파서, raw 응답 Zod 스키마 |
| `external/melon/` | Melon HTML 스크래퍼, 파서 |
| `external/github/` | GitHub Issues API 클라이언트 |

---

## Presentation Layer (`app/api/`)

### 역할

**HTTP 입출력**. 비즈니스 로직을 모르며, 오직 HTTP ↔ 유스케이스 사이의 번역만 담당한다.

### 해야 할 것

- 인증 (`requireAuth()`)
- 요청 검증 (`validateBody()`, `validateParams()`)
- `wiring.ts`에서 조립된 유스케이스 호출
- 응답 검증 (`ResponseSchema.parse()`)
- HTTP 상태 코드 결정
- 에러 응답 변환

### 하지 말아야 할 것

- 비즈니스 로직 포함
- 직접 DB/외부 API 접근 (Model, Service, Infrastructure 직접 import)
- 데이터 파싱/변환 로직
- `wiring.ts`와 `route-helpers.ts` 외의 `server/` import

---

## Validation Strategy

| 검증 대상 | 검증 위치 | 사용 도구 |
|-----------|-----------|-----------|
| 요청 body | Presentation (route) | `validateBody()` + Request Schema |
| 요청 path/query params | Presentation (route) | `validateParams()` + Param Schema |
| 외부 API raw 응답 | Infrastructure (parsers) | YouTube/Melon 전용 Zod Schema |
| DB row → Domain | Infrastructure (mappers) | Domain Entity Schema `.parse()` |
| API 응답 | Presentation (route) | Response Schema `.parse()` |

모든 외부 데이터(DB, YouTube, Melon, 클라이언트 요청)는 런타임에 Zod로 검증된다. TypeScript 타입만으로는 런타임 안전성을 보장하지 않는다.

---

## Testing Strategy

| 레이어 | 테스트 방식 | Mock 필요 여부 |
|--------|------------|----------------|
| Domain (entities, rules) | 순수 함수 단위 테스트 | 없음 (I/O가 없으므로) |
| Application (use-cases) | Factory 함수에 mock Port 주입 | mock 객체만 (vi.mock 불필요) |
| Infrastructure (repositories) | DB mock 또는 인메모리 DB | Drizzle chain mock |
| Infrastructure (parsers) | Zod 스키마 테스트 + fixture 데이터 | 없음 |
| Presentation (routes) | MSW + mock useCases | MSW, vi.mock |

### Factory DI와 테스트

Factory 함수 패턴에서는 `vi.mock()` 없이 mock 객체를 직접 주입한다. 이것이 DI를 사용하는 핵심 이유다.

Domain 레이어는 순수 함수이므로 어떤 mock도 필요 없다. 입력값만 넣고 출력값만 검증한다.

---

## Client Architecture

클라이언트(`src/`)는 서버의 아키텍처 레이어와 독립적이다.

```
src/types/     → 공유 타입 정의 (camelCase)
src/services/  → apiFetch<T>()로 서버 API 호출 (검증은 서버에 위임)
src/queries/   → TanStack Query 훅 (staleTime, queryKeys)
src/hooks/     → UI 로직 훅
src/store/     → Zustand 상태 관리
src/components/ → UI 컴포넌트
```

클라이언트는 서버 응답을 Zod로 재검증하지 않는다. 서버가 검증을 보증한다.

---

## 제약 사항

### 레이어 경계 위반 (엄격 금지)

| 위반 | 이유 |
|------|------|
| Domain에서 `db` / `fetch` / `fs` import | Domain은 순수해야 함 |
| Application에서 `infrastructure/` 직접 import | wiring.ts만 허용 |
| Presentation에서 Model/Service 직접 import | 반드시 useCases를 경유 |
| Infrastructure 간 직접 호출 | Application에서 조합 |
| `vi.mock()`으로 모듈 교체 | Factory DI로 mock 주입 |

### 프로젝트 공통 규칙

- camelCase 프로퍼티 (DB 컬럼, API 필드, 클라이언트 타입 모두)
- snake_case 테이블명 (PostgreSQL 관례)
- named export만 (default export 금지, Next.js pages 제외)
- `any` 금지 (모르면 `unknown`)
- 인라인 트랙 매핑 금지 (`track-adapters.ts` 사용)
- 체인드 `.where()` 금지 (`and()` 사용)
- 불필요한 주석 금지

---

## 크로스 도메인 캐시 정책

### 클라이언트 TanStack Query

| 영역 | staleTime | invalidation |
|------|-----------|-------------|
| Likes 목록/상태 | 기본 | 좋아요 토글 시 즉시 무효화 |
| History | 기본 | history 추가 시 무효화 |
| Playlists/Folders | 기본 | 변경 시 즉시 무효화 |
| Home | 기본 | **무효화 안 됨** — staleTime에만 의존 |
| Recommendations | 기본 | **무효화 안 됨** — staleTime에만 의존 |
| Search | 기본 | N/A (사용자 액션마다 새 요청) |

- Library 변형(좋아요, 재생)이 Discovery 데이터(홈 추천)에 **즉시 반영되지 않음**
- 피드백 루프(재생→기록→추천)의 가시성은 캐시 만료 시점까지 지연

### 서비스 워커 런타임 캐시

| 패턴 | 전략 | 타임아웃 | Max Age | Max Entries |
|------|------|---------|---------|-------------|
| `/api/melon/chart` | StaleWhileRevalidate | — | 30분 | 10 |
| `/api/youtube/search` | CacheFirst | — | 5분 | 50 |
| `/api/(home\|recommendations)` | NetworkFirst | 3초 | 5분 | 30 |
| `/api/(playlists\|likes\|history\|channels)` | NetworkFirst | 3초 | 5분 | 100 |
| `/api/youtube/audio/stream/*` | **캐시 안 함** | — | — | — |

- 오디오 스트리밍은 네트워크 필수 — 오프라인에서 재생 불가
- 검색 결과는 최대 5분간 캐시된 결과를 우선 반환

---

## 에러 처리 전략

| 레이어 | 전략 | 비고 |
|--------|------|------|
| API 라우트 | `handleErrors` 래퍼 | 500 fallback |
| 외부 API (Melon/YouTube) | `.catch(() => [])` | 빈 결과로 graceful degrade |
| 오디오 재생 | 최대 2회 재시도 후 ERROR 상태 | 사용자에게 재생 실패 알림 |
| 클라이언트 페이지 | **에러 바운더리 미적용** | 렌더링 에러 시 전체 앱 크래시 가능 |
