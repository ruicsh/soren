# Testing

## E2E Testing (Maestro)

App uses [Maestro](https://maestro.mobile.dev/) for E2E flows on iOS.

1.  **Install Maestro CLI**: `brew install mobile-dev-inc/tap/maestro`
2.  **Boot App**:
    - Terminal 1: `npm run ios` (first install dev client)
    - Terminal 2: `npm start`
3.  **Run Tests**:
    - Smoke: `npm run e2e:maestro:smoke`
    - All: `npm run e2e:maestro:all`
