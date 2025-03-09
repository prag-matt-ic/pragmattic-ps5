import './globals.css'

import type { Metadata } from 'next'
import { Noto_Sans } from 'next/font/google'

const sans = Noto_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PS5 Inspired Landing Page with Next.js and React Three Fiber',
  description: '',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} antialiased`}>{children}</body>
    </html>
  )
}
