# Playback Domain

## 오디오 (Audio)

YouTube 영상을 음악으로 추상화한 재생 단위. DB에 영속화되지 않는 **transient** 객체.

### 속성

| Property | Description |
|----------|-------------|
| id | YouTube video ID |
| type | `'video'` (현재 video만 지원) |
| title | 영상 제목 |
| description | 영상 설명 |
| duration | 재생 시간 (초) |
| viewCount | 조회수 |
| thumbnail | 썸네일 URL |
| channel | `{ id?, name, thumbnail? }` 채널 정보 |

### 트랙 어댑터

모든 트랙 소스는 어댑터를 거쳐 Audio로 변환 후 재생:

| Source | Adapter | 설명 |
|--------|---------|------|
| Like | `likeToAudio()` | 좋아요에서 재생 |
| HistoryItem | `historyToAudio()` | 재생 기록에서 재생 |
| PlaylistTrack | `playlistTrackToAudio()` | 재생목록에서 재생 |
| SearchResultAudio | `searchResultToAudio()` | 검색 결과에서 재생 |
| ChannelVideo | `channelVideoToAudio()` | 채널 영상에서 재생 |
| MelonChartItem | `melonChartToAudio()` | 차트에서 재생 |

---

## AudioPlayer 상태머신

```
IDLE → LOADING → PLAYING ⇄ PAUSED
                  ↓ error (최대 2회 재시도)
                 ERROR

PLAYING → (ended) → RepeatMode.ONE? → 처음부터 재생
                  → Otherwise → 다음 트랙 재생
```

| State | 의미 |
|-------|------|
| IDLE | 재생 중인 트랙 없음 |
| LOADING | 오디오 소스 로딩 중 |
| PLAYING | 재생 중 |
| PAUSED | 일시정지 |
| ERROR | 재생 실패 (재시도 소진) |

---

## 큐 관리 (Queue)

### 큐 구조

| 영역 | 설명 |
|------|------|
| `queue` | 사용자가 명시적으로 선택한 곡 (Audio 배열) |
| `recommendedQueue` | autoplay / 추천 곡 탭에서 자동 로드된 곡 (Audio 배열) |
| `currentIndex` | 현재 재생 중인 `queue` 내 인덱스 (-1이면 빈 큐) |

### 큐 분리 정책

- `queue`에는 **사용자가 직접 고른 곡만** 들어감
- `recommendedQueue`에는 **autoplay로 자동 로드된 추천 곡**만 들어감
- "전체 재생" / "셔플" 버튼으로만 `queue`에 여러 곡이 들어감
- 개별 곡 탭 → 바텀시트 오픈 → "바로 재생" 선택 시 `queue = [1곡]`

### 큐 조작

| Operation | 동작 |
|-----------|------|
| `setQueue(tracks, start)` | 전체 큐 교체 + `recommendedQueue` 초기화 + 시작 인덱스부터 재생 |
| `addToQueue(audio)` | 사용자 큐 끝에 추가 (재생하지 않음) |
| `addNext(audio)` | 현재 트랙 직후에 삽입 |
| `removeFromQueue(index)` | 사용자 큐에서 제거. 현재 재생 트랙 제거 시 다음 트랙 자동 재생 |
| `clearQueue()` | 양쪽 큐 모두 비우기 + IDLE 상태 전환 |
| `addToRecommendedQueue(audio)` | 추천 큐 끝에 추가 |
| `removeFromRecommendedQueue(index)` | 추천 큐에서 제거 |
| `clearRecommendedQueue()` | 추천 큐만 비우기 |

### 재생 내비게이션

**다음 트랙 (`playNext`)**:
1. 큐가 비어있으면 동작 없음
2. 셔플 모드: 랜덤 인덱스 선택
3. 순차 모드: 다음 인덱스
   - 사용자 큐 끝 도달 시:
     - `recommendedQueue`에 곡이 있으면: 첫 곡 꺼내서 재생
     - `repeatMode = ALL`: 처음부터
     - `autoplay = true`: YouTube 관련 영상을 `recommendedQueue`에 추가 후 첫 곡 재생
     - 그 외: 정지

**이전 트랙 (`playPrevious`)**:
1. 현재 재생 시간 > 3초 → 처음부터 재생
2. 큐가 비어있으면 동작 없음
3. 셔플 모드: 랜덤 인덱스
4. 순차 모드: 이전 인덱스. 큐 시작 이전이면 `repeatMode = ALL` 시 마지막으로

---

## 반복 & 셔플

### 반복 모드 (순환 토글)

`OFF → ALL → ONE → OFF → ...`

| Mode | 동작 |
|------|------|
| OFF | 큐 끝에서 정지 |
| ALL | 큐 끝에서 처음으로 순환 |
| ONE | 현재 트랙 반복 |

### 셔플

- 활성화 시 다음/이전 트랙 선택에서 랜덤 인덱스 사용
- 큐 자체는 섞지 않음 (재생 순서만 랜덤)

### Autoplay

- 기본값: 활성화
- 큐 소진 + `recommendedQueue` 비어있음 + `repeatMode ≠ ONE` 시 관련 영상을 YouTube에서 조회하여 `recommendedQueue`에 추가
- `recommendedQueue`에 곡이 있으면 autoplay 없이 순차 소비
- 사용자 큐는 autoplay로 절대 수정되지 않음

---

## 스트리밍 프록시 (Stream Proxy)

YouTube 오디오 스트림을 서버에서 중계.

### 추출 전략

3-tier fallback으로 오디오 스트림 URL 획득:

1. MWEB 클라이언트 + Opus/WebM 포맷 (선호)
2. Android VR 클라이언트 + Opus/WebM 포맷 (1차 대체)
3. Android VR 클라이언트 + 임의 포맷 (최후 수단)

### 안정성 정책

- **재시도**: 스트림 오류 시 최대 2회 재시도
- **실패 기억**: 특정 추출 전략이 실패한 영상 ID를 기억하여 이후 우회
- **범위 요청**: seeking을 위한 Range 헤더 지원

---

## MediaSession

브라우저/OS 미디어 컨트롤과 연동.

- 트랙 메타데이터(제목, 아티스트, 아트워크) 설정
- lock screen / notification / 블루투스에서 제어 가능
- play, pause, stop, previoustrack, nexttrack, seekto 액션 지원

---

## 트랙 바텀시트 (Track Action Sheet)

모든 트랙은 **탭 시 바텀시트**가 열리며, 사용자가 재생 방식을 선택:

| Action | 동작 |
|--------|------|
| **바로 재생** | `queue = [해당 곡 1개]` 로 교체 후 즉시 재생 |
| 큐에 추가 | 사용자 큐 끝에 추가. 재생하지 않음 |
| 다음에 재생 | 현재 재생 트랙 직후에 삽입 |
| 재생목록에 추가 | 재생목록 선택 모달 열기 |
| 좋아요 / 취소 | 좋아요 토글 (페이지별) |
| 공유 | YouTube 링크 클립보드 복사 |
| YouTube에서 보기 | YouTube 원본 영상으로 이동 |
| 재생목록에서 제거 | 플레이리스트에서만 표시 |

### 전체 재생 / 셔플

개별 곡 탭과 별개로, 리스트 상단의 버튼으로만 전체 곡이 큐에 들어감:

| 버튼 | 동작 |
|------|------|
| "재생" 버튼 | `queue = 전체 리스트` + index 0부터 재생 |
| "셔플" 버튼 | `queue = 셔플된 전체 리스트` + index 0부터 재생 |
| "전체 재생" (차트) | 순차 YouTube 검색 후 `queue`에 추가 |

### 추천 곡 탭 (풀 플레이어)

풀 플레이어의 "추천 곡" 탭에서는 트랙이 `recommendedQueue`로만 감:

| 액션 | 동작 |
|------|------|
| 추천 곡 탭 | 탭한 곡 재생, 나머지는 `recommendedQueue`에 |
| "전체 재생" | 첫 곡 재생, 전체를 `recommendedQueue`에 |
| "+ 큐에 추가" | 사용자 `queue`에 명시적 추가 |
