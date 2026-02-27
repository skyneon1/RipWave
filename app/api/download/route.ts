import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
export const maxDuration = 300

const YTDLP = path.join(process.cwd(), 'bin', 'yt-dlp')
const FFMPEG = path.join(process.cwd(), 'bin', 'ffmpeg')

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 100) || 'ripwave_download'
  )
}

function getCookieFlag(): string {
  const cookiesEnv = process.env.YOUTUBE_COOKIES
  if (!cookiesEnv) return ''
  try {
    const cookiePath = path.join(os.tmpdir(), 'yt_cookies.txt')
    fs.writeFileSync(cookiePath, cookiesEnv, 'utf-8')
    return `--cookies "${cookiePath}"`
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  const tmpDir = path.join(os.tmpdir(), `ripwave_${randomUUID()}`)

  try {
    const body = await request.json()
    const { url, formatId, ext } = body

    if (!url || !formatId) {
      return NextResponse.json({ error: 'URL and format are required' }, { status: 400 })
    }

    fs.mkdirSync(tmpDir, { recursive: true })

    const outputTemplate = path.join(tmpDir, '%(title)s.%(ext)s')
    const cookieFlag = getCookieFlag()

    let formatArg = ''
    if (ext === 'mp3' || formatId.includes('bestaudio')) {
      formatArg = `-x --audio-format mp3 --audio-quality 0`
    } else if (formatId === 'bestvideo+bestaudio/best') {
      formatArg = `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best" --merge-output-format mp4`
    } else {
      formatArg = `-f "${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/bestvideo+bestaudio/best" --merge-output-format mp4`
    }

    const command = `${YTDLP} ${formatArg} --ffmpeg-location ${FFMPEG} --no-playlist --no-check-certificates --extractor-retries 3 --socket-timeout 30 ${cookieFlag} -o "${outputTemplate}" "${url.replace(/"/g, '\\"')}"`

    console.log('Running:', command)

    await execAsync(command, { timeout: 240000, maxBuffer: 100 * 1024 * 1024 })

    const files = fs.readdirSync(tmpDir)
    if (files.length === 0) {
      throw new Error('Download failed - no file created')
    }

    const downloadedFile = path.join(tmpDir, files[0])
    const fileBuffer = fs.readFileSync(downloadedFile)
    const safeFilename = sanitizeFilename(path.basename(files[0]))
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4'

    fs.rmSync(tmpDir, { recursive: true, force: true })

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}

    console.error('Download error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: `Download failed: ${message}` },
      { status: 500 }
    )
  }
}