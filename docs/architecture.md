# Architecture

## Frontend Structure
The application is a single-page React app built with Vite and TypeScript. It uses component state and custom hooks instead of introducing a global state library. The application keeps its data model intentionally small and relies on browser storage for persistence.

## Proposed Module Layout
- `src/App.tsx`
  - top-level page shell
  - screen switching between list and detail
- `src/registerServiceWorker.ts`
  - production-only service worker registration
- `src/hooks/useAppSettings.ts`
  - lightweight settings state and persistence bridge
- `src/i18n/`
  - language dictionaries and lightweight i18n context
- `src/components/EventListItem.tsx`
  - compact list item for a single event
- `src/components/EventDetail.tsx`
  - detail page layout and actions
- `src/components/EventCalendar.tsx`
  - monthly calendar with marked dates
- `src/components/EventForm.tsx`
  - modal form for creating events with name and color selection
- `src/hooks/useEvents.ts`
  - event CRUD operations
  - `GO` action handling
  - persistence coordination
- `src/hooks/useNow.ts`
  - time tick hook to trigger elapsed-time refresh
- `src/utils/storage.ts`
  - `localStorage` read/write helpers
  - backup export/import validation helpers
  - legacy-schema migration helpers
- `src/utils/appSettings.ts`
  - app-level UI settings persistence
  - event sort helpers
- `src/utils/time.ts`
  - datetime formatting
  - elapsed-time formatting
  - interval-statistics helpers
  - target-interval unit conversion and due-date calculation
  - local-date grouping and calendar helpers
- `src/utils/eventListItem.ts`
  - list item view-model helper for derived progress and accent values
- `src/types.ts`
  - shared TypeScript types
- `public/`
  - web app manifest
  - app icons
  - service worker

## Data Model

### Event Entity
- `id: string`
- `name: string`
- `createdAt: string`
- `updatedAt: string`
- `history: { ts: string }[]`

Dates are stored as ISO strings inside small history entry objects to keep serialization straightforward while leaving room for future per-record metadata.
The last recorded datetime is derived from the last element of `history`.

## State Strategy
- The source of truth is an array of events held in React state.
- App-level display settings are stored separately from event data and persisted under a dedicated localStorage key.
- The selected language is stored in app settings and provided through a shared i18n context.
- On initial load, the app reads persisted data from `localStorage`.
- Every mutating action updates state first and persists the resulting array.
- A timer hook updates a `now` value every second so elapsed durations and second-based targets re-render automatically.
- Statistics are derived at render time from the event history and current time.
- The selected event detail view is derived from the current selected event id in app state.

## Persistence Strategy
- Use a single storage key for the complete event array.
- Use a separate storage key for lightweight app settings such as event sort order.
- Keep the selected language in the same app settings key so it stays independent from event import/export payloads.
- Validate parsed JSON to ensure it is an array of roughly correct objects.
- Accept and migrate the previous schema that stored only `lastTriggeredAt`.
- Accept and migrate the intermediate schema that stored `history` as `string[]`.
- Accept and migrate previous target interval schemas that stored only day or minute values.
- If validation fails, ignore the stored value and use an empty list.
- Reuse the same normalization logic for both `localStorage` load and JSON import.
- Import replaces the in-memory event array only after validation succeeds.

## PWA Strategy
- Ship a static web app manifest with app name, colors, display mode, and icon set.
- Register a service worker only in production builds.
- Cache the app shell and fetched same-origin static assets for basic offline support.
- Use navigation fallback to cached `index.html` so the SPA still loads offline after first visit.

## Rendering Strategy
- The page starts with:
  - title
  - short explanatory text
  - either list screen or detail screen
- The list screen contains:
  - floating add button that opens the create modal
  - sort order applied from app settings
  - event list or empty state
- Each list item contains:
  - last recorded datetime
  - emphasized elapsed time
  - `GO`
  - detail navigation
- The detail screen contains:
  - back navigation
  - event summary
  - average interval
  - recent 7-day count
  - monthly calendar
  - history list
  - edit and delete actions
  - target interval settings while editing
- The settings screen contains:
  - language selector
  - event sort order selector
  - backup / restore controls
  - usage notes
  - compact About block with version and author

## Testing Strategy
- Utility tests verify formatting behavior and edge cases.
- Storage tests verify safe parsing, persistence behavior, and legacy-data migration.
- Component tests verify major user flows, detail-page rendering, calendar marking, and export/import feedback behavior.
