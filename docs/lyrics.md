# Lyrics Domain

## 가사 (Lyrics)

YouTube 영상의 타임드 가사. YouTube 자동 자막(transcript)에서 추출.

### 속성

| Property | Description |
|----------|-------------|
| videoId | YouTube video ID |
| language | 감지된 언어 코드 |
| lines | 시간 동기화된 가사 줄 목록 |

### 가사 줄 (LyricsLine)

| Property | Description |
|----------|-------------|
| startTimeMs | 시작 시간 (밀리초) |
| endTimeMs | 종료 시간 (밀리초) |
| text | 가사 텍스트 |

---

## 비즈니스 정책

### 출처

- YouTube 영상의 자동 생성 자막(captions/transcript)에서 추출
- 사용자가 직접 가사를 편집하거나 업로드할 수 없음

### Nullable

- 자막이 없는 영상은 `null` 반환
- 가사 없음이 에러가 아님 — 정상적인 상태
- 클라이언트는 가사 미지원 영상에 대해 대체 UI 표시

### 공개 접근

- 인증 없이 조회 가능 (공개 API)
- 재생 중인 트랙의 가사만 조회

---

## 클라이언트 정책

### 자동 스크롤

- 현재 재생 시간에 해당하는 줄이 뷰 중앙으로 자동 스크롤

### 탭하여 이동

- 가사 줄 탭 시 해당 줄의 시작 시간으로 seek

### 풀 플레이어 탭

- 풀 플레이어의 "가사" 탭에서 확인 (재생 컨트롤 / 추천 곡과 별도 탭)
