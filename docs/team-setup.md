# 새 팀 셀프호스트 설치

한 설치는 한 팀·한 위키를 담당한다. 서버 프로그램 저장소와 Markdown 정본 저장소를 분리한다. 로그인한 팀원은 위키와 공유 대화를 함께 읽는다.

## 1. 정본과 서버 준비

- HTTPS 도메인, Docker Compose 서버, GitHub 조직을 준비한다.
- `examples/wiki-starter/`의 일반 예제를 별도 위키 저장소로 복사한다. metadata의 도메인·담당자는 팀의 용어로 정한다.
- 서버에 위키를 읽기 전용 deploy credential로 clone하고 기본 브랜치를 checkout한다. Git 작업은 호스트에서, API에는 읽기 전용 mount로 제공한다.
- 이 프로젝트를 clone하고 루트의 `wiki.config.example.yaml` → `wiki.config.yaml`, `.env.example` → `.env`를 복사한다. `.env`는 `chmod 600`으로 보호한다.

## 2. 팀 설정과 인증

YAML에서 `branding`, `locale`, `server.publicBaseUrl`, `server.allowedOrigins`, `auth.github.org`, `wiki.repository`, `wiki.defaultBranch`, `mcp.serverName`을 정한다. 지표 도구를 사용하려면 `wiki.metricsNote: _metrics.md`를 지정한다. 설정이 없으면 해당 도구를 등록하지 않는다.

GitHub OAuth App의 홈페이지를 공개 URL, callback을 `<publicBaseUrl>/auth/github/callback`으로 설정한다. `.env`에 OAuth client ID/secret과 서로 독립적인 난수 `SESSION_SECRET`을 입력한다. 조직의 OAuth App 접근 정책을 확인한다. 로그인 시 활성 member/admin 자격을 검사한다.

`WIKI_HOST_PATH`는 서버의 실제 정본 checkout 절대경로다. 나머지 팀 설정은 YAML에 둔다. `.env`·키·실제 Notion ID가 들어간 개인 YAML은 Git에 올리지 않는다. `.gitignore`는 `.env`, `.env.*`, `wiki.config.yaml`, 키 파일을 제외한다.

## 3. 실행과 HTTPS

```sh
docker compose config --quiet
docker compose up -d --build
curl http://127.0.0.1:3100/health
```

Compose는 API만 `127.0.0.1:3100`에 공개한다. 웹·Qdrant·임베딩은 컨테이너 네트워크 내부에서 통신한다. `deploy/Caddyfile.example`의 도메인을 바꾸고 API로 모든 요청을 전달한다. API가 인증 후 웹을 proxy하므로 웹 컨테이너를 별도로 외부에 공개하지 않는다.

웹 제목·봇 이름·명령·언어 속성은 YAML에서 빌드 시 파생한다. 바꾸면 `docker compose up -d --build`로 다시 빌드한다. 현재 UI 문구는 주로 한국어이며 `locale`이 전체 UI를 번역하지는 않는다. 로고는 팀이 제공하는 접근 가능한 URL을 사용한다.

`/docs` 로그인, 문서 열기, 검색, 인증된 `/api/status`의 vector 상태를 확인한다. 첫 실행은 임베딩 모델 다운로드가 필요하다. 모델/revision/차원을 바꾸면 같은 YAML을 API와 임베딩 서비스에 적용하고 재시작한다.

## 4. 챗과 기록·Draft PR

`llm.provider`, `llm.baseUrl`, `llm.model`, 필요하면 `llm.systemPrompt`를 YAML에 지정하고 `.env`에 `LLM_API_KEY`를 넣는다. 공급자가 지원하는 추론 옵션을 사용한다. `disabled`는 챗 요청에 503을 반환한다. 외부 LLM에는 대화와 문서 근거가 전송된다.

업데이트를 사용하려면 GitHub App을 만들고 **정본 저장소 하나**에 설치한다. Contents/Pull requests write 권한을 부여하고 YAML의 `updates.githubApp.slug`에 App slug를 입력한다. `updates.trackingIssue`는 선택값이다. `.env`에서 다음 항목을 활성화한다.

```dotenv
WIKI_GITHUB_APP_CLIENT_ID=your-github-app-client-id
WIKI_GITHUB_APP_PRIVATE_KEY_HOST_PATH=/path/to/your/wiki-bot.pem
COMPOSE_FILE=compose.yaml:compose.wiki-updates.yaml
```

PEM은 프로젝트 바깥 보호된 경로에 둔다. overlay가 `/run/secrets/wiki-bot.pem`에 읽기 전용 연결한다. 공개 client ID도 예제 파일에 실제 값을 기록하지 않는다.

공유 채팅에서 `/update`로 변경안을 만든 뒤 **요청자 본인**이 변경 전후를 확인하고 `PR 열기`를 누른다. 다른 참여자는 읽기만 가능하다. GitHub에서 Bot 작성자, Draft 상태, 대상 브랜치·diff를 검토한 뒤 사람이 병합한다. API는 정본 checkout을 직접 쓰지 않는다.

## 5. MCP와 에이전트 스킬

README의 CLI 예제에서 MCP 이름과 URL을 팀 값으로 바꿔 등록한다. Streamable HTTP `/mcp`와 OAuth 동적 등록을 지원한다. `get_wiki_status`, `get_context`, `read_sections`로 실제 근거와 commit을 확인한다. Notion 도구는 미설정 시 비활성 상태를 반환한다.

`agent-skills/wiki-reader`, `agent-skills/wiki-update`를 각 에이전트의 스킬 폴더에 설치한다. wiki-update는 v0.9 기반 단일 원본이다. `<wiki-repo>`, `<mcp-server-name>`, `<wiki-owner>`를 팀 값으로 치환하고 별도 로컬 위키 checkout 경로를 지정한다. 조직별 폴더 체계나 한국어 커밋을 강제하지 않는다.

MCP 토큰은 웹 쓰기에 사용할 수 없다. 웹 자동화가 필요하면 OAuth resource `<publicBaseUrl>/api`와 필요한 `api:read`/`api:write` scope를 명시한다. 기본 MCP OAuth는 `mcp:read`만 발급한다. 전체 권한 표는 [README](../README.md#writes-and-authentication)에 있다.

## 6. 동기화와 선택적 소스

정본 저장소에 `examples/github-workflows/sync-wiki-checkout.yml`을 설치한다. Actions 변수 `WIKI_ROOT`, `WIKI_RUNNER_LABEL`, `WIKI_DEFAULT_BRANCH`를 서버 경로·runner label·YAML의 기본 브랜치와 맞춘다. workflow는 깨끗한 올바른 저장소/브랜치만 fast-forward한다. 병합 뒤 MCP commit과 vector 상태가 갱신됐는지 확인한다.

Notion을 쓰면 YAML의 `sources.notion.enabled`와 `rootPageIds`를 정하고 `.env`에 integration 토큰을 넣는다. Integration에 해당 root의 읽기 권한을 공유한다. 검색은 허용 root 경계와 원문 재조회를 유지한다. 실제 page/DB ID를 예제나 공개 문서에 복사하지 않는다.

## 7. 운영 인수 확인

- 비로그인 API는 401, 조직 밖 로그인은 거부되는지 확인한다.
- MCP 읽기 성공과 같은 토큰의 웹 쓰기 403을 확인한다.
- 웹 요청자의 Draft PR, 다른 사람의 발행 거부, 충돌 시 409를 확인한다.
- 재시작 뒤 공유 대화·변경안이 유지되고 병합 후 정본이 갱신되는지 확인한다.
- SQLite는 backup API 또는 `VACUUM INTO`로 백업한다. 대화는 자동 만료하지 않으므로 팀별 보관 정책을 정한다. 계측 원시 기록은 90일 보존한다.
- 자격증명 회전과 조직 탈퇴 대응은 [인증 정책](auth-session-policy.md), 복구는 [운영 문서](operations.md)를 따른다.

세션 종료나 제품 PR 병합 때 자동으로 위키를 쓰는 수집기는 포함하지 않는다. 이러한 트리거는 기록 범위와 승인 주체를 먼저 정한 뒤 별도로 연결한다.
