---
title: YouTube transcript
year: 2026
kind: Tool
status: Live
blurb: "Paste a YouTube link, pick from the languages the video offers, and
  get the captions as plain text. Copy it, or download .txt or .srt, with
  or without timestamps."
tech:
  - Astro
  - Vercel function
  - Vanilla JS
cover: /uploads/projects/youtube-transcript.svg
link: /tools/transcript
accent: "#9b8c5a"
---
A small page at `/tools/transcript` backed by one serverless route, `/api/transcript`, which asks YouTube for the video's caption tracks and returns the chosen one as timed lines. Nothing is stored.
