import type { Metadata } from 'next';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { headingId } from '@/lib/links';
import { BOT_NAME, UPDATE_COMMAND } from '@/lib/branding';

export const metadata: Metadata = {
  title: 'Agent 사용법',
  description: '웹 위키 Agent로 질문하고 문서 변경안을 만드는 방법',
};

const sections = [
  '추론 수준 조절하기',
  '웹에서 질문하고 팀 대화를 이어가기',
];

export default function BotGuidePage() {
  return (
    <DocsPage toc={sections.map((title) => ({ title, url: `#${headingId(title)}`, depth: 2 }))}>
      <DocsTitle>Agent 사용법</DocsTitle>
      <DocsDescription>웹 위키 Agent로 질문하고 문서 변경안을 만드는 방법입니다.</DocsDescription>
      <DocsBody>
        <h2 id={headingId(sections[0])}>{sections[0]}</h2>
        <p>웹 챗봇에서는 질문 입력창 위의 선택 메뉴에서 추론 수준을 선택합니다. 웹 위키 Agent의 기본값은 <code>max</code>이며, 메뉴에서 질문별로 바꿀 수 있습니다.</p>

        <h2 id={headingId(sections[1])}>{sections[1]}</h2>
        <p>팀 GitHub 계정으로 로그인하면 화면 오른쪽 아래의 <strong>위키 Agent</strong>를 열 수 있습니다. 답변의 문서 출처를 열어 근거를 확인하고, <strong>{UPDATE_COMMAND}</strong>로 현재 대화의 내용을 문서 생성·수정·삭제 변경안으로 만들 수 있습니다. 문서 경로와 바꿀 내용, 삭제할 이유를 함께 적어 주세요.</p>
        <p>문서 변경안에서 현재 문서와 변경 후 내용을 펼쳐 확인하세요. 요청한 팀원이 <strong>PR 열기</strong>를 누르면 {BOT_NAME}이 커밋하고 Draft PR을 만듭니다. 팀원이 PR을 검토·병합하면 위키에 반영됩니다. 원본이 바뀌면 {UPDATE_COMMAND}로 변경안을 다시 만드세요. 상단과 문서 메뉴의 <strong>의견 보내기</strong>는 서비스 개선 의견을 기록합니다.</p>
        <ul>
          <li><strong>작은 대화 창</strong>: 위키 Agent를 열면 기본 크기 420×560의 창이 나타납니다. 왼쪽 위 <strong>크기 조절</strong>을 드래그하거나 포커스한 뒤 방향키로 크기를 바꾸세요. Shift를 누르면 더 크게 바뀌고 Home은 기본 크기로 되돌립니다.</li>
          <li><strong>문서와 나란히 보기</strong>: 대화 창에서 이 버튼을 누르면 문서와 대화가 화면을 나눠 씁니다. 가운데 경계를 드래그하거나 포커스한 뒤 방향키로 폭을 조정할 수 있습니다. 작은 화면에서는 안전 영역을 반영한 전체 높이 대화 화면으로 바뀝니다.</li>
          <li><strong>전체 화면</strong>: 대화 도구에서 전체 화면을 열면 <code>/chat</code> 페이지에서 질문과 팀 대화 목록을 함께 볼 수 있습니다. 대화 목록은 제목을 검색하고, 이전 대화를 더 불러올 수 있습니다. 대화를 선택하면 이어서 질문할 수 있습니다.</li>
        </ul>
        <p>대화 기록은 로그인한 팀원이 함께 봅니다. 민감한 정보를 입력하지 마세요. 문서 출처를 열어도 현재 대화와 입력 중인 초안이 유지됩니다. 여러 팀원이 같은 대화를 동시에 갱신하면 최신 기록을 다시 읽은 뒤 질문을 다시 보내도록 안내합니다.</p>
      </DocsBody>
    </DocsPage>
  );
}
