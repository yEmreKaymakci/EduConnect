import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/providers/ToastProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'EduConnect — Stajyer Yönetim Sistemi',
  description: 'Okulların stajyerlerini yönettiği, öğrencilerin yeteneklerini sergilediği ve işletmelerin en uygun stajyeri/yeni mezunu aradığı platform.',
  keywords: 'staj, öğrenci, okul, işletme, yönetim sistemi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#1a1a2e] text-[#e2e8f0] font-sans antialiased" suppressHydrationWarning>
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
