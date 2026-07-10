import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';

import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { cn } from '@/lib/utils';

import { AppProvider } from './provider';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const fontMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DeviceHub',
  description: 'Device inventory and lifecycle management',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn(fontMono.variable, 'font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-svh antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProvider>{children}</AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
