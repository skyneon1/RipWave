'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  Download, Search, Zap, Shield, Clock, Globe,
  Music, Video, ChevronDown, AlertCircle, CheckCircle,
  Loader2, X, Play, Eye, ThumbsUp, User, ExternalLink,
  Sparkles, Waves
} from 'lucide-react'
import { ThemeToggle } from './components/ThemeToggle'

// ─── Types ────────────────────────────────────────────────────────────────────
interface VideoFormat {
  format_id: string
  ext: string
  quality: string
  filesize?: number
  height?: number
  abr?: number
  type: 'video' | 'audio'
}

interface VideoInfo {
  id: string
  title: string
  thumbnail: string
  duration: number
  durationString: string
  viewCount: number
  likeCount: number
  uploadDate: string
  uploader: string
  uploaderUrl: string
  description: string
  formats: VideoFormat[]
  url: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function formatBytes(bytes?: number): string {
  if (!bytes) return ''
  if (bytes >= 1_000_000_000) return (bytes / 1_000_000_000).toFixed(1) + ' GB'
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' MB'
  return (bytes / 1_000).toFixed(0) + ' KB'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const y = dateStr.slice(0, 4)
  const m = dateStr.slice(4, 6)
  const d = dateStr.slice(6, 8)
  return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

// ─── Components ───────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-rip-border/50 backdrop-blur-md bg-rip-bg/80">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rip-accent to-rip-accent-2 flex items-center justify-center">
          <Waves size={14} className="text-white" />
        </div>
        <span className="font-display text-xl tracking-widest text-rip-text">RIPWAVE</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm text-rip-subtext">
        <a href="#features" className="hover:text-rip-text transition-colors">Features</a>
        <a href="#how" className="hover:text-rip-text transition-colors">How it works</a>
        <a href="#faq" className="hover:text-rip-text transition-colors">FAQ</a>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2 text-xs font-mono text-rip-subtext border border-rip-border rounded-full px-3 py-1 bg-rip-surface/40">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Online
        </div>
      </div>
    </nav>
  )
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-60" />
      {/* Radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-rip-accent/5 blur-[120px]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-rip-accent-2/5 blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-rip-accent/5 blur-[80px]" />
      {/* Decorative lines */}
      <div className="absolute top-32 left-8 w-px h-24 bg-gradient-to-b from-transparent via-rip-accent/30 to-transparent" />
      <div className="absolute top-48 right-12 w-px h-16 bg-gradient-to-b from-transparent via-rip-accent-2/20 to-transparent" />
    </div>
  )
}

type DownloadState = 'idle' | 'fetching' | 'ready' | 'downloading' | 'done' | 'error'

export default function Home() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<DownloadState>('idle')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null)
  const [error, setError] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state === 'downloading') {
      // Simulate progress since we can't get real progress from the API route easily
      setDownloadProgress(0)
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 8
        })
      }, 400)
      return () => clearInterval(interval)
    }
  }, [state])

  const handleFetchInfo = async () => {
    const trimmed = url.trim()
    if (!trimmed) return

    setState('fetching')
    setError('')
    setVideoInfo(null)
    setSelectedFormat(null)

    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch video info')
      }

      setVideoInfo(data)
      // Auto-select first video format
      const firstVideo = data.formats.find((f: VideoFormat) => f.type === 'video')
      if (firstVideo) setSelectedFormat(firstVideo)
      setState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  const handleDownload = async () => {
    if (!selectedFormat || !videoInfo) return

    setState('downloading')
    setDownloadProgress(0)

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoInfo.url,
          formatId: selectedFormat.format_id,
          ext: selectedFormat.ext,
          quality: selectedFormat.quality,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Download failed')
      }

      // Get filename from Content-Disposition
      const disposition = res.headers.get('Content-Disposition') || ''
      const nameMatch = disposition.match(/filename="(.+)"/)
      const filename = nameMatch?.[1] || `ripwave_${videoInfo.id}.${selectedFormat.ext}`

      // Stream to blob and trigger download
      const blob = await res.blob()
      setDownloadProgress(100)

      const dlUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = dlUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(dlUrl)

      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('idle')
    setUrl('')
    setVideoInfo(null)
    setSelectedFormat(null)
    setError('')
    setDownloadProgress(0)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const videoFormats = videoInfo?.formats.filter(f => f.type === 'video') || []
  const audioFormats = videoInfo?.formats.filter(f => f.type === 'audio') || []

  return (
    <main className="min-h-screen bg-rip-bg text-rip-text">
      <Navbar />

      {/* ── Hero / Input Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <HeroBackground />

        <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rip-accent/30 bg-rip-accent/10 text-rip-accent-2 text-xs font-mono tracking-widest">
            <Sparkles size={10} />
            FAST · FREE · NO SIGNUP
            <Sparkles size={10} />
          </div>

          {/* Headline */}
          <div className="animate-fade-in-up delay-100 space-y-2">
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl tracking-widest leading-none">
              <span className="text-rip-text">RIP</span>
              <span className="gradient-text">WAVE</span>
            </h1>
            <p className="text-rip-subtext text-base md:text-lg font-light max-w-lg mx-auto leading-relaxed">
              Download any YouTube video in seconds — MP4, MP3, up to 4K.
              Clean, fast, no BS.
            </p>
          </div>

          {/* Main Input */}
          <div className="animate-fade-in-up delay-200 w-full">
            {state === 'idle' || state === 'error' ? (
              <div className="space-y-3">
                <div className="flex gap-2 p-2 rounded-2xl border border-rip-border bg-rip-surface/60 backdrop-blur-sm focus-within:border-rip-accent/50 focus-within:shadow-[0_0_30px_rgba(255,77,28,0.1)] transition-all duration-300">
                  <div className="flex-1 flex items-center gap-3 px-3">
                    <Search size={16} className="text-rip-subtext flex-shrink-0" />
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFetchInfo()}
                      placeholder="Paste YouTube URL here..."
                      className="flex-1 bg-transparent text-rip-text placeholder:text-rip-muted text-sm outline-none font-body py-2"
                      autoFocus
                    />
                    {url && (
                      <button onClick={() => setUrl('')} className="text-rip-muted hover:text-rip-text transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleFetchInfo}
                    disabled={!url.trim()}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rip-accent to-rip-accent-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,77,28,0.4)] active:scale-95"
                  >
                    <Zap size={14} />
                    <span className="hidden sm:inline">Analyze</span>
                  </button>
                </div>

                {state === 'error' && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-left animate-scale-in">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Something went wrong</p>
                      <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                    </div>
                    <button onClick={() => setState('idle')} className="ml-auto flex-shrink-0 text-red-400/50 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : state === 'fetching' ? (
              <div className="p-8 rounded-2xl border border-rip-border bg-rip-surface/40 animate-scale-in">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-rip-accent/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-rip-accent animate-spin" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-rip-text font-medium">Analyzing video...</p>
                    <p className="text-rip-subtext text-xs">Fetching metadata and available formats</p>
                  </div>
                  {/* Shimmer bars */}
                  <div className="w-full space-y-2 mt-2">
                    {[100, 70, 85].map((w, i) => (
                      <div key={i} className={`h-3 rounded-full shimmer`} style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Stats */}
          {(state === 'idle' || state === 'error') && (
            <div className="animate-fade-in-up delay-300 flex items-center justify-center gap-8 text-xs text-rip-subtext">
              {[
                { icon: Zap, label: 'Lightning fast' },
                { icon: Shield, label: 'No account needed' },
                { icon: Globe, label: 'All formats' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-rip-accent" />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Video Info & Download Panel ── */}
      {(state === 'ready' || state === 'downloading' || state === 'done') && videoInfo && (
        <section className="relative px-4 pb-24 -mt-32">
          <div className="max-w-3xl mx-auto animate-scale-in">
            <div className="rounded-2xl border border-rip-border bg-rip-surface/80 backdrop-blur-sm overflow-hidden shadow-2xl">

              {/* Video preview header */}
              <div className="relative flex gap-4 p-5 border-b border-rip-border">
                {/* Thumbnail */}
                <div className="relative w-36 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-rip-muted/20">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-8 h-8 rounded-full bg-rip-accent/80 flex items-center justify-center">
                      <Play size={12} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {videoInfo.durationString && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
                      {videoInfo.durationString}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-rip-text font-semibold text-sm leading-tight line-clamp-2 mb-2">
                    {videoInfo.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-rip-subtext">
                    {videoInfo.uploader && (
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {videoInfo.uploader}
                      </span>
                    )}
                    {videoInfo.viewCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye size={10} />
                        {formatNumber(videoInfo.viewCount)} views
                      </span>
                    )}
                    {videoInfo.likeCount > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={10} />
                        {formatNumber(videoInfo.likeCount)}
                      </span>
                    )}
                    {videoInfo.uploadDate && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(videoInfo.uploadDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close */}
                <button onClick={handleReset} className="flex-shrink-0 p-1.5 rounded-lg text-rip-muted hover:text-rip-text hover:bg-rip-border transition-all">
                  <X size={14} />
                </button>
              </div>

              {/* Format selector */}
              <div className="p-5 space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-rip-bg border border-rip-border">
                  {[
                    { id: 'video' as const, icon: Video, label: 'Video (MP4)' },
                    { id: 'audio' as const, icon: Music, label: 'Audio (MP3)' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveTab(id)
                        const formats = id === 'video' ? videoFormats : audioFormats
                        if (formats.length > 0) setSelectedFormat(formats[0])
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === id
                        ? 'bg-rip-surface text-rip-accent border border-rip-accent/30 shadow-sm'
                        : 'text-rip-subtext hover:text-rip-text'
                        }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Format grid */}
                <div className="grid grid-cols-3 gap-2">
                  {(activeTab === 'video' ? videoFormats : audioFormats).map(fmt => (
                    <button
                      key={fmt.format_id}
                      onClick={() => setSelectedFormat(fmt)}
                      className={`format-badge flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${selectedFormat?.format_id === fmt.format_id
                        ? 'selected'
                        : 'border-rip-border text-rip-subtext hover:border-rip-muted hover:text-rip-text'
                        }`}
                    >
                      <span className="text-sm font-semibold">{fmt.quality}</span>
                      {fmt.filesize && (
                        <span className="text-xs opacity-60">{formatBytes(fmt.filesize)}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Download button */}
                {state === 'ready' && (
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-rip-accent to-rip-accent-2 text-white font-semibold text-base hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_40px_rgba(255,77,28,0.4)] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed glow-accent"
                  >
                    <Download size={18} />
                    Download {selectedFormat?.quality} {selectedFormat?.ext?.toUpperCase()}
                  </button>
                )}

                {/* Progress */}
                {state === 'downloading' && (
                  <div className="space-y-3 animate-scale-in">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-rip-text font-medium">
                        <Loader2 size={14} className="animate-spin text-rip-accent" />
                        Downloading...
                      </span>
                      <span className="font-mono text-rip-accent">{Math.round(downloadProgress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-rip-border overflow-hidden">
                      <div
                        className="h-full progress-bar rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-rip-subtext text-center">
                      Preparing your {selectedFormat?.quality} {selectedFormat?.ext?.toUpperCase()} file...
                    </p>
                  </div>
                )}

                {/* Done */}
                {state === 'done' && (
                  <div className="space-y-3 animate-scale-in">
                    <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
                      <CheckCircle size={18} className="text-green-400" />
                      <span className="text-green-400 font-medium">Download complete!</span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="w-full py-3 rounded-xl border border-rip-border text-rip-subtext hover:text-rip-text hover:border-rip-muted transition-all text-sm"
                    >
                      Download another video
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono tracking-widest text-rip-accent mb-3">WHY RIPWAVE</p>
            <h2 className="font-display text-4xl md:text-6xl tracking-widest text-rip-text">
              BUILT DIFFERENT
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: 'Instant Analysis',
                desc: 'Paste a URL and get full video metadata, available formats, and file sizes in under 3 seconds.',
              },
              {
                icon: Globe,
                title: 'Every Format',
                desc: 'MP4 up to 4K, 1080p, 720p, and MP3 in 320kbps, 192kbps, 128kbps. Pick what you need.',
              },
              {
                icon: Shield,
                title: 'No Account Needed',
                desc: 'No sign-ups, no tracking, no BS. Just paste the URL and download. That\'s it.',
              },
              {
                icon: Clock,
                title: 'Always Fast',
                desc: 'Powered by yt-dlp — the fastest and most up-to-date YouTube extraction engine available.',
              },
              {
                icon: Music,
                title: 'Extract Audio',
                desc: 'Rip any video to high-quality MP3. Perfect for podcasts, music, and lectures.',
              },
              {
                icon: Download,
                title: 'Direct Download',
                desc: 'No ads, no redirects, no download managers. Click and your file is on your device.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-rip-border bg-rip-surface/40 hover:border-rip-accent/30 hover:bg-rip-surface/60 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-rip-accent/10 border border-rip-accent/20 flex items-center justify-center mb-4 group-hover:bg-rip-accent/15 transition-colors">
                  <Icon size={18} className="text-rip-accent" />
                </div>
                <h3 className="font-semibold text-rip-text mb-2">{title}</h3>
                <p className="text-rip-subtext text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-4 border-t border-rip-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono tracking-widest text-rip-accent mb-3">SIMPLE PROCESS</p>
            <h2 className="font-display text-4xl md:text-6xl tracking-widest text-rip-text">
              HOW IT WORKS
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-rip-accent/50 via-rip-accent/20 to-transparent hidden md:block" />

            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Copy the URL',
                  desc: 'Go to YouTube, find your video, and copy the URL from the address bar.',
                },
                {
                  step: '02',
                  title: 'Paste & Analyze',
                  desc: 'Paste the URL into Ripwave and click Analyze. We\'ll fetch all available formats instantly.',
                },
                {
                  step: '03',
                  title: 'Pick your format',
                  desc: 'Choose between video qualities (up to 4K) or audio-only MP3 at your preferred bitrate.',
                },
                {
                  step: '04',
                  title: 'Download',
                  desc: 'Hit the download button and your file will be saved directly to your device.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-6 items-start group">
                  <div className="w-16 h-16 flex-shrink-0 rounded-2xl border border-rip-border bg-rip-surface flex items-center justify-center group-hover:border-rip-accent/40 transition-colors relative z-10">
                    <span className="font-display text-xl text-rip-accent tracking-widest">{step}</span>
                  </div>
                  <div className="flex-1 pt-3">
                    <h3 className="font-semibold text-rip-text mb-1">{title}</h3>
                    <p className="text-rip-subtext text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 border-t border-rip-border/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono tracking-widest text-rip-accent mb-3">QUESTIONS</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-widest text-rip-text">FAQ</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'Is this free?',
                a: 'Yes, completely free. No subscriptions, no hidden fees, no sign-ups.',
              },
              {
                q: 'What formats can I download?',
                a: 'MP4 video in resolutions from 360p up to 4K, and MP3 audio in 128kbps, 192kbps, and 320kbps.',
              },
              {
                q: 'Is there a file size limit?',
                a: 'No file size limit. You can download full-length movies and long lectures without restrictions.',
              },
              {
                q: 'Why can\'t I download a certain video?',
                a: 'Some videos are region-restricted, private, or age-restricted and cannot be downloaded. Live streams are also not supported.',
              },
              {
                q: 'Is it legal to download YouTube videos?',
                a: 'Downloading YouTube videos may violate YouTube\'s Terms of Service and copyright law depending on your country and the content. Only download videos you have permission to download.',
              },
            ].map(({ q, a }) => (
              <FAQItem key={q} question={q} answer={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 border-t border-rip-border/50">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-display text-5xl md:text-7xl tracking-widest">
            <span className="text-rip-text">READY TO </span>
            <span className="gradient-text">RIP?</span>
          </h2>
          <p className="text-rip-subtext">No account. No waiting. Just results.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-rip-accent to-rip-accent-2 text-white font-semibold text-base hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_40px_rgba(255,77,28,0.4)] glow-accent"
          >
            <Download size={18} />
            Start Downloading
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-rip-border/50 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-rip-accent to-rip-accent-2 flex items-center justify-center">
              <Waves size={10} className="text-white" />
            </div>
            <span className="font-display text-base tracking-widest text-rip-subtext">RIPWAVE</span>
          </div>
          <p className="text-xs text-rip-muted text-center">
            For personal use only. Respect copyright. Not affiliated with YouTube or Google.
          </p>
          <p className="text-xs text-rip-muted font-mono">© {new Date().getFullYear()} Ripwave</p>
        </div>
      </footer>
    </main>
  )
}

// ─── FAQ accordion item ────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-rip-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-rip-surface/40 transition-colors"
      >
        <span className="text-rip-text text-sm font-medium">{question}</span>
        <ChevronDown
          size={16}
          className={`text-rip-subtext flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-rip-subtext text-sm leading-relaxed border-t border-rip-border/50 pt-4 animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  )
}
