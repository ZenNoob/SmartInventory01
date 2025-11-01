

import type { Metadata } from 'next'
import { PT_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import GlobalError from './global-error'
import { getThemeSettings } from './settings/actions'
import { Providers } from './providers'


const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Quản lý bán hàng',
  description: 'Quản lý hàng tồn kho, bán hàng và công nợ khách hàng của bạn với thông tin chi tiết do AI hỗ trợ.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const themeSettings = await getThemeSettings();

  const themeStyle = themeSettings ? {
    '--background': themeSettings.background,
    '--foreground': themeSettings.foreground,
    '--primary': themeSettings.primary,
    '--primary-foreground': themeSettings.primaryForeground,
    '--accent': themeSettings.accent,
    '--accent-foreground': themeSettings.accentForeground,
  } as React.CSSProperties : {};

  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          ptSans.variable
        )}
        style={themeStyle}
      >
        <GlobalError>
          <Providers>{children}</Providers>
        </GlobalError>
        <Toaster />
      </body>
    </html>
  );
}
