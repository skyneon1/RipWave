import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ripwave — Download YouTube Videos Instantly',
  description: 'The fastest, cleanest YouTube downloader. Download any video in MP4, MP3, or WebM — up to 4K quality. No sign-up required.',
  keywords: ['youtube downloader', 'download youtube', 'mp4 downloader', 'mp3 downloader', 'video downloader'],
  openGraph: {
    title: 'Ripwave — Download YouTube Videos Instantly',
    description: 'The fastest, cleanest YouTube downloader. Download any video in any format.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ripwave',
    description: 'Download YouTube videos in seconds.',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="noise">{children}</body>
    </html>
  )
}
