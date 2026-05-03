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

## Dev Build Workflow

This project uses **development builds** (not Expo Go). Native modules are compiled into the app.

1. **Install dev client** on device/simulator (once, or after native changes):
   ```bash
   npm run ios          # simulator
   npm run ios:device   # physical iPhone
   ```
2. **Day-to-day development** — just start Metro:
   ```bash
   npm start
   ```
   The installed dev client app auto-connects. Scan QR codes **from inside the dev client app**, not the phone's Camera app.

3. **Rebuild native** only when installing/removing native modules or changing `app.json` / `Info.plist` / `AndroidManifest.xml`.

### Physical device gotchas

- Phone and computer must be on the **same WiFi** for LAN URL to work
- `InvalidHostID` during install is a known Expo/`devicectl` issue; if it persists, open `ios/soren.xcworkspace` in Xcode, select the device, and press ▶ Run
- EAS cloud builds are configured in `eas.json` but require an Expo account (`eas login`); local builds work without it

## Architecture

Expo Router app (React 19, Expo 54, New Architecture enabled). Entry is `src/app/_layout.tsx` (NOT root `app/`). React Compiler enabled (`app.json` experiments.reactCompiler). Typed routes enabled.

## Styling — CRITICAL

**Do NOT import View, Text, ScrollView etc. from `react-native`.** Import from `@/tw` instead.

This project uses `react-native-css` `useCssElement` wrappers. NativeWind is present but `globalClassNamePolyfill` is disabled — className support is manual, per-component, via `useCssElement`.

Available from `@/tw`: View, Text, ScrollView, SafeAreaView, KeyboardAvoidingView, Pressable, TextInput, TouchableHighlight, Link, AnimatedScrollView.

Available from `@/tw/animated`: Animated.View (Reanimated-interoped View with CSS).
Available from `@/tw/image`: Image (expo-image with objectFit/objectPosition from CSS).

### Metro config quirks

- `inlineVariables: false` — inline variables break `platformColor()` in CSS
- `globalClassNamePolyfill: false` — className wired up manually

### Design tokens

Custom Tailwind v4 tokens in `src/styles/global.css` using CSS custom properties (`--color-bg`, `--color-text`, etc.). iOS uses native `platformColor()`, web/Android use explicit light/dark values. Use `className="text-text bg-bg"` etc.

### React Compiler

Enabled. Use `.get()`/`.set()` on Reanimated shared values, NOT `.value`. Destructure hook results early (e.g. `const { push } = useRouter()`).

## Testing

Vitest with `vitest-native` plugin and `@testing-library/react-native`. Globals enabled (no import needed for `describe`/`it`/`expect`).

Test setup at `src/tests/test-setup.ts` — mocks `react-native-css`, `nativewind`, `expo-router`, and `lucide-react-native`.

Path alias `@/` → `src/` in both `tsconfig.json` and `vitest.config.mts` — they must stay in sync.

Colocate tests: `Component.test.tsx` lives next to `Component.tsx` in the same directory.

## LLM Layer

`src/lib/llm/` — provider pattern (OpenAI-compat, Anthropic) with streaming XHR. Requires `EXPO_PUBLIC_GROQ_API_KEY` in `.env`. Provider interface in `types.ts`.

## Conventions

- Prettier: single quotes, trailing commas, tab width 2, `prettier-plugin-tailwindcss` for class sorting
- Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*`
- Components: `src/components/<name>/<Name>.tsx` (PascalCase directory + file)
- Hooks: `src/hooks/use-<name>.ts` (kebab-case)
- Imports from `@/` not relative paths
