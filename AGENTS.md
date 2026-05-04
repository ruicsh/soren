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
- `npm run format` — Prettier (single quotes, trailing commas, tailwind class sorting)
- `npm run typecheck` — `tsc --noEmit`
- `npm run web` — Web via Metro

Verify with: `npm run format && npm run lint && npm run typecheck && npm run test`

## Dev builds (not Expo Go)

This project uses **development builds** — native modules are compiled into the app. `ios/` and `android/` are gitignored generated directories (rebuild via `npm run ios`/`npm run android`). QR codes must be scanned **from inside the dev client app**, not the Camera app. Rebuild native only when installing/removing native modules or changing `app.json` / `Info.plist` / `AndroidManifest.xml`.

## Architecture

Expo Router app (React 19, Expo 54, New Architecture). Entry is `src/app/_layout.tsx` (**NOT** root `app/` — that directory does not exist, routes go in `src/app/`). React Compiler enabled, typed routes enabled.

## Styling — CRITICAL

**Do NOT import View, Text, ScrollView etc. from `react-native`.** Import from `@/tw` instead.

This project uses `react-native-css` `useCssElement` wrappers. NativeWind is present but `globalClassNamePolyfill: false` — className support is manual, per-component, via `useCssElement`.

Available from `@/tw`: View, Text, ScrollView, SafeAreaView, KeyboardAvoidingView, Pressable, TextInput, TouchableHighlight, Link, AnimatedScrollView.

Available from `@/tw/animated`: Animated.View (Reanimated-interoped View with CSS).
Available from `@/tw`: `useCSSVariable` hook (uses `useNativeVariable` on native, `var()` on web).

ScrollView supports `contentContainerClassName` prop (maps to `contentContainerStyle`). `AnimatedScrollView` also accepts `contentClassName` (same mapping).

### Metro config quirks

- `inlineVariables: false` — inline variables break `platformColor()` in CSS
- `globalClassNamePolyfill: false` — className wired up manually

### Design tokens

Tailwind v4 tokens in `src/styles/global.css`. Raw CSS vars use `--sf-*` prefix (iOS `platformColor()`, web/Android explicit light/dark), registered via `@theme { --color-* }`. Font families (`--font-*`) are platform-specific. Use `className="text-text bg-bg"` etc.

### React Compiler

Enabled. Use `.get()`/`.set()` on Reanimated shared values, NOT `.value`. Destructure hook results early (e.g. `const { push } = useRouter()`).

## Testing

Vitest with `vitest-native` plugin and `@testing-library/react-native`. Globals enabled (no import needed for `describe`/`it`/`expect`).

Test setup at `src/tests/test-setup.ts` — mocks `react-native-css`, `nativewind`, `expo-router`, `react-native-reanimated`, and `lucide-react-native`.

Path alias `@/` → `src/` in both `tsconfig.json` and `vitest.config.mts` — they must stay in sync.

Colocate tests: `Component.test.tsx` lives next to `Component.tsx` in the same directory.

Run a single test file: `npx vitest run src/path/to/test.ts`

## LLM Layer

`src/lib/llm/` — provider pattern (OpenAI-compat, Anthropic) with streaming XHR. Requires `EXPO_PUBLIC_GROQ_API_KEY` in `.env` (only required env var). Provider interface in `types.ts`.

## Conventions

- Prettier: single quotes, trailing commas, tab width 2, `prettier-plugin-tailwindcss` for class sorting
- `.npmrc`: `save-exact=true` — dependency versions are pinned exactly
- `lightningcss` overridden to `1.30.1` in `package.json` `overrides`
- Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*`
- Components: `src/components/<name>/<Name>.tsx` (PascalCase directory + file)
- Hooks: `src/hooks/use-<name>.ts` (kebab-case)
- Imports from `@/` not relative paths
