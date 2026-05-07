# Architecture

System architecture for Soren mobile app.

## 1) Purpose

Soren is an Expo Router React Native app for text and voice chat with configurable LLM providers per chatbot profile.  
Primary goals:

- Fast chat UX with streaming responses
- Voice conversation loop (dictation -> LLM -> TTS)
- Local-first chatbot profile persistence
- Provider abstraction for OpenAI-compatible and Anthropic APIs (supports OpenAI, Groq, Google Gemini)

## 2) Tech Stack

- Expo 55, React 19, React Native 0.83
- Expo Router (`src/app/`)
- TypeScript (strict mode)
- Vitest + React Native Testing Library
- Expo modules: SecureStore, FileSystem, Speech, Speech Recognition

## 3) High-Level System View

Core layers:

1. UI routes and components
2. Feature hooks (chat streaming, voice mode, dictation, TTS)
3. App state context (`ChatbotConfigProvider`)
4. Persistence layer (FileSystem + SecureStore)
5. LLM provider layer (provider catalog + streaming transport)

Root composition:

- `GestureHandlerRootView`
- `SafeAreaProvider`
- `ChatbotConfigProvider`
- Expo `Stack` navigator

## 4) Route Architecture

Routes in `src/app/`:

- `index.tsx`: primary text chat screen
- `voice.tsx`: voice conversation screen
- `chatbot-settings.tsx`: chatbot config editor
- `chatbots.tsx`: chatbot switcher/list
- `settings-selection/*`: focused selectors (provider/model/voice)

Navigation style:

- Stack with hidden headers
- Settings and selector routes pushed from main/chatbot flows
- Chatbot list acts as profile switch entry point

## 5) State Architecture

## Global app state

`ChatbotConfigContext` is source of truth for:

- Active chatbot config
- Full chatbot list
- API key draft and key presence
- Provider model catalog cache state
- Save/loading/error flags
- CRUD operations for chatbots and config

Key pattern:

- UI reads state via `useChatbotConfig()`
- Mutations update local state first, then persist
- Persistence refresh is used to re-sync from file storage

## Local screen state

Screens keep small UI state locally (input draft, scroll refs, temporary flags), while durable chatbot data stays in context.

## 6) Data Persistence

## Chatbot config storage

- Location: app document directory under `chatbots/<uuid>/config.json`
- Includes provider, model, display name, voice, conversation metadata

## Chat transcript storage

- Daily markdown files: `chatbots/<uuid>/chats/YYYYMMDD.md`
- Appends timestamped user/assistant turns
- Loader reads latest available conversation date for startup history

## Secure key storage

- API keys stored in Expo SecureStore
- Current key scope is provider-based key name (`byok_key.<provider>`)
- Legacy chatbot+provider keys auto-migrate on read

## 7) LLM Provider Architecture

Provider abstraction in `src/lib/llm/`:

- Catalog defines providers and metadata (`PROVIDERS`)
- Factory creates concrete provider client by provider type
- Current types:
  - OpenAI-compatible streaming protocol (OpenAI, Groq, Google Gemini)
  - Anthropic streaming protocol

Capabilities per provider adapter:

- Build request payload + headers + URL
- Parse incremental stream chunks into text deltas
- Detect stream completion sentinel
- Optional warmup request

Model discovery:

- `fetchModels(providerId, apiKey)` requests provider model list
- In-memory cache by provider id
- Heuristic filter keeps chat-capable models and drops non-chat endpoints

## 8) Streaming Transport

`xhr-stream.ts` implements low-level stream transport:

- Uses `XMLHttpRequest` for incremental response reading
- Parses SSE-like chunk boundaries (`\n\n`)
- Pushes deltas through async generator queue
- Tracks basic stream metrics (headers time, first token time)
- Supports abort callback and idle timeout protection

`use-chat-stream` builds chat behavior on top:

- Loads recent message history for selected chatbot
- Resolves provider from active chatbot + secure API key
- Appends user message immediately
- Streams assistant response into last assistant message in batches
- Exposes `sendMessage`, `stop`, `messages`, `isStreaming`

## 9) Voice Mode Architecture

`use-voice-mode` orchestrates full duplex-like turn flow using half-duplex guards:

1. Activate dictation
2. On end of speech, stop listening and send text to LLM
3. Stream text chunks into sentence buffer
4. Speak sentence chunks via TTS
5. Re-arm listening only after TTS completion and stream completion

Safety/control mechanisms:

- State machine (`idle`, `connecting`, `listening`, `processing`, `speaking`, `error`)
- Rearm guard to prevent mic re-entry races
- Timeout auto-disconnect when listening stays silent
- Watchdog to recover if state says listening but recorder not active

## 10) UI Architecture

UI composition favors small focused components:

- Chat UI: message bubble, chat input, typing indicators
- Chatbot settings split by concern (identity, intelligence, profile)
- Voice screen separates status display, animation, and call controls
- Shared design tokens from `src/theme.ts` with `StyleSheet.create`

## 11) Quality and Verification

Required local gate:

`npm run check`

Order:

1. lint fix
2. format
3. lint verify
4. typecheck
5. vitest test run

Testing strategy:

- Unit: hooks/libs/helpers
- Component: RNTL interaction + rendering behavior
- E2E smoke/full: Maestro flows

## 12) Operational Constraints

- App runs as Expo dev client workflow (not Expo Go flow)
- `ios/` and `android/` are generated and ignored; rebuild when native deps/config change
- Metro block list excludes test files and test-only tooling from mobile bundle
- React Compiler enabled: Reanimated shared values must use `.get()` / `.set()`

## 13) Known Tradeoffs

- API keys are provider-scoped in SecureStore, so same provider key is shared across chatbots
- Chat transcripts stored in markdown are human-readable but not query-optimized
- Message id generation uses timestamp+random helper, not a globally stable UUID scheme
- Error handling is user-friendly but mostly local (no centralized telemetry pipeline yet)

## 14) Future Architecture Directions

- Add analytics/telemetry layer for stream and voice reliability
- Optional cloud sync for chatbot configs and transcripts
- Structured transcript storage (index + search) while keeping markdown export
- Provider capability matrix (tools, multimodal, reasoning settings)
- Better background/interrupt handling for voice sessions
