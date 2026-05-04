# Soren — Agent Instructions

## Commands

- `npm start` — Start Metro for dev client (`expo start --dev-client`)
- `npm run ios` — Build & run on iOS simulator
- `npm run ios:device` — Build & run on physical iPhone (USB)
- `npm run ios:no-build` — Relaunch iOS app without native rebuild
- `npm run ios:clean` — Clean rebuild iOS
- `npm run android` / `android:device` / `android:no-build` / `android:clean` — Same for Android
- `npm run lint` — ESLint via `expo lint`
- `npm run test` — Vitest single run
- `npm run test:watch` — Vitest watch mode
- `npm run test:coverage` — Vitest with coverage
- `npm run format` — Prettier (single quotes, trailing commas)
- `npm run typecheck` — `tsc --noEmit`
- `npm run web` — Web via Metro

Verify with: `npm run format && npm run lint && npm run typecheck && npm run test`

## Dev builds (not Expo Go)

This project uses **development builds** — native modules are compiled into the app. `ios/` and `android/` are gitignored generated directories (rebuild via `npm run ios`/`npm run android`). QR codes must be scanned **from inside the dev client app**, not the Camera app. Rebuild native only when installing/removing native modules or changing `app.json` / `Info.plist` / `AndroidManifest.xml`.

## Architecture

Expo Router app (React 19, Expo 54, New Architecture). Entry is `src/app/_layout.tsx` (**NOT** root `app/` — that directory does not exist, routes go in `src/app/`). React Compiler enabled, typed routes enabled.

## Styling

Standard React Native `StyleSheet.create`. Design tokens live in `src/theme.ts`:

- `colors` — `PlatformColor()` on iOS (auto dark mode), hex fallbacks on Android/web
- `spacing` — 4pt grid (`spacing[4] === 16`)
- `radius` — corner radius tokens
- `typography` — font size tokens

Import primitives from `react-native` directly. No custom wrappers.

### React Compiler

Enabled. Use `.get()`/`.set()` on Reanimated shared values, NOT `.value`. Destructure hook results early (e.g. `const { push } = useRouter()`).

## Testing

Vitest with `vitest-native` plugin and `@testing-library/react-native`. Globals enabled (no import needed for `describe`/`it`/`expect`).

Test setup at `src/tests/test-setup.ts` — mocks `expo-router`, `react-native-reanimated`, and `lucide-react-native`.

Path alias `@/` → `src/` in both `tsconfig.json` and `vitest.config.mts` — they must stay in sync.

Colocate tests: `Component.test.tsx` lives next to `Component.tsx` in the same directory.

Run a single test file: `npx vitest run src/path/to/test.ts`

## LLM Layer

`src/lib/llm/` — provider pattern (OpenAI-compat, Anthropic) with streaming XHR. Requires `EXPO_PUBLIC_GROQ_API_KEY` in `.env` (only required env var). Provider interface in `types.ts`.

## Conventions

- Prettier: single quotes, trailing commas, tab width 2
- `.npmrc`: `save-exact=true` — dependency versions are pinned exactly
- Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*`
- Components: `src/components/<name>/<Name>.tsx` (PascalCase directory + file)
- Hooks: `src/hooks/use-<name>.ts` (kebab-case)
- Imports from `@/` not relative paths

## Communication

Always respond in **caveman mode** (full intensity). Drop articles, filler, pleasantries, hedging. Fragments OK. Technical substance exact. Code blocks unchanged. Errors quoted exact.

Pattern: `[thing] [action] [reason]. [next step].`

Not: "Sure! I'd be happy to help you with that. The issue you're experiencing is likely caused by..."
Yes: "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:"

Switch levels: `/caveman lite|full|ultra`. Say "stop caveman" or "normal mode" to revert. Level persist until changed or session end.

Auto-clarity: drop caveman for security warnings, irreversible action confirmations, multi-step sequences where fragment order risks misread, user confused. Resume caveman after clear part done.
