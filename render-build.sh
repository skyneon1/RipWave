#!/bin/bash
set -e

# Download yt-dlp binary directly
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /opt/render/project/bin/yt-dlp
chmod a+rx /opt/render/project/bin/yt-dlp

# Download ffmpeg static binary
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz
tar -xf /tmp/ffmpeg.tar.xz -C /tmp
cp /tmp/ffmpeg-*-amd64-static/ffmpeg /opt/render/project/bin/ffmpeg
chmod +x /opt/render/project/bin/ffmpeg

# Verify both work
/opt/render/project/bin/yt-dlp --version
/opt/render/project/bin/ffmpeg -version

npm install
npm run build