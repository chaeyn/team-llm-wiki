// Public constants derived from wiki.config.yaml by next.config.mjs at build time.
export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME ?? 'Acme';
export const WIKI_TITLE = process.env.NEXT_PUBLIC_WIKI_TITLE ?? 'Team Wiki';
export const WIKI_DESCRIPTION =
  process.env.NEXT_PUBLIC_WIKI_DESCRIPTION ?? "Search and read your team's documentation.";
export const WIKI_LOGO = process.env.NEXT_PUBLIC_WIKI_LOGO ?? '';
export const WIKI_LOCALE = process.env.NEXT_PUBLIC_WIKI_LOCALE ?? 'en';
export const UPDATE_COMMAND = process.env.NEXT_PUBLIC_UPDATE_COMMAND ?? '/update';
export const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME ?? 'Wiki Bot';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches a message that starts with the configured update command. */
export function updateCommandRegex(): RegExp {
  return new RegExp('^' + escapeRegExp(UPDATE_COMMAND) + '(?:\\s|$)', 'u');
}
