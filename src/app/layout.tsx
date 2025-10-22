
import type { Metadata } from 'next'
import { PT_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { SidebarProvider } from '@/components/ui/sidebar'
import { MainNav } from '@/components/main-nav'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'
import { FirebaseClientProvider } from '@/firebase'
import GlobalError from './global-error'


const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Quản lý bán hàng',
  description: 'Quản lý hàng tồn kho, bán hàng và công nợ khách hàng của bạn với thông tin chi tiết do AI hỗ trợ.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          ptSans.variable
        )}
      >
        <FirebaseClientProvider>
          <GlobalError>
            <SidebarProvider>
              <div className="flex min-h-screen">
                <MainNav />
                <div className="flex-1 flex flex-col">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-6">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </GlobalError>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
