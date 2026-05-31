# Channels Domain

## 팔로우 채널 (FollowedChannel)

사용자가 팔로우한 YouTube 채널.

### 속성

| Property | Description |
|----------|-------------|
| channelId | YouTube channel ID. 사용자당 고유 |
| channelName | 채널명 (팔로우 시점 스냅샷) |
| channelThumbnail | 채널 썸네일 URL (팔로우 시점 스냅샷) |
| subscriberCount | 구독자 수 (팔로우 시점 스냅샷) |
| followedAt | 팔로우한 시각 |

### 식별자

- **복합 키**: `(userId, channelId)` — 사용자는 동일 채널을 하나만 팔로우할 수 있음

---

## 비즈니스 정책

### 팔로우 (Follow)

- **Upsert**: 동일 채널을 다시 팔로우하면 메타데이터 갱신 + `followedAt` 초기화
- 채널 메타데이터를 **스냅샷으로 저장** (YouTube 원본 변경과 무관)

### 언팔로우 (Unfollow)

- 명시적 삭제만 가능
- 팔로우하지 않은 채널 언팔로우 시 오류 반환

### 채널 정보 조회

- YouTube에서 실시간 조회 (로컬 스냅샷과 무관)
- 현재 사용자가 팔로우 중인지 여부 함께 반환

---

## 활용

- **추천 입력**: 팔로우한 채널명으로 YouTube 검색하여 추천 생성
- **온보딩 시딩**: 온보딩 완료 시 선택한 아티스트의 첫 번째 트랙 채널을 자동 팔로우
- 시딩된 채널은 합성 ID 사용 (실제 YouTube channel ID와 구분)
