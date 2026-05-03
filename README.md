# Soren

Expo Router app with custom native modules.

## Development

### Prerequisites

- Node.js + npm
- Xcode (for iOS builds)
- iOS Simulator or physical device

### Install dependencies

```bash
npm install
```

### Running the app

This project uses a **development build** (not Expo Go), which means you compile a native iOS/Android app that includes `expo-dev-client`. This is required for native modules that Expo Go does not support.

#### First time / after adding a native module

Build and install the native app:

```bash
npm run ios        # iOS
npm run android    # Android
```

This compiles the native project. The first build is slow; subsequent builds are incremental and faster.

#### Day-to-day development

Start Metro and let the already-installed dev client connect:

```bash
npm start
```

Then open the dev client app on your simulator/device. It will auto-connect to the Metro bundler.

#### Physical device

1. **Build & install** (first time, or after native changes):
   ```bash
   npm run ios:device      # iOS (USB connected)
   npm run android:device  # Android
   ```
   This builds, installs, and starts Metro. The app opens on your phone.

2. **Day-to-day**, just start Metro — the app is already installed:
   ```bash
   npm start
   ```
   Open the dev client app on your phone — it auto-connects to Metro.

**Scan the QR code from inside the dev client app** — not with the phone's Camera app. Your phone and computer must be on the **same WiFi network**.

#### Other useful commands

| Command                    | Description                                |
| -------------------------- | ------------------------------------------ |
| `npm start`                | Start Metro bundler for dev client         |
| `npm run ios`              | Build and run iOS app on simulator         |
| `npm run ios:device`       | Build and run iOS app on physical device   |
| `npm run ios:no-build`     | Run iOS app without rebuilding native code |
| `npm run ios:clean`        | Clean rebuild iOS app                      |
| `npm run android`          | Build and run Android app                  |
| `npm run android:device`   | Build and run Android app on device        |
| `npm run android:no-build` | Run Android app without rebuild            |
| `npm run android:clean`    | Clean rebuild Android app                  |
| `npm run web`              | Start web version                          |
| `npm test`                 | Run tests (Vitest)                         |
| `npm run test:watch`       | Run tests in watch mode                    |
| `npm run lint`             | Run ESLint                                 |
| `npm run format`           | Format code with Prettier                  |
| `npm run typecheck`        | Run TypeScript type check                  |

### When do I need to rebuild?

You only need to run `npm run ios` / `npm run android` again when:

- You install or remove a package with native code (e.g. `npx expo install expo-camera`)
- You modify `app.json`, `Info.plist`, `AndroidManifest.xml`, or other native configuration
- You run a clean build (`npm run ios:clean` / `npm run android:clean`)

For pure JavaScript/TypeScript changes, `npm start` is enough.
