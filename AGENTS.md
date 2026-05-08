# Soren — Agent Instructions

## Commands

- `npm start` — Expo dev client server (`expo start --dev-client`), not Expo Go flow
- `npm run ios` / `ios:device` / `ios:no-build` / `ios:clean`
- `npm run android` / `android:device` / `android:no-build` / `android:clean`
- `npm run lint` / `npm run lint:fix` — `expo lint`
- `npm run format` — Prettier write
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` / `npm run test:watch` / `npm run test:coverage`
- `npm run web` — Expo web
- `npm run check` — Full verify checks in order

Full verify order:
`npm run lint:fix && npm run format && npm run lint && npm run typecheck && npm run test`

## Runtime + Build Gotchas

- App uses development builds (`expo-dev-client`); scan QR inside dev client app, not phone camera app
- `ios/` and `android/` are generated and gitignored; rebuild native only when native deps/config change (`app.json`, Info.plist, Android manifest)
- Metro blocks `vite`, `vitest`, and `*.test.*` from mobile bundle (`metro.config.js`)
- `react-native-executorch` requires New Architecture (already enabled) and a native rebuild after install; not compatible with Expo Go
- `@op-engineering/op-sqlite` (sqlite-vec) requires a native rebuild after install; not compatible with Expo Go

## Architecture

- Expo Router app on React 19 / Expo 55 / RN 0.83
- Real routes live in `src/app/` (no root `app/` directory here)
- Root layout entry: `src/app/_layout.tsx`
- Main screens: `src/app/index.tsx` (chat), `src/app/voice.tsx`, `src/app/chatbot-settings.tsx`
- LLM/provider layer: `src/lib/llm/` (`openai-compat`, `anthropic`, `xhr-stream`)
- On-device embeddings: `src/hooks/use-executorch.ts` (MiniLM L6 v2 via `react-native-executorch`)
- On-device vector store: `src/lib/vector-store.ts` (sqlite-vec via `@op-engineering/op-sqlite`)

## Env Vars

- `EXPO_PUBLIC_DEBUG_VOICE=1` — optional verbose logs for `use-dictation`, `use-tts`, and `use-voice-mode`
- `EXPO_PUBLIC_DEBUG_XHR_STREAM=1` — optional verbose logs for `src/lib/llm/xhr-stream.ts`
- `EXPO_PUBLIC_DEBUG_EXECUTORCH=1` — optional verbose logs for `use-executorch` (init, model download, health check, ready state)
- `EXPO_PUBLIC_DEBUG_SQLITE=1` — optional verbose logs for `src/lib/vector-store.ts` (init, inserts, KNN search)

## Testing

- Vitest + `vitest-native` + `@testing-library/react-native`
- Globals enabled in Vitest config (no imports needed for `describe`/`it`/`expect`)
- Shared test setup: `src/tests/test-setup.ts` (mocks expo-router, reanimated, expo modules, speech modules, XHR)
- Run one file: `npx vitest run src/path/to/file.test.ts`
- Keep alias mapping in sync between `tsconfig.json` and `vitest.config.mts` (`@/*`, `@/assets/*`)
- Use `renderComponentName({ overrides })` helper pattern with `DEFAULT_PROPS` in tests (import component props type directly)
- Use `renderHookName({ overrides })` helper pattern with `DEFAULT_OPTIONS` (or `DEFAULT_PROPS`) for hook tests. Return `{ ...renderHookResult, options }` where `options` is the merged result of `DEFAULT_OPTIONS` and `overrides`.
- Organize tests using Arrange/Act/Assert (AAA) structure with empty lines between sections, but omit the `// Arrange/Act/Assert` comments.
- Always use `screen.*` for assertions; do not return/destructure queries from `render`.

## Conventions That Break Easily

- React Compiler enabled: use Reanimated shared values with `.get()` / `.set()` (not `.value`)
- Styling via `StyleSheet.create`; design tokens in `src/theme.ts`
- Import from `@/` aliases, avoid deep relative imports
- Component files: `src/components/<name>/<Name>.tsx`
- Hook files: `src/hooks/use-<name>.ts`
- Props/parameters: destructure on first line of function body, not in signature
- Formatting: always leave empty line before `return` (enforced by ESLint rule)
- Prettier: rules defined in `.prettierrc` (single quotes, trailing commas, 2-space tabs)
- Dependencies pinned exactly (`.npmrc` has `save-exact=true`)

## Communication Mode

- Respond in caveman mode (full) by default
- Format: `[thing] [action] [reason]. [next step].`
- Switch: `/caveman lite|full|ultra`; say `stop caveman` or `normal mode` to revert
- Temporarily drop caveman when clarity/safety needed (security warnings, irreversible actions, complex ordered steps)
