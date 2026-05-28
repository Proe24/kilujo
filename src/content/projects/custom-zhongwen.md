---
title: Custom Zhongwen — Chinese reading assistant
year: 2026
kind: Tool
status: Live
blurb: A Chrome extension fork of Zhongwen, the Chinese-English pop-up
  dictionary. Adds AI-powered sentence breakdowns, source-grouped vocab lists, a
  mini spaced-repetition study mode, and one-click export to Anki or Pleco.
tech:
  - Chrome extension
  - JavaScript
  - Claude / Gemini / OpenAI APIs
cover: /uploads/projects/zhongwen.png
link: https://github.com/Proe24/custom-zhongwen
accent: "#7a2a20"
---
Hover over a Chinese character on any webpage to get the dictionary entry, just
like the original Zhongwen. Press S over a sentence and an AI tutor
breaks it down — idiomatic translation, literal gloss, every word with its
pinyin and grammatical role, plus a short set of grammar notes — rendered in a
side panel.

Saved words are tagged with the page they came from, so the vocab list groups
naturally by source (one list per article, story, or video transcript). The
study mode is a session-based mini spaced-repetition system: cards graded
*Good* twice in a row drop out for the session, *Easy* clears them immediately,
*Hard* and *Again* keep them in rotation. Sentences are stored separately with
their full breakdown attached — clicking one in the management view expands the
saved word-by-word analysis.

Exports as either tab-separated Anki flashcards or Pleco-format vocabulary
files. GPL-licensed; source on GitHub.