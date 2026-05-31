# Playlists Domain

## 재생목록 (Playlist)

사용자가 큐레이션한 트랙 컬렉션. 일반 재생목록과 스마트 재생목록 두 종류.

### 속성

| Property | Description |
|----------|-------------|
| name | 재생목록 이름 |
| description | 설명 (선택) |
| coverImage | 커버 이미지 URL (선택) |
| isSystem | 시스템 생성 여부. 시스템 재생목록은 삭제 불가 |
| trackCount | 트랙 수 (비정규화 카운터) |
| rules | 스마트 재생목록 규칙. null이면 일반 재생목록 |
| folderId | 소속 폴더 (선택) |
| isPublic | 공개 여부. 공개 시 공유 링크 생성 가능 |
| shareId | 공유용 고유 식별자 (공개 설정 시 자동 생성) |
| createdAt | 생성일 |
| updatedAt | 수정일 (트랙 변경 시 자동 갱신) |

---

## 재생목록 트랙 (PlaylistTrack)

재생목록에 속한 개별 트랙.

### 속성

| Property | Description |
|----------|-------------|
| videoId | YouTube video ID |
| title | 영상 제목 (추가 시점 스냅샷) |
| channel | 채널명 (추가 시점 스냅샷) |
| thumbnail | 썸네일 URL (추가 시점 스냅샷) |
| duration | 재생 시간 (초, 추가 시점 스냅샷) |
| sortOrder | 정렬 순서. 새 트랙은 항상 마지막 |
| addedAt | 추가일 |

---

## 재생목록 폴더 (PlaylistFolder)

재생목록을 그룹화하는 선택적 컨테이너.

### 속성

| Property | Description |
|----------|-------------|
| name | 폴더 이름 |
| sortOrder | 정렬 순서 |
| createdAt | 생성일 |

---

## 스마트 재생목록 규칙 (SmartPlaylistRules)

사용자의 likes를 대상으로 필터링하는 규칙 엔진.

### 스키마

```typescript
{
  match: 'all' | 'any',       // AND / OR
  conditions: [{
    field: 'channel' | 'title' | 'minDuration' | 'maxDuration' | 'addedAfter' | 'addedBefore',
    operator: 'contains' | 'equals' | 'startsWith' | 'gt' | 'lt' | 'gte' | 'lte',
    value: string | number,
  }]  // 최소 1개 조건 필수
}
```

### 필드별 의미

| Field | 비교 대상 | 설명 |
|-------|----------|------|
| channel | 채널명 | 문자열 매칭 |
| title | 영상 제목 | 문자열 매칭 |
| minDuration | 재생 시간 | 최소 길이 필터 (초) |
| maxDuration | 재생 시간 | 최대 길이 필터 (초) |
| addedAfter | 좋아요 추가일 | 이후에 추가된 트랙 |
| addedBefore | 좋아요 추가일 | 이전에 추가된 트랙 |

### 연산자

| Operator | 동작 |
|----------|------|
| contains | 대소문자 무시 부분 일치 |
| equals | 완전 일치 |
| startsWith | 대소문자 무시 접두사 일치 |
| gt / lt / gte / lte | 수치 또는 날짜 비교 |

---

## 비즈니스 정책

### System Playlist

- "좋아요한 곡" 재생목록은 시스템이 자동 관리
- 삭제 불가
- 재생목록 목록 조회 시 항상 첫 번째에 위치
- 존재하지 않으면 자동 생성

### 트랙 관리

- **중복 금지**: 동일 `videoId` 추가 시 거부
- **정렬**: `sortOrder` 기준. 새 트랙은 항상 마지막에 추가
- **재정렬**: 트랙 ID 배열로 전체 순서 일괄 변경
- **updatedAt**: 트랙 추가/삭제/재정렬 시 자동 갱신

### 공유

- `isPublic = true` 설정 시 공유 식별자 자동 생성
- 공유된 재생목록은 인증 없이 접근 가능
- `isPublic = false` 전환 시 공유 식별자 제거

### 복제

- `{원본 이름} (사본)`으로 전체 트랙 복사
- 복제본은 항상 일반 재생목록 (system 아님)

### 목록 정렬

- 시스템 재생목록 먼저, 그 다음 최근 수정 순

### 폴더

- 재생목록을 그룹화하는 선택적 컨테이너
- **폴더 삭제 시**: 소속 재생목록은 유지 (폴더 참조만 제거)
