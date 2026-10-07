import { LayoutShell } from '@/components/LayoutShell'
import { Web3Provider } from '@/lib/web3'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentResume',
  description: 'Your on-chain resume plus an AI agent that writes cover letters and applies to jobs for you.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e13' },
  ],
}

import { Toaster } from 'react-hot-toast'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0b0e13]">
        <Web3Provider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </Web3Provider>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#10141b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
