# Development Runbook

Architecture, workflows, and operations for project maintainers.

## 1. Quick Start

### First Time Setup

```bash
npm install
npm run ios        # Build native iOS dev-client
npm run android    # Build native Android dev-client (optional)
```

### Day-to-Day Flow

1. Start Metro: `npm start`
2. Open **Soren** app on Simulator/Device (Scan QR _inside_ the app, not with Camera).

---

## 2. Architecture & Environment

### Tech Stack

- **Framework**: Expo 55 (React 19 / RN 0.83)
- **Router**: Expo Router (Routes in `src/app/`)
- **LLM**: Custom provider layer in `src/lib/llm/`
- **Compiler**: React Compiler enabled (use `.get()`/`.set()` for Reanimated shared values)

### Debug Environment Flags

Set these in `.env.local` for verbose diagnostics:

- `EXPO_PUBLIC_DEBUG_VOICE=1`: Logs for `use-dictation`, `use-tts`, `use-voice-mode`.
- `EXPO_PUBLIC_DEBUG_XHR_STREAM=1`: Logs for streaming LLM responses.

### Bundler Restrictions

Metro is configured to **block** the following from the mobile bundle:

- `vite`, `vitest`
- Files matching `*.test.*`
- `src/tests/` directory

---

## 3. Operations & Maintenance

### When to Rebuild Native

A full `npm run ios` / `npm run android` is mandatory if:

1. `app.json` or `package.json` (native deps) changes.
2. `ios/` or `android/` directories are deleted/stale.
3. Native config changes (`Info.plist`, `AndroidManifest.xml`).

### Quality Gate (Hard)

Before pushing any change, ensure the full suite passes:

```bash
npm run check
```

### Command Reference

| Command                 | Action                                          |
| :---------------------- | :---------------------------------------------- |
| `npm run ios:clean`     | Wipe build cache and rebuild native iOS         |
| `npm run ios:device`    | Build/install directly to USB-connected device  |
| `npm run lint:fix`      | Auto-fix styling and project conventions        |
| `npm run typecheck`     | Run full `tsc` verification                     |
| `npm run test:coverage` | Run Vitest with V8 coverage report              |
| `npm run web`           | Launch web target (useful for layout debugging) |

---

## 4. Conventions

- **Icons**: Use `@lobehub/icons-rn` for AI logos; `lucide-react-native` for UI.
- **Styling**: `StyleSheet.create` only. Use tokens from `src/theme.ts`.
- **Imports**: Always use `@/` aliases. No relative paths above component level.
- **Hooks**: Logic in `src/hooks/use-name.ts`; props destructure on line 1.
- **Files**: PascalCase for components (`src/components/Name/Name.tsx`), kebab-case for hooks/utils.
