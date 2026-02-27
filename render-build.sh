#!/bin/bash
set -e

# Save binaries INSIDE the project so they survive into runtime
mkdir -p ./bin

# Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./bin/yt-dlp
chmod a+rx ./bin/yt-dlp

# Download ffmpeg
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz
tar -xf /tmp/ffmpeg.tar.xz -C /tmp
cp /tmp/ffmpeg-*-amd64-static/ffmpeg ./bin/ffmpeg
chmod +x ./bin/ffmpeg

# Verify
./bin/yt-dlp --version
./bin/ffmpeg -version

npm install
npm run build