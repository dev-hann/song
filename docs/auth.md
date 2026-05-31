# Auth Domain

## 사용자 (User)

Google OAuth로 인증된 서비스 사용자.

### 속성

| Property | Description |
|----------|-------------|
| email | Google 계정 이메일. 고유값 |
| name | 표시 이름 |
| picture | 프로필 이미지 URL (선택) |
| registeredAt | 가입일 |
| lastLogin | 마지막 로그인 일시 |
| isActive | 활성 계정 여부. 비활성 시 서비스 접근 불가 |

### 생명주기

1. **생성**: 첫 Google 로그인 시 자동 생성. 별도 가입 절차 없음.
2. **로그인**: 이후 로그인 시 `lastLogin` 갱신.
3. **비활성화**: `isActive = false`인 사용자는 로그인 거부. 기존 세션도 차단.

---

## 인증 정책

| 항목 | 정책 |
|------|------|
| Provider | Google OAuth 단일 제공자 |
| Session | JWT 기반, 30일 만료 |
| Auto-creation | 첫 로그인 시 User 자동 생성 (별도 가입 화면 없음) |
| Inactive Block | 비활성 사용자는 로그인 거부 |

---

## 라우트 보호 정책

### 공개 경로 (인증 불필요)

- 로그인 페이지
- Auth.js 엔드포인트
- 멜론 차트 API
- YouTube 검색/스트리밍 API
- 건강 체크 API
- 공유 재생목록 페이지

### 보호 경로 (인증 필수)

- 미인증 API 요청 → 401
- 미인증 페이지 요청 → 로그인 페이지로 리다이렉트
- 모든 Library, Discovery, Playback 기능은 인증 후 사용 가능
