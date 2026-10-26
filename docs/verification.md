# 검증 결과

2026-10-26, Node v24.22.1에서 실행했다. 작업 트리는 main, 커밋 0개,
remote 없음이다. 원본 읽기 전용 클론은 수정하지 않았고 외부 저장소·PR·메시지를
생성하지 않았다. 현재 실제 환경 파일은 없으며 환경 파일·개인 YAML·키 파일의
Git 제외를 확인했다.

## 명령별 최종 결과

아래 npm 명령은 Node 24의 bin을 PATH 앞에 지정해 실행했다.

| 위치 / 명령 | 최종 결과 |
| --- | --- |
| 루트 `npm install` | 통과, 158개 패키지 감사; 이름·MIT lockfile 갱신 |
| 루트 `npm run check` | 통과 (TypeScript) |
| 루트 `npm test` | **115/115 통과**, 실패·skip 0 |
| 루트 `npm run build` | 통과 |
| web `npm install` | 통과, 253개 패키지 감사; YAML 의존성과 lockfile 갱신 |
| web `npm run check` | 통과 (TypeScript) |
| web `npm run build` | 통과 |
| `WIKI_TEST_BROWSER_CHANNEL=chrome npm run test:ui` | 통과, 브라우저 시나리오 1개: desktop/mobile, preview/publish, reload, stale conflict, create collision |
| `WIKI_TEST_BROWSER_CHANNEL=chrome npm run test:notion-ui` | 통과, 브라우저 시나리오 1개: 출처, 후속 범위 수정, reload, mobile |
| `python3 -m unittest discover -s deploy -p 'test_*.py'` | **2/2 통과** |
| 동일 unittest, `-s deploy/examples/hermes-bridge` | **1/1 통과**, 외부 모델 호출 없는 mock 검사 |
| 동일 unittest, `-s agent-skills/wiki-update/scripts` | **9/9 통과** |
| skill-creator `quick_validate.py` | wiki-reader / wiki-update **2/2 통과** |
| `python3 scripts/package-plugin.py --output /tmp/team-llm-wiki-plugin.zip --server-name sample-wiki --endpoint https://docs.example.com/mcp` | 통과, 7파일 ZIP; 사용자 endpoint/name 반영 |
| Compose·예제 YAML 파싱 | 4파일 통과 |
| gitleaks 8.30.1 작업 트리 스캔 | 통과, **0건** |

web에는 test/lint 스크립트가 없고 루트에도 별도 lint 스크립트는 없다.
UI 검사는 루트의 두 Playwright 스크립트가 담당한다. Docker 실행 파일이 없어
실제 컨테이너 빌드·기동은 검증하지 못했다.

## 발견한 실패와 해결

- 기본 Node 20에서 첫 `npm test`가 glob을 찾지 못해 실행 전 실패했다.
  설치된 Node 24로 전환했다.
- 첫 Node 24 테스트는 112개 중 109개 통과, 3개 실패였다.
  웹 토큰을 MCP에 사용하던 계측 테스트를 resource별 토큰으로 고쳤고,
  동일 크기·타임스탬프 변경을 놓치던 원문 캐시를 본문 비교로 수정했다.
- 기본 Playwright Chromium이 없어 첫 UI 실행이 실패했다. 설치된 Chrome
  channel로 다시 실행해 두 UI 스크립트를 통과시켰다.
- Notion UI 테스트에 남아 있던 이전 LLM payload 접근 방식도 현재
  OpenAI-compatible messages 형식으로 수정했다.

## 보안과 회귀 검사

새 보안 테스트 5개는 여러 토큰/scope/endpoint 조합을 반복 검증한다.

- MCP audience의 scope 없음·읽기·위조된 쓰기 scope 조합에서 모든 웹 쓰기 거부.
- legacy scope 없는 MCP와 정상 읽기 scope의 실제 문서 읽기 성공.
- MCP 읽기 allowlist 밖의 메서드·미래 쓰기 도구 거부.
- API audience에서 읽기/쓰기 scope 분리와 POST sections의 읽기 예외.
- 웹 세션 same-origin, bearer와 cookie 혼합 시 권한 차용 거부.
- OAuth resource별 scope 검증과 refresh를 통한 audience/scope 상승 방지.

설정 회귀 테스트 3개는 단일 YAML의 웹 공개 필드 전달과 비공개 필드 제외,
선택적 추적 이슈·대상 브랜치, 업데이트 비활성화 시 신규 제안/기존 제안 발행
거부를 확인한다. 기존 요청자 확인·hash 충돌·PR 재시도·검색·Notion 경계
테스트도 유지했다.

## 비공개 정보 점검

전체 소스·문서·설정·스크립트·테스트를 시크릿 접두어, 인증 변수,
개인 도메인/경로, 조직명, 32자리 hex/UUID 패턴으로 검색했다.
설치 의존성·빌드 출력은 사람이 검토하는 목록에서 제외하고 lockfile은 별도로
이름·경로를 확인했다. 상류 지식베이스와 프로젝트의 긴 원문 문장도 대조했다.

처리한 항목:

- 플러그인 JPG의 이전 브랜드와 내부 문서 제목: 이미지와 manifest 참조 제거.
- Notion 설정 도우미의 고정 root ID: 삭제하고 `--root` 필수 입력으로 변경.
- 이전 실행 로그, 조직 전용 스킬 분류·운영 규칙: 제거 또는 일반 예제로 교체.
- 이전 모델 실험명·관측 숫자가 남은 테스트: 합성 검색 예제로 교체.

최종 패턴 검색의 남은 28개 행은 다음 범주다(이 보고서 작성 전 소스 기준).

| 남은 히트 | 이유 |
| --- | --- |
| LICENSE와 README·양쪽 package.json 소유자 | 사용자가 지정한 공개 저작권·저장소 정보 |
| 인증 코드·환경 예제·테스트 | 프로토콜 필드명, 환경변수명, 명시적 placeholder·가짜 값 |
| 플러그인 패키저 | 시크릿 반입을 차단하는 검출 정규식 자체 |
| 임베딩 설정·문서·테스트 | 공개 모델의 고정 Git revision; Notion ID가 아님 |
| 반복 문자 hex/UUID 테스트 | 합성 Notion page/DB/root 경계 fixture; 실제 페이지가 아님 |
| 벡터 코드·평가 스크립트 UUID | Qdrant manifest용 고정 상수; 외부 식별자가 아님 |

이전 프로젝트명·조직 전용 도메인·개인 경로는 남지 않았다. 선택적 추론
어댑터의 provider 이름은 기능 식별자로 유지했다. 실제 토큰·키·OAuth
식별자·비공개 위키 본문은 검토 범위에서 발견하지 못했다.

`gitleaks dir /workspace/team-llm-wiki --no-banner --redact` 결과는 처음과
마지막 모두 0건이다. `.gitleaks.toml`은 기본 detector를 유지하고
node_modules/dist/.next 경로만 제외한다. 개별 시크릿·테스트·원본 파일을
무시하는 규칙은 없다. 수동 검사에서 찾은 이미지와 페이지 식별자는
시크릿 스캐너가 탐지하지 않는 종류이므로 별도로 제거했다.

## 남은 문제

- `npm audit --json`은 exit 1: 루트 **18건**(moderate 10, high 6,
  critical 2), web **8건**(high 7, critical 1)을 보고한다. 두 그래프가 공유하는
  의존성이 있으므로 합계를 서로 다른 취약점 수로 해석하지 않는다.
  직접 의존성의 자동 수정안은 제공하지 않는다. 배포 전 의존성별 영향과
  교체·업그레이드 호환성 검토가 필요하다.
- 실제 HTTPS/GitHub OAuth·App/Notion/LLM·Qdrant 컨테이너 배포는 자격증명과
  Docker가 없는 환경이라 미검증이다. 자동 검사는 합성 서버·fixture를 사용했다.
- 조직 탈퇴 즉시 토큰 회수, 대화 자동 만료, 완전한 다국어 UI,
  세션 종료·제품 PR 병합 자동 기록 수집기는 제공하지 않는다.
