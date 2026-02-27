#!/bin/bash
set -e

BINDIR="$(pwd)/bin"
mkdir -p "$BINDIR"

# Download yt-dlp if not present
if [ ! -f "$BINDIR/yt-dlp" ]; then
  echo "Downloading yt-dlp..."
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$BINDIR/yt-dlp"
  chmod a+rx "$BINDIR/yt-dlp"
fi

# Download ffmpeg if not present
if [ ! -f "$BINDIR/ffmpeg" ]; then
  echo "Downloading ffmpeg..."
  curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz
  tar -xf /tmp/ffmpeg.tar.xz -C /tmp
  cp /tmp/ffmpeg-*-amd64-static/ffmpeg "$BINDIR/ffmpeg"
  chmod +x "$BINDIR/ffmpeg"
fi

echo "yt-dlp: $($BINDIR/yt-dlp --version)"
echo "Binaries ready at $BINDIR"

npm start