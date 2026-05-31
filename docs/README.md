# SONG Player — Domain Documentation

> 개인 YouTube 음악 스트리밍 PWA의 핵심 도메인, 비즈니스 정책, 제약 조건을 정의한다.
> 개발적 내용(DB 컬럼, API 경로, 캐시 TTL 등)은 포함하지 않는다. 코드와 AGENTS.md를 참조.

---

## Bounded Contexts

```
┌─────────────────────────────────────────────────────────────┐
│                       SONG Player                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │  Auth    │  │ Library  │  │ Playback  │  │Discovery  │ │
│  │          │  │          │  │           │  │           │ │
│  │ • User   │  │ • Likes  │  │ • Player  │  │ • Search  │ │
│  │ • OAuth  │  │ • History│  │ • Queue   │  │ • Melon   │ │
│  │ • Session│  │ • Play-  │  │ • Stream  │  │ • Recom-  │ │
│  │ • Route  │  │   lists  │  │ • Media   │  │   mend    │ │
│  │   Guard  │  │ • Chan-  │  │   Session │  │ • Onboard │ │
│  │          │  │   nels   │  │           │  │ • Home    │ │
│  └──────────┘  └──────────┘  └───────────┘  └───────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           Infrastructure                                 ││
│  │  • Cache Policies  • DTO Layer                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Context 간 관계

| From → To | 설명 |
|-----------|------|
| Auth → 모든 Context | 모든 기능은 인증된 User 기반 |
| Library → Playback | 좋아요/재생목록 트랙을 큐에 로드 |
| Library → Discovery | likes + history를 추천 입력으로 사용 |
| Playback → Discovery | 큐 소진 시 관련 영상 자동 로드 (autoplay) |
| Discovery → Library | 온보딩 시 likes + follows 시딩 |

---

## Domain Index

### Auth Context

| File | Description |
|------|-------------|
| [auth.md](auth.md) | 사용자 인증, 세션 관리, 라우트 보호 |

### Library Context

| File | Description |
|------|-------------|
| [likes.md](likes.md) | 좋아요 엔티티, upsert 정책, optimistic update |
| [history.md](history.md) | 재생 기록 엔티티, pruning 정책, upsert |
| [playlists.md](playlists.md) | 재생목록/트랙/폴더/스마트 재생목록, 공유, 복제, 재정렬 |
| [channels.md](channels.md) | 채널 팔로우, 언팔로우, 채널 정보 |

### Playback Context

| File | Description |
|------|-------------|
| [playback.md](playback.md) | 오디오 재생 상태머신, 큐 관리, 스트리밍 프록시, MediaSession |

### Discovery Context

| File | Description |
|------|-------------|
| [discovery.md](discovery.md) | 검색, 멜론 차트, 추천 엔진, 온보딩, 홈 화면 집계 |

### Shared

| File | Description |
|------|-------------|
| [ubiquitous-language.md](ubiquitous-language.md) | 도메인 공통 용어 사전 |

---

## Domain Relationships

```
User 1──* Like               (복합 PK: userId + videoId)
User 1──* History             (독립 PK, userId FK)
User 1──* Playlist            (독립 PK, userId FK)
User 1──* PlaylistFolder      (독립 PK, userId FK)
User 1──* FollowedChannel     (복합 PK: userId + channelId)

PlaylistFolder 1──* Playlist  (folderId, 삭제 시 orphan 처리)
Playlist 1──* PlaylistTrack   (CASCADE delete)

[Transient — DB 없음]
Audio ←── Like / History / PlaylistTrack / SearchResult / ChannelVideo / MelonChart
```

---

## Data Flow

```
                        ┌─────────────┐
                        │  Google OAuth│
                        └──────┬──────┘
                               ▼
                    ┌─────────────────────┐
          ┌────────│       User          │────────┐
          │        └─────────────────────┘        │
          ▼                ▼                      ▼
   ┌──────────┐    ┌──────────────┐    ┌─────────────────┐
   │  Library  │    │  Discovery   │    │   Playback      │
   │           │◄───│ • Search     │    │ • AudioPlayer   │
   │ • Likes   │◄───│ • Melon      │    │ • Queue         │
   │ • History │    │ • Recommend  │    │ • Stream Proxy  │
   │ • Playlist│    │ • Onboarding │    │ • MediaSession  │
   │ • Channels│    │ • Home       │    │                 │
   └─────┬─────┘    └──────┬───────┘    └────────┬────────┘
         │                 │                      │
         └────────┬────────┘                      │
                  ▼                               ▼
         ┌────────────────┐           ┌─────────────────────┐
         │  YouTube API   │           │  YouTube Stream      │
         │  (Innertube)   │           │  (Proxy)             │
         └────────────────┘           └─────────────────────┘

   ┌────────────────┐
   │ Melon Scraping │
   │ (Chart/Genre)  │
   └────────────────┘
```
