# Testing Runbook (Maintainers)

Hard requirements for PR acceptance and repo stability.

## 1. Merge Gate (Strict)

All PRs must pass the local "Pre-Flight" command before review:

```bash
npm run check
```

This runs, in order:

1. `npm run lint:fix` (auto-fixes styling)
2. `npm run format` (Prettier)
3. `npm run lint` (ESLint verify)
4. `npm run typecheck` (TSC verify)
5. `npm run test` (Vitest suite)

### Failure Triage

- **Lint/Format Fail**: Logic is likely fine, just run `npm run format && npm run lint:fix`.
- **Typecheck Fail**: Common cause is alias drift in `tsconfig.json` or stale prop imports.
- **Vitest Fail**: Check `src/tests/test-setup.ts` for missing mocks or expired snapshots.
- **E2E Fail**: Ensure dev-client is running and permission flows (`e2e/maestro/flows/helpers/ios-permissions.yaml`) aren't blocked.

---

## 2. Testing Strategy

| Tier            | Tool          | Coverage                    | Frequency   | Command                     |
| :-------------- | :------------ | :-------------------------- | :---------- | :-------------------------- |
| **Unit**        | Vitest        | Hooks, Libs, Helpers        | Continuous  | `npm run test:watch`        |
| **Component**   | Vitest + RNTL | UI States, Events, Props    | Continuous  | `npm run test`              |
| **E2E (Smoke)** | Maestro       | App Launch, Nav, Voice Init | Per Feature | `npm run e2e:maestro:smoke` |
| **E2E (Full)**  | Maestro       | All flows, Settings Persist | Pre-Release | `npm run e2e:maestro:all`   |

---

## 3. Vitest (Unit & Component)

### Configuration

- **Entry**: `vitest.config.mts`
- **Global Setup**: `src/tests/test-setup.ts`
- **Globals**: `true` (no `describe`/`it` imports).
- **Aliases**: `@/*` and `@/assets/*` must stay in sync with `tsconfig.json`.

### Authoring Conventions

1. **Helper Pattern**: Use `renderComponentName({ overrides })` with `DEFAULT_PROPS`.
2. **Prop Imports**: Import `Props` types directly from component files for helper types.
3. **Assertions**: Always use `screen.*` from `@testing-library/react-native`. Do not destructure queries from `render`.
4. **Spacing**: AAA (Arrange/Act/Assert) with empty lines between sections. No `// Arrange` comments.
5. **Formatting**: Empty line before `return` in all test files (ESLint rule).

### Mocking Policy

- **Shared First**: Check `src/tests/test-setup.ts` before creating local mocks.
- **Native Modules**: Mock at the module level (e.g., `vi.mock('expo-speech', ...)`).
- **Deterministic**: Mocks should return fixed values (e.g., `test-uuid-1234`) to prevent snapshot/assertion drift.

---

## 4. E2E (Maestro)

### Prerequisites

1. **Simulator**: iOS Simulator booted.
2. **Dev Client**: App built and installed (`npm run ios`).
3. **Metro**: Bundler running (`npm start`).

### Flow Inventory

- `smoke.yaml`: Critical path only (Home -> Settings -> Voice -> Home).
- `settings-name-edit.yaml`: State persistence and keyboard interaction.
- `helpers/ios-permissions.yaml`: Reusable permission handler for "Allow While Using App", "OK", etc.

### Authoring Rules

- **Selectors**: Prefer `id` (via `testID` prop) over text strings where possible.
- **Permissions**: Start every flow with `runFlow: helpers/ios-permissions.yaml`.
- **Stability**: Use `waitForAnimationToEnd` after navigation steps.
- **Reset**: Every flow must leave the app in a clean state or reset modified settings at the end.

---

## 5. Pre-Merge Checklist (Manual)

- [ ] `npm run check` is green.
- [ ] New components have corresponding `.test.tsx` files.
- [ ] Complex hooks have corresponding `.test.ts` files.
- [ ] Critical UI changes verified via `npm run e2e:maestro:smoke`.
- [ ] No `console.log` or debug statements remain in tests or source.
- [ ] All new dependencies pinned exactly in `package.json`.
