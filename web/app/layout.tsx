import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { WikiChatApp } from '@/components/wiki-chat';
import { WikiFeedbackWidget } from '@/components/wiki-feedback-widget';
import { WIKI_TITLE, WIKI_DESCRIPTION, WIKI_LOCALE } from '@/lib/branding';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: WIKI_TITLE,
    template: `%s | ${WIKI_TITLE}`,
  },
  description: WIKI_DESCRIPTION,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={WIKI_LOCALE} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ enabled: false }}>
          <WikiChatApp>{children}</WikiChatApp>
          <WikiFeedbackWidget />
        </RootProvider>
      </body>
    </html>
  );
}
