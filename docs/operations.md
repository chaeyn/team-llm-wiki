# 위키 검색·웹 운영

## 배포 구조

설치 절차는 [팀 설치](team-setup.md)를 따른다. Compose 내부 네트워크를 사용하며 API만 호스트 loopback에 공개한다. Markdown 정본은 별도 Git checkout에서 읽기 전용으로 연결한다.

## 서비스와 인증

| 서비스 | 기본 주소 | 접근 |
|---|---|---|
| API·MCP·웹 진입점 | `127.0.0.1:3100` | 기존 reverse proxy, 팀 GitHub 로그인 |
| Fumadocs | `wiki-web:3000` | API가 인증 후 전달 |
| Qdrant | `qdrant:6333` | 서버 내부 |
| 로컬 임베딩 | `embeddings:8090` | 서버 내부 |
| LLM provider | 설정값(`LLM_BASE_URL`) | provider API key |

API의 호스트 포트는 loopback으로 유지한다. 외부에는 API 진입점만 연결한다. 문서 응답은 `private, no-store`이며 웹 빌드에 위키 원문을 포함하지 않는다.

`.env.example`을 참고해 GitHub 인증 설정에 더해 `LLM_API_KEY`와 선택적 `WIKI_SERVICE_KEY`를 설정한다. 서로 다른 32자 이상의 난수를 사용하며 `.env` 권한은 `600`으로 둔다. 읽기 전용 내부 연동에는 `WIKI_SERVICE_KEY`만 전달한다. 이 key는 명시된 문서/Notion 읽기 API와 읽기 MCP에만 쓸 수 있고 웹 쓰기는 거부한다.

chat LLM provider는 `llm.provider`로 선택한다. 기본 `openai-compatible`은 `LLM_BASE_URL`·`LLM_API_KEY`로 `{baseUrl}/chat/completions`를 호출한다. `hermes-bridge`는 별도 추론 서비스에 위임하며 예시는 `deploy/examples/hermes-bridge`에 있다. `disabled`는 chat 엔드포인트가 503을 반환한다. 토큰과 key를 Git·로그·브라우저에 넣지 않는다.

## 색인 갱신과 복구

- 시작 시와 60초마다 원문을 확인한다. 같은 입력은 임베딩 캐시를 재사용한다.
- 새 collection에 모든 벡터와 manifest를 쓴 뒤 원문 hash를 다시 확인하고 설정한 벡터 alias(`search.vector.collectionAlias`, 기본 `team_llm_wiki`)를 바꾼다.
- 실패하면 이전 alias를 유지한다. 검색 응답의 `retrieval.semantic_status`와 인증된 `/api/status`에서 상태를 확인한다. `ready`일 때만 색인 완료로 판단한다.
- 첫 실행은 고정 revision의 모델을 내려받는다. 이후 모델 volume을 재사용한다. 원문 임베딩은 서버 CPU에서 수행한다.
- 모델·분할 규칙 변경은 새 generation을 만든다. 이전 collection은 자동 삭제하지 않는다. rollback 기간이 지난 collection만 alias 사용 여부를 확인한 뒤 운영자가 정리한다.
- 원문 hash가 달라진 벡터 후보는 검색 근거에서 제외한다. 벡터 서비스 장애 때 키워드 검색을 제공하며 응답에 상태를 표시한다.

`docker compose up -d --build` 후 `/health`, 인증된 `/api/status`, 한국어 `/api/context`, 문서 화면, 출처가 있는 챗봇 응답을 확인한다. 컨테이너 시작만으로 검증을 끝내지 않는다. 재배포 전 `.env`와 이전 이미지·collection 이름을 보관한다.

검증 환경의 volume을 운영으로 옮길 때 `.env`의 `QDRANT_VOLUME`, `EMBEDDING_MODELS_VOLUME`, `EMBEDDING_CACHE_VOLUME`에 기존 volume 이름을 지정할 수 있다. 두 Qdrant 인스턴스가 같은 volume을 동시에 열지 않도록 이전 서비스를 먼저 중지한다. volume을 삭제하지 않는다.

## 읽기 예산과 기록

`max_chars`는 반환할 원문 근거 JSON의 문자 예산이다. 전체 HTTP 응답이나 모델 추론 토큰 한도가 아니다. 큰 표·코드블록에는 `required_chars`가 나올 수 있다. `truncated`와 `next_cursor`를 확인하고 필요한 근거를 이어 읽는다. cursor는 해당 프로세스에서 10분간 유효하므로 만료·재시작 뒤에는 검색부터 다시 시작한다.

토큰 비교는 고정된 위키 commit과 tokenizer를 기록한다. 신규 내용 작성량, 검색 recall, 실제 provider 사용량을 응답 크기와 구분한다. 비공개 원문과 평가 payload는 공개 코드 저장소에 올리지 않는다.

## 사용량과 의견 보존

`WIKI_MEASUREMENT_SECRET`는 신원 가명 처리 전용 key이고 다른 서비스 key와 분리한다. `WIKI_MEASUREMENT_RELEASE`에는 배포 commit을 넣는다. `/metrics/events.sqlite`는 별도 Docker volume에 두고 컨테이너 교체 뒤에도 보존한다. 원시 이벤트와 제출 의견은 90일 보존하며 매시간 정리한다. `/docs/insights`의 JSON export에는 생성 시각·기간·release·표본 수가 들어간다. 개선 전후 비교 자료는 기간이 끝날 때 내려받아 별도로 보관한다.

DB 백업은 SQLite backup API 또는 `VACUUM INTO`로 일관된 snapshot을 만든다. 실행 중인 DB 파일 하나만 복사하면 WAL의 최신 기록을 놓칠 수 있다. DB와 백업은 접근을 제한하고 원문 의견의 보관 기간을 맞춘다. HMAC key를 바꾸면 같은 사람의 관측 연결이 끊기므로 회전 시각을 기록한다.

배포 smoke는 `integration-smoke` 신원을 사용하고 운영 사용자·재방문 집계에서 제외한다. provider usage가 존재하는 실응답, 의견 저장, 인증 거부, 문서 화면을 각각 확인한다. 일반 팀원의 세션으로 자동 시험 이벤트를 만들면 실사용 지표에 섞이므로 시험 환경이나 검증 신원을 사용한다.

## 팀 공용 채팅 기록

웹 채팅은 서버의 `WIKI_CHAT_PATH`에 질문·답변·출처·작성 시각을 저장한다. Docker에서는 별도 `chat-data` volume을 사용하므로 웹이나 API 컨테이너를 교체해도 기록을 유지한다. 로그인한 팀원은 같은 대화 목록을 보고 이어서 질문할 수 있다. 사용자별 비공개 기록으로 분리하지 않는다. 저장된 대화를 위키 문서로 자동 반영하지는 않는다.

이 기록은 90일 보존하는 사용량 DB와 별개이며 자동 만료하지 않는다. 백업은 SQLite backup API나 `VACUUM INTO`를 사용하고, 백업 파일에도 팀 문서와 같은 접근 제한을 적용한다. 운영 volume 삭제를 배포나 정리 절차에 넣지 않는다.

대화 목록과 메시지는 나누어 읽는다. 모델에는 최근 최대 12개 메시지, 합계 24,000자까지만 전달한다. 보관한 원문을 줄이지 않고 모델에 전달하는 문맥만 제한한다. 다른 팀원의 답변이 추가되면 버전을 확인해 충돌을 알린다. 같은 요청 ID의 완료된 질문을 재전송하면 저장된 결과를 반환한다.

배포 검증은 로그인 없이 기록을 읽을 수 없는지, 읽기 전용 서비스 key로 접근할 수 없는지, 두 팀원 신원에서 같은 대화가 보이는지, 재시작 후 기록이 남는지를 확인한다. 합성 대화는 검증 환경에서 만들고 실제 팀원의 대화와 구분한다.

## 서비스 key로 읽기 전용 MCP 연결

OAuth 재로그인을 진행할 수 없는 비대화형 내부 클라이언트는 `WIKI_SERVICE_KEY`를 비밀 환경 변수로 주입해 읽기 전용 MCP에 연결할 수 있다. 개인 에이전트와 웹 로그인은 GitHub OAuth를 그대로 사용한다.

서비스 키가 허용하는 MCP 범위는 `POST /mcp`의 초기화·ping·도구 목록과 명시된 읽기 도구다. 새 도구는 인증 allowlist 검토 전까지 자동으로 열리지 않는다. 공용 대화·사용 지표·피드백 API와 임의 MCP 메서드, JSON-RPC batch는 허용하지 않는다. 호출은 사람 사용률에서 제외하는 서비스 신원으로 기록한다.

클라이언트 설정에서는 OAuth 대신 `headers.Authorization: Bearer ${WIKI_SERVICE_KEY}`를 사용한다. 실제 값은 서버의 비밀 환경 파일에만 저장하며 저장소·로그에 기록하지 않는다. 재시작 후 도구 목록과 실제 `get_context` 호출을 확인한다. 위키 갱신은 제안·요청자 확인·Draft PR 흐름을 사용한다.

## 웹 Wiki Agent 문서 PR

`/update` 뒤에 문서 경로와 생성·수정할 내용 또는 삭제 이유를 적는다. 명령만 보내면 최근 대화의 사용자 요청을 참고한다. 모델에는 최근 12개 메시지와 대상 문서의 전체 원문을 합계 40,000자까지 전달한다. 원문을 예산 안에서 읽지 못한 문서의 수정·삭제는 거부한다. 불분명한 요청은 추가 정보를 묻는다. 한 변경안은 최대 4개 문서이며 생성·수정할 본문 합계는 50,000자 이하이다.

변경안은 채팅 DB에 보존한다. 요청한 팀원이 변경 전후 내용을 확인하고 `PR 열기`를 누르면 위키 봇(GitHub App)이 정본 위키 저장소에 커밋하고 Draft PR을 연다. 다른 팀원은 변경안과 PR을 읽을 수 있다. API의 읽기 전용 서비스 key는 이 기능에 접근할 수 없다. 정본 checkout의 read-only mount와 MCP 읽기 범위는 유지한다.

서버 `.env`에 `WIKI_GITHUB_APP_CLIENT_ID`, `WIKI_GITHUB_APP_PRIVATE_KEY_PATH`, 필요한 인증정보를 설정하고 `COMPOSE_FILE=compose.yaml:compose.wiki-updates.yaml`을 추가한다. 저장소·App slug·선택적 추적 이슈는 YAML로 설정한다. 위키 봇은 설정한 App slug의 `[bot]` 계정을 사용하며 App 응답의 slug가 `WIKI_GITHUB_APP_SLUG`와 일치해야 한다. 대상 저장소에 설치하고 Contents write·Pull requests write 권한을 부여한다. 개인 토큰 fallback을 제공하지 않는다. PEM을 Docker secret으로 읽기 전용 연결하고 원문과 토큰을 응답·로그에 출력하지 않는다. 키 mount와 App 설정이 없으면 기존 서비스는 실행되며 업데이트 요청에 준비 중 안내를 반환한다.

운영자가 `docker compose up -d --build`로 재시작한 뒤 검증 신원의 채팅에서 변경안과 Draft PR 생성, GitHub의 Bot 작성자와 커밋 author·committer를 확인한다. 합성 테스트 문서는 운영 문서와 구분한다. 위키 반영은 팀원의 PR 검토·병합과 정본 동기화 이후에 확인한다.

PR 생성 직전에 GitHub 기본 브랜치의 대상 원문 hash를 비교한다. 생성 경로가 이미 있거나 원문이 바뀌면 409를 반환하고 새 변경안을 요청한다. 삭제 tree 항목은 `sha: null`로 기록한다. 변경안마다 고정된 브랜치와 PR 표식을 사용해 응답 유실·재시작 후 재시도에서도 기존 PR과 브랜치를 검증하고 재사용한다. GitHub 오류 응답·토큰은 사용자에게 전달하지 않는다.
