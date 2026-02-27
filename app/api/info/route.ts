import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
export const maxDuration = 30

const YTDLP = '/opt/render/project/bin/yt-dlp'

function isValidYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const validHosts = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com']
    return validHosts.includes(parsed.hostname)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body
        // DEBUG: check if yt-dlp exists
    try {
      const { stdout: version } = await execAsync(`${YTDLP} --version`)
      console.log('yt-dlp version:', version)
    } catch (e) {
      console.error('yt-dlp not found at', YTDLP, e)
      return NextResponse.json({ error: `yt-dlp not found at ${YTDLP}` }, { status: 500 })
    }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const trimmedUrl = url.trim()

    if (!isValidYouTubeUrl(trimmedUrl)) {
      return NextResponse.json({ error: 'Please enter a valid YouTube URL' }, { status: 400 })
    }

    const command = `${YTDLP} --dump-json --no-playlist "${trimmedUrl.replace(/"/g, '\\"')}" 2>&1`

    const { stdout } = await execAsync(command, {
      timeout: 25000,
    })

    if (!stdout || stdout.trim() === '') {
      throw new Error('No data returned from yt-dlp')
    }

    const lines = stdout.split('\n').filter(line => line.trim().startsWith('{'))
    if (lines.length === 0) {
      throw new Error('Could not parse video information')
    }

    const data = JSON.parse(lines[0])

    const formats: Array<{
      format_id: string
      ext: string
      quality: string
      filesize?: number
      vcodec?: string
      acodec?: string
      height?: number
      abr?: number
      type: 'video' | 'audio'
    }> = []

    const videoQualities = [
      { height: 2160, label: '4K' },
      { height: 1440, label: '1440p' },
      { height: 1080, label: '1080p' },
      { height: 720, label: '720p' },
      { height: 480, label: '480p' },
      { height: 360, label: '360p' },
    ]

    for (const quality of videoQualities) {
      const fmt = data.formats?.find((f: { height: number; vcodec: string; acodec: string; ext: string }) =>
        f.height === quality.height &&
        f.vcodec !== 'none' &&
        f.acodec !== 'none' &&
        f.ext === 'mp4'
      ) || data.formats?.find((f: { height: number; vcodec: string }) =>
        f.height === quality.height && f.vcodec !== 'none'
      )

      if (fmt) {
        formats.push({
          format_id: fmt.format_id,
          ext: 'mp4',
          quality: quality.label,
          filesize: fmt.filesize || fmt.filesize_approx,
          vcodec: fmt.vcodec,
          acodec: fmt.acodec,
          height: fmt.height,
          type: 'video',
        })
      }
    }

    const audioFormats = [
      { abr: 320, label: 'MP3 320kbps' },
      { abr: 192, label: 'MP3 192kbps' },
      { abr: 128, label: 'MP3 128kbps' },
    ]

    for (const af of audioFormats) {
      formats.push({
        format_id: `bestaudio[abr<=${af.abr}]`,
        ext: 'mp3',
        quality: af.label,
        type: 'audio',
        abr: af.abr,
      })
    }

    if (formats.filter(f => f.type === 'video').length === 0) {
      formats.unshift({
        format_id: 'bestvideo+bestaudio/best',
        ext: 'mp4',
        quality: 'Best Quality',
        type: 'video',
      })
    }

    const videoInfo = {
      id: data.id,
      title: data.title,
      thumbnail: data.thumbnail || `https://img.youtube.com/vi/${data.id}/maxresdefault.jpg`,
      duration: data.duration,
      durationString: data.duration_string,
      viewCount: data.view_count,
      likeCount: data.like_count,
      uploadDate: data.upload_date,
      uploader: data.uploader,
      uploaderUrl: data.uploader_url,
      description: data.description?.slice(0, 300),
      formats: formats.slice(0, 9),
      url: trimmedUrl,
    }

    return NextResponse.json(videoInfo)

  } catch (error) {
    console.error('Info error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found') || message.includes('No such file')) {
      return NextResponse.json(
        { error: 'yt-dlp binary not found. Please check the build script.' },
        { status: 500 }
      )
    }

    if (message.includes('Private video') || message.includes('age-restricted')) {
      return NextResponse.json({ error: 'This video is private or age-restricted' }, { status: 403 })
    }

    if (message.includes('Video unavailable')) {
      return NextResponse.json({ error: 'This video is unavailable' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch video info. Make sure the URL is valid and the video is public.' },
      { status: 500 }
    )
  }
}
