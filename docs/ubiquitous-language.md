# Ubiquitous Language

SONG Player 도메인에서 사용하는 공통 용어를 정의한다.

| 용어 | 의미 |
|------|------|
| **User** | Google OAuth로 인증된 서비스 사용자 |
| **Audio** | YouTube 영상을 음악으로 추상화한 재생 단위. DB에 영속화되지 않는 transient 객체 |
| **Like** | 사용자가 저장한 트랙. 개인 음악 라이브러리의 기본 단위 |
| **History** | 재생 이력. 재생 시 자동 기록, 사용자가 명시적으로 추가하지 않음 |
| **Playlist** | 사용자가 큐레이션한 트랙 컬렉션. 일반 재생목록과 스마트 재생목록 두 종류 |
| **PlaylistTrack** | 재생목록에 속한 개별 트랙 |
| **PlaylistFolder** | 재생목록을 그룹화하는 선택적 컨테이너 |
| **SmartPlaylist** | 규칙 기반으로 자동 필터링되는 재생목록. 사용자의 likes를 데이터 소스로 사용 |
| **Channel** | YouTube 채널. 팔로우하여 추천 입력으로 활용 |
| **Onboarding** | 신규 사용자의 초기 장르/아티스트 선택 및 라이브러리 시딩 과정 |
| **Recommendation** | 사용자의 재생 기록, 좋아요, 팔로우 채널 기반 개인화 추천 |
| **Queue** | 클라이언트 측 재생 대기열. 순차/셔플/반복 재생 지원 |
| **Stream Proxy** | YouTube 오디오 스트림을 서버에서 중계. 여러 추출 전략으로 안정성 확보 |
| **Melon Chart** | 멜론 차트 스크래핑 데이터. 실시간/HOT100/일간 차트를 홈 화면과 온보딩에 활용 |
| **Track Snapshot** | 외부 데이터(YouTube)를 로컬에 저장할 때의 메타데이터 캡처. 원본 변경과 무관 |
| **ShareId** | 공개 재생목록의 공유 식별자. 공개 설정 시 자동 생성 |
| **SearchResultAudio** | YouTube 검색 결과 트랙. 검색 최소 단위 |
| **ChannelInfo** | YouTube 채널 상세 정보. 팔로우 여부 포함 |
| **AudioStatus** | 오디오 재생 상태머신 (idle/loading/playing/paused/error) |
| **RepeatMode** | 반복 재생 모드 (off/all/one) |
| **Lyrics** | YouTube 영상의 타임드 가사. 자동 자막(transcript)에서 추출. 자막이 없으면 null |
| **LyricsLine** | 시간 동기화된 개별 가사 줄. startTimeMs/endTimeMs/text로 구성 |
| **FlatTrackSource** | 범용 평면 구조 트랙. 멜론 차트 등에서 사용. 채널이 중첩 객체가 아닌 문자열 |
| **ExtendedAudio** | Audio의 확장 타입. uploadDate 추가 포함. 상세 정보 조회 시 사용 |
| **AudioPlayback** | 현재 재생 세션의 실시간 상태. currentTime, duration, speed 포함 |
