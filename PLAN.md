# team-llm-wiki 계획

## 아키텍처

팀마다 독립 설치하는 단일 테넌트 서비스다. Markdown Git 저장소가 정본이고 API 컨테이너에는 읽기 전용 checkout을 연결한다. Fastify(Node 24)는 키워드·Qdrant 벡터 검색을 RRF로 합치고 현재 원문의 hash를 확인한다. MCP는 읽기 전용이며 Next.js/Fumadocs 웹은 인증된 API에서 문서를 읽는다.

기록은 두 경로로 남긴다. 에이전트는 별도 로컬 checkout에서 섹션 hash 기반 patch와 Git diff를 검증한다. 웹은 공유 채팅의 `/update` → 변경 전후 검토 → **요청자 본인**의 확인 → GitHub App Draft PR 흐름을 사용한다. 사람이 병합한 뒤 서버 checkout을 fast-forward하고 재색인한다. 세션 종료·제품 PR 병합에 따른 자동 기록 수집기는 포함하지 않는다.

## 팀 설정

`wiki.config.yaml` 하나에 브랜드·봇 이름·언어, 공개 URL·origin, GitHub 조직, 정본 저장소·브랜치·지표 문서·이력 폴더, MCP 이름, 업데이트 명령·별칭·App slug·선택적 추적 이슈, 임베딩 모델·revision·차원, Qdrant alias, LLM 공급자·모델·프롬프트, Notion root를 둔다. 웹 브랜드는 같은 YAML에서 빌드 시 파생하고 임베딩 서비스도 같은 YAML을 읽는다.

OAuth/App 식별자·시크릿·키 경로·LLM/Notion 토큰과 설치 경로는 `.env`에만 둔다. `.env.example`에는 placeholder만 있다. 배포 runner와 checkout 경로는 예제 workflow의 Actions 변수로 지정한다. 스킬의 저장소·MCP 이름·담당자 placeholder는 설치 시 팀 설정에 맞춘다.

## 새 팀 셋업

1. 예제 위키를 별도 정본 저장소로 만들고 서버에 checkout한다.
2. YAML과 `.env` 예제를 복사해 팀 값과 인증정보를 입력한다.
3. GitHub OAuth App의 callback을 공개 주소에 맞추고 조직 접근을 확인한다.
4. Docker Compose와 HTTPS reverse proxy를 실행하고 웹·MCP를 확인한다.
5. 필요하면 GitHub App과 key mount를 추가해 Draft PR을 시험한다.
6. 정본 저장소에 동기화 workflow를 설치하고 읽기/업데이트 스킬을 배포한다.

자세한 절차는 [팀 설치 가이드](docs/team-setup.md)에 있다.

## MVP와 권한

포함: 단일 팀 인증, 하이브리드 검색, MCP 읽기, 공유 대화·기록·계측, 요청자 확인과 Draft PR, 선택적 Notion, v0.9 기반 wiki-update 단일 원본, MIT 공개 배포.

`/mcp` audience는 읽기 MCP만 허용한다. `/api` audience는 API별 `api:read`/`api:write`가 필요하다. 웹 세션의 쓰기는 same-origin 검사와 요청자 확인을 거친다. scope 없는 기존 MCP 토큰은 읽기 MCP 호환만 유지한다.

## 남은 열린 결정

- 팀별 백업·대화 보존 기간, 조직 탈퇴 시 즉시 권한 회수 정책.
- 사용할 LLM과 추론 옵션 지원 범위, 완전한 다국어 UI 범위(현재 UI는 주로 한국어).
- 후속 인증 공급자, 추가 문서 소스와 자동 기록 트리거의 승인 계약.
- 수평 확장이 필요할 때 OAuth code 재사용 방지와 색인 잠금의 공유 저장소.
