#!/bin/bash
set -e

BINDIR="$(pwd)/bin"
mkdir -p "$BINDIR"

if [ ! -f "$BINDIR/yt-dlp" ]; then
  echo "Downloading yt-dlp..."
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$BINDIR/yt-dlp"
  chmod a+rx "$BINDIR/yt-dlp"
fi

if [ ! -f "$BINDIR/ffmpeg" ]; then
  echo "Downloading ffmpeg..."
  curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz
  tar -xf /tmp/ffmpeg.tar.xz -C /tmp
  cp /tmp/ffmpeg-*-amd64-static/ffmpeg "$BINDIR/ffmpeg"
  chmod +x "$BINDIR/ffmpeg"
fi

if [ ! -f "$BINDIR/deno" ]; then
  echo "Downloading Deno..."
  curl -L https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip -o /tmp/deno.zip
  unzip -o /tmp/deno.zip -d "$BINDIR"
  chmod +x "$BINDIR/deno"
fi

# Install aria2c for parallel downloading
if [ ! -f "$BINDIR/aria2c" ]; then
  echo "Downloading aria2c..."
  curl -L https://github.com/q3aql/aria2-static-builds/releases/download/v1.36.0/aria2-1.36.0-linux-gnu-64bit-build1.tar.bz2 -o /tmp/aria2.tar.bz2
  tar -xf /tmp/aria2.tar.bz2 -C /tmp
  cp /tmp/aria2-1.36.0-linux-gnu-64bit-build1/aria2c "$BINDIR/aria2c"
  chmod +x "$BINDIR/aria2c"
fi

echo "yt-dlp: $($BINDIR/yt-dlp --version)"
echo "deno: $($BINDIR/deno --version)"
echo "aria2c: $($BINDIR/aria2c --version | head -1)"
echo "All binaries ready."

npm start