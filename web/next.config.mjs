import { fileURLToPath } from 'node:url';

import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// The public build settings are derived from the same team config as the API.
const configPath = process.env.WIKI_CONFIG || fileURLToPath(new URL('../wiki.config.yaml', import.meta.url));
let wiki = {};
try { wiki = parse(readFileSync(configPath, 'utf8')) ?? {}; }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const branding = wiki.branding ?? {};
const publicSettings = {
  NEXT_PUBLIC_ORG_NAME: branding.orgName ?? 'Acme',
  NEXT_PUBLIC_WIKI_TITLE: branding.wikiTitle ?? 'Team Wiki',
  NEXT_PUBLIC_WIKI_DESCRIPTION: branding.description ?? "Search and read your team's documentation.",
  NEXT_PUBLIC_WIKI_LOGO: branding.logo ?? '',
  NEXT_PUBLIC_WIKI_LOCALE: wiki.locale ?? 'en',
  NEXT_PUBLIC_UPDATE_COMMAND: wiki.updates?.command ?? '/update',
  NEXT_PUBLIC_BOT_NAME: branding.botName ?? 'Wiki Bot',
};
for (const key of Object.keys(publicSettings)) publicSettings[key] = process.env[key] ?? publicSettings[key];

const appRoot = fileURLToPath(new URL('.', import.meta.url));
const apiBaseUrl = (process.env.WIKI_API_URL?.trim() || 'http://127.0.0.1:3100').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: publicSettings,
  poweredByHeader: false,
  turbopack: {
    root: appRoot,
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      { source: '/api/:path*', destination: `${apiBaseUrl}/api/:path*` },
      { source: '/auth/:path*', destination: `${apiBaseUrl}/auth/:path*` },
    ];
  },
};

export default nextConfig;
