import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
export const maxDuration = 300

const YTDLP = path.join(process.cwd(), 'bin', 'yt-dlp')
const FFMPEG = path.join(process.cwd(), 'bin', 'ffmpeg')
const ARIA2C = path.join(process.cwd(), 'bin', 'aria2c')

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
    const proxyFlag = process.env.PROXY_URL ? `--proxy "${process.env.PROXY_URL}"` : ''

    // Use aria2c if available for parallel downloading (much faster)
    const aria2cExists = fs.existsSync(ARIA2C)
    const aria2cFlag = aria2cExists
      ? `--downloader aria2c --downloader-args "aria2c:-x 16 -s 16 -k 1M"`
      : ''

    let formatArg = ''
    if (ext === 'mp3' || formatId.includes('bestaudio')) {
      formatArg = `-x --audio-format mp3 --audio-quality 0`
    } else if (formatId === 'bestvideo+bestaudio/best') {
      formatArg = `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --merge-output-format mp4`
    } else {
      formatArg = `-f "${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best" --merge-output-format mp4`
    }

    const command = `${YTDLP} ${formatArg} --ffmpeg-location ${FFMPEG} --no-playlist --no-check-certificates --no-warnings --extractor-args "youtube:player_client=web,android" --socket-timeout 30 --no-call-home --concurrent-fragments 8 ${aria2cFlag} ${proxyFlag} -o "${outputTemplate}" "${url.replace(/"/g, '\\"')}"`

    console.log('Running download...')
    console.log('aria2c:', aria2cExists ? 'YES' : 'NO')

    await execAsync(command, { timeout: 240000, maxBuffer: 200 * 1024 * 1024 })

    const files = fs.readdirSync(tmpDir)
    if (files.length === 0) {
      throw new Error('Download failed - no file created')
    }

    const downloadedFile = path.join(tmpDir, files[0])
    const stat = fs.statSync(downloadedFile)
    const safeFilename = sanitizeFilename(path.basename(files[0]))
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4'

    // Stream file directly instead of loading into memory
    const fileStream = fs.createReadStream(downloadedFile)

    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk))
        fileStream.on('end', () => {
          controller.close()
          // Cleanup after streaming
          try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
        })
        fileStream.on('error', (err) => {
          controller.error(err)
          try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
        })
      },
      cancel() {
        fileStream.destroy()
        try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
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