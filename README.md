# TwinMind Meeting Copilot

A real-time meeting copilot built with Next.js and Groq.

Listens to your mic, transcribes speech in chunks, surfaces live suggestions as the conversation evolves, and lets you open any suggestion for a detailed answer in chat.

## Demo

- Live app: https://cpilot.vercel.app/

## Features

- Live mic recording with chunked transcription (every ~30s)
- Transcript auto-updates and auto-scrolls
- Live suggestion batches with manual refresh
- Click-to-expand suggestion details in chat
- Free-form chat with streaming responses
- Full session export (transcript + suggestions + chat + timestamps)
- Prompt and context settings editable in-app

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Zustand for session state
- Groq models:
  - whisper-large-v3 for transcription
  - openai/gpt-oss-120b for suggestions and chat

## How It Works

### 1) Recording and Transcript

- Click start to begin microphone capture.
- Audio is chunked with MediaRecorder stop/start cycles every 30 seconds.
- Each chunk is sent to Groq Whisper and appended to transcript with a timestamp.
- Transcript view auto-scrolls to the newest chunk.

### 2) Live Suggestions

- Suggestions are generated from recent transcript context.
- Manual Refresh triggers transcript flush first (if recording), then suggestion generation.
- New suggestion batches are inserted at the top; older batches remain visible.
- Suggestion types include:
  - question
  - answer
  - fact_check
  - talking_point
  - clarification

### 3) Chat and Suggestion Expansion

- Clicking a suggestion generates a detailed response using larger transcript context.
- The clicked suggestion and expanded answer are added to chat history.
- Users can also ask direct questions in chat.
- Chat responses stream token-by-token for faster perceived response time.

### 4) Export

- Export downloads a JSON file containing:
  - transcript chunks with timestamps
  - all suggestion batches with timestamps
  - full chat history with timestamps

## Prompt Strategy

The app uses separate prompts for live suggestions, suggestion expansion, and chat.

- Live suggestion prompt focuses on:
  - most recent conversation turns
  - tone matching (casual vs professional)
  - short, speakable previews
  - reducing repetition via previous suggestion context
- Suggestion expansion prompt focuses on concise, useful detail tied to transcript context.
- Chat prompt focuses on grounded, direct answers that reference what was said.

All prompts are editable from Settings.

## Settings

Settings are available in-app and include:

- Groq API key
- Live suggestion prompt
- Suggestion expansion prompt
- Chat prompt
- Suggestion context window
- Detail/chat context window

API key behavior:
- Stored in browser localStorage
- Not hardcoded in source
- Sent only when making model requests

## Running Locally

### Prerequisites

- Node.js 20+
- npm
- A Groq API key

### Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:3000, then:

1. Open Settings
2. Paste your Groq API key
3. Save
4. Start recording

## Architecture Notes

- Current UI flow calls Groq directly from the browser using the user-provided API key.
- Next.js API routes exist for transcription, suggestions, and chat, but the main UI path currently uses the client-side Groq helper.

Tradeoff:
- Direct client calls keep the app simple and responsive.
- API key is user-owned but still visible in browser tooling.

## Project Structure

```text
src/
  app/
    page.tsx
    api/
      transcribe/route.ts
      suggestions/route.ts
      chat/route.ts
  components/
    MicPanel.tsx
    SuggestionsPanel.tsx
    SuggestionCard.tsx
    ChatPanel.tsx
    SettingsModal.tsx
  lib/
    useAudioRecorder.ts
    groqClient.ts
    prompts.ts
    exportSession.ts
  store/
    useSessionStore.ts
  types/
    index.ts
```

## What I'd Improve

- **Personality presets** — 5 presets (`Default`, `Professional`, `Friendly`, `Efficient`, `Candid`) that append a compact tone modifier to all three prompts, keeping suggestion, detail, and chat stylistically consistent.
- **Speaker diarization** — attach speaker labels to transcript chunks and condition suggestion generation on speaker turns.
- **Smarter suggestion timing** — trigger refresh only after N new words since the last batch; suppress generation during silence windows to reduce premature or redundant suggestions.
- **Whisper prompt priming** — pass domain vocabulary (names, acronyms, product terms) as a transcription prompt to improve proper noun recognition without adding a cleanup round-trip.
