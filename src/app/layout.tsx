import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';

import { LocaleResolver } from '@/infrastructure/i18n/LocaleResolver';

import './globals.css';

// Archivo for the interface: a firm grotesque with more character than the usual neutrals.
// IBM Plex Mono for the data: born for machine reading, and its tabular figures keep the
// column of amounts perfectly aligned.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { translator } = await LocaleResolver.load();
  return {
    title: translator.t('app.title'),
    description: translator.t('app.description'),
  };
}

export const viewport: Viewport = {
  themeColor: '#0c1016',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await LocaleResolver.resolve();

  return (
    <html lang={locale} className={`${archivo.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
