import { WIKI_TITLE, WIKI_LOGO } from '@/lib/branding';

export function WikiBrand() {
  return (
    <span className="wiki-brand" aria-label={WIKI_TITLE}>
      {WIKI_LOGO ? (
        <span className="wiki-wordmark" aria-hidden="true">
          <img src={WIKI_LOGO} alt="" width={1000} height={1000} />
        </span>
      ) : (
        <span className="wiki-brand-label">{WIKI_TITLE}</span>
      )}
    </span>
  );
}
