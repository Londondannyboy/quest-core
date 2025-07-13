import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { VoiceProvider } from '@humeai/voice-react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quest Core - Professional Development Platform',
  description: 'Discover your authentic professional identity through Quest, Service, and Pledge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VoiceProvider
          auth={{
            type: 'apiKey',
            value: process.env.NEXT_PUBLIC_HUME_API_KEY || '',
          }}
          configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID || ''}
          hostname="api.hume.ai"
        >
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {children}
          </div>
        </VoiceProvider>
      </body>
    </html>
  )
}