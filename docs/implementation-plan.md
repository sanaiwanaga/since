# Implementation Plan

## Phase 1: Project Setup
- Create `package.json`, TypeScript config, Vite config, Vitest config, ESLint config, and HTML entrypoint.
- Establish source folder structure and baseline styles.

## Phase 2: Domain and Utilities
- Define the event type.
- Implement time formatting helpers.
- Implement `localStorage` helpers with defensive parsing.

## Phase 3: Hooks
- Implement `useNow` to update the current time on an interval.
- Implement `useEvents` to handle create, update, delete, and trigger flows with persistence.

## Phase 4: UI Components
- Build the page shell and create form.
- Build event cards with edit mode, delete confirmation, and GO action.
- Apply mobile-friendly styles with clear visual hierarchy.

## Phase 5: Test Coverage
- Add utility tests for time and storage helpers.
- Add interaction tests for the main app behavior.

## Phase 6: Verification
- Run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run check`
- Fix any failures until clean.
