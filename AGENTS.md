# AGENTS.md

## Project Overview
- This project is an elapsed-time tracker for user-defined events.
- It is not a reminder application.
- The primary user action is pressing a `GO` button to record the current date and time for an event.
- The UI continuously displays how much time has passed since the most recent recorded timestamp.
- Each event also keeps a full trigger history so interval statistics can be calculated.

## Product Goals
- Make event recording extremely fast on mobile and desktop.
- Keep the interface readable in Japanese.
- Preserve all event data locally in the browser with `localStorage`.
- Avoid unnecessary complexity such as accounts, sync, notifications, or server APIs.

## Core User Flows
1. Create a new event by entering a name and submitting the form.
2. View the list of saved events.
3. Press `GO` on any event to record the current datetime.
4. Review the last recorded datetime and elapsed time for each event.
5. Review interval statistics derived from recorded history.
6. Rename or delete an event.

## Functional Requirements
- Users can create multiple events.
- Each event stores:
  - unique identifier
  - event name
  - created timestamp
  - updated timestamp
  - history array of recorded timestamp objects
- If an event has never been triggered, show `未記録`.
- Elapsed time must refresh automatically without requiring user interaction.
- Show event statistics:
  - average interval
  - shortest interval
  - longest interval
  - number of recorded entries in the last 7 days
- All data must persist in `localStorage`.

## UI Requirements
- Japanese UI text must be clear and natural.
- The layout must work on narrow mobile screens first, then scale to desktop.
- Important actions (`GO`, create, save, delete) must be easy to tap.
- The elapsed-time value should be visually emphasized.

## Technical Requirements
- React
- TypeScript
- Vite
- Vitest
- ESLint
- npm scripts:
  - `dev`
  - `build`
  - `typecheck`
  - `lint`
  - `test`
  - `check`

## Implementation Guidance
- Prefer simple local state with custom hooks over adding global state libraries.
- Isolate `localStorage` access in a dedicated utility or hook.
- Keep date formatting and elapsed-time formatting in reusable utility functions.
- Keep interval-statistics logic in reusable utility functions.
- Use semantic HTML and accessible form controls.

## Testing Guidance
- Unit test date formatting and elapsed-time formatting.
- Unit test interval-statistics formatting and storage migration.
- Unit test event persistence helpers.
- Component tests should cover:
  - empty state
  - creating an event
  - renaming an event
  - deleting an event
  - recording a timestamp via `GO`
  - history-based statistics rendering
  - `未記録` rendering

## Non-Goals
- User authentication
- Cloud sync
- Push notifications
- Background timers beyond visible UI refresh
