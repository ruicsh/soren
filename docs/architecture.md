# Architecture

System architecture for Soren mobile app.

## 1) Purpose

Soren is an Expo Router React Native app for text and voice chat with configurable LLM providers per chatbot profile.  
Primary goals:

- Fast chat UX with streaming responses
- Voice conversation loop (dictation -> LLM -> TTS)
- Local-first chatbot profile persistence
- Provider abstraction for OpenAI-compatible and Anthropic APIs (supports OpenAI, Groq, Google Gemini, Hugging Face)

## 2) Tech Stack

- Expo 55, React 19, React Native 0.83
- Expo Router (`src/app/`)
- TypeScript (strict mode)
- Vitest + React Native Testing Library
- Expo modules: SecureStore, FileSystem, Speech, Speech Recognition
- ExecuTorch (on-device text embeddings via `react-native-executorch` + `react-native-executorch-expo-resource-fetcher`)
- sqlite-vec (on-device vector store via `@op-engineering/op-sqlite`)

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
- `ExecutorchProvider` (model download modal + embedding context)
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

## Vector store storage

- Location: app document directory `chatbots/<uuid>/memory.db`
- Virtual table `vec_interactions` using `vec0`
- Stores 384-dim embeddings (`float[384]`) with auxiliary `metadata` JSON pointer column

## 7) LLM Provider Architecture

Provider abstraction in `src/lib/llm/`:

- Catalog defines providers and metadata (`PROVIDERS`)
- Factory creates concrete provider client by provider type
- Current types:
  - OpenAI-compatible streaming protocol (OpenAI, Groq, Google Gemini, Hugging Face)
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

## 9.5) On-Device Embeddings

`use-executorch` manages the ExecuTorch runtime lifecycle:

1. `initExecutorch({ resourceFetcher: ExpoResourceFetcher })` — called once on mount
2. `useTextEmbeddings({ model: ALL_MINILM_L6_V2 })` — downloads ~110MB model (cached after first download)
3. Health check: `forward('health check')` — verifies 384-dim Float32Array output
4. Status machine: `initializing → downloading → ready` (or `error`)

`ExecutorchProvider` wraps the app root and renders a full-screen `ModelDownloadModal` during download.
On error, user can dismiss and continue without embeddings.

`useExecutorchContext()` exposes `{ status, embed, downloadProgress, error }` to any screen.

Debug logging: set `EXPO_PUBLIC_DEBUG_EXECUTORCH=1` for verbose `[ExecuTorch]` logs.

## 9.6) Memory Store Architecture

Per-chatbot vector store for conversational memory with semantic retrieval:

- **Database**: `memory.db` in `chatbots/<uuid>/` directory
- **Schema**: `CREATE VIRTUAL TABLE vec_interactions USING vec0(embedding float[384], +metadata text)`
- **Metadata**: `MemoryPointer` JSON with `{ dateKey: string, timeKey: string }` — no full-text duplication
- **Status machine**: `initializing → ready` (or `error`)

`use-memory-store` hook lifecycle:

1. `openMemoryStore(uuid)` — opens/creates `memory.db` for the chatbot
2. Verifies `sqlite-vec` extension with `SELECT vec_version()`
3. Creates virtual table if not exists
4. Closes previous store when `chatbotUuid` changes

Exposed operations (only when `status === 'ready'`):

- `insertInteraction(dateKey, timeKey, embedding)` — stores a pointer `{ dateKey, timeKey }` and an embedding vector
- `search(embedding, limit?)` — KNN search returning top-N `MemoryQueryResult` items (each has `{ dateKey, timeKey, distance }`)
- `clear()` — deletes all interactions from `vec_interactions`

Retrieval integrated in `use-chat-stream`:

1. On `sendMessage`, embeds user input via ExecuTorch
2. Queries memory store for top 3 relevant interactions
3. Resolves pointers via `resolveMemoryText(uuid, results)` in `chatbot-config.ts` — reads `YYYYMMDD.md` files, caches per-date to avoid redundant I/O, builds `"User: ... \nAssistant: ..."` pairs
4. Injects resolved memories into system prompt via `buildSystemPrompt({ memories })`
5. After stream completes, inserts the new turn into memory store as a fresh `{ dateKey, timeKey }` pointer
6. Falls back gracefully if memory store is not ready or embedding fails

Debug logging: set `EXPO_PUBLIC_DEBUG_SQLITE=1` for verbose `[Memory]` logs.

Cleanup: per-row try/catch in metadata JSON parsing skips corrupted records. `clear()` triggered via "Clear Memory" button in Chatbot Settings screen with destructive confirmation alert.

## 10) UI Architecture

UI composition favors small focused components:

- Chat UI: message bubble, chat input, typing indicators
- Chatbot settings split by concern (identity, intelligence, profile)
- Voice screen separates status display, animation, and call controls
- Shared design tokens from `src/theme.ts` with `StyleSheet.create`

## 10.5) Avatar Architecture

Per-chatbot customizable avatars via `@zamplyy/react-native-nice-avatar` (React Native fork of `react-nice-avatar`) rendered in black and white.

**Shared types and helpers** — `src/components/chatbot-avatar/avatar-bw.ts`:

- `NiceAvatarConfig` type: maps the library's property names (`bgColor`, `hairStyle`, `eyeStyle`, etc.)
- `BW_AVATAR_COLORS` constant: fixed grayscale palette (`#FFFFFF` backgrounds, `#1A1A1A` hair, `#333333` hat, `#D9D9D9` shirt)
- `applyAvatarBW(config)`: merges a config with B/W overrides, disables `isGradient` and `hairColorRandom`

**`ChatbotAvatar` component** — `src/components/chatbot-avatar/ChatbotAvatar.tsx`:

- When `avatarConfig` is non-null: renders `NiceAvatar` with `applyAvatarBW` and `shape="rounded"`
- When `avatarConfig` is null/undefined: falls back to `@lobehub/icons-rn` logo icons (model name match first, then provider name match)
- Ultimate fallback: `Brain` icon from `lucide-react-native`
- Always wrapped in a white rounded container matching the avatar size

**Data persistence**:

- `avatarConfig: null | NiceAvatarConfig` stored in each chatbot's `config.json` as plain JSON
- No separate avatar files on disk

**Selection screen** — `src/app/settings-selection/avatar.tsx`:

- "Default" row at top (resets `avatarConfig` to `null`, hiding selected state with a blue dot)
- 3×3 grid (9 custom avatar options) generated via `genConfig()` from the library
- "Shuffle" button below the grid regenerates all 9 options
- Selecting a grid item calls `saveWithConfig({ avatarConfig: opt })` and pops the route
- `isGradient` explicitly disabled because gradients do not render correctly in the current `@zamplyy` fork

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
- Memory store is per-chatbot, not shared; clearing memory for one chatbot does not affect others
- Memory retrieval is best-effort: if ExecuTorch embedding fails or memory store is not ready, chat proceeds without injected context
