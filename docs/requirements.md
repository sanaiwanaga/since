# Requirements

## Summary
This application tracks elapsed time since the last recorded occurrence of user-defined events. A user can define any event label, such as `うんち`, and record the current time by pressing a `GO` button. The application stores the full timestamp history for each event and shows both the latest elapsed duration and summary statistics derived from past intervals.

## Problem Statement
Users often want a lightweight way to know how much time has passed since a repeated personal event. Existing reminder or task apps add unnecessary complexity because this use case only needs timestamp recording and quick visual feedback.

## Primary Use Cases
1. A user creates an event named `うんち`.
2. The user presses `GO` each time the event occurs.
3. The user returns later and immediately sees:
   - the last recorded datetime
   - how many days, hours, and minutes have elapsed
4. The user opens an event detail page to inspect:
   - interval statistics
   - monthly calendar marks
   - on-demand history timeline
4. The user maintains multiple event types independently.

## Functional Scope

### Event Management
- Create an event with a non-empty name.
- Show all events in a list.
- Edit an existing event name inline or within the event card.
- Delete an event with a deliberate confirmation step.

### Recording
- Each event has a dedicated `GO` action.
- Pressing `GO` records the current local date and time.
- The recorded datetime is appended to that event's history array.

### Display
- List screen shows only:
  - event name
  - last recorded datetime
  - elapsed time
  - `GO` action
  - detail navigation
- Detail screen shows:
  - event name
  - `GO` button
  - last recorded datetime
  - elapsed time
  - average interval
  - number of recorded entries in the last 7 days
  - monthly calendar
  - history toggle button
  - history timeline shown only when requested
  - edit action
  - delete action
- Event creation should allow choosing a record color up front.
- Event creation may optionally set a target interval, but it must still be possible to create an event without one.
- Target interval editing can stay inside the detail edit flow instead of always being visible.
- Show `未記録` when the event has not been triggered yet.
- Show elapsed time as days, hours, and minutes since the last recorded datetime.
- Each event can optionally store a target interval as a value plus unit.
- Supported target units are `秒`, `分`, `時間`, `日`, `週`, `月`.
- If a target interval exists, show either the remaining time, exact match, or overrun amount.
- Month targets should be calculated as one calendar month from the recorded local datetime, not as a fixed 30-day approximation.
- Show average interval computed from adjacent history entries.
- If statistics cannot be computed because history is too short, show `未記録`.
- In the calendar, mark a day with a circle when one or more records exist on that local date.
- Each event can define its own circle color.
- Date grouping for calendar marks must use local date logic rather than UTC date slicing.
- Refresh elapsed time automatically while the app is open.

### Persistence
- Save all event data in browser `localStorage`.
- Restore event data on page load.
- Save the selected UI language in localStorage and apply it immediately.
- Migrate previously saved data that only has `lastTriggeredAt` into the new history-array format.
- Migrate previously saved data that stored `history` as `string[]` into the current history-entry object format.
- Handle malformed or missing storage data safely by falling back to an empty list.
- Export all event data as JSON.
- Import previously exported JSON after validating its structure.
- Show clear success and error messages for backup and restore actions.
- Save app-level preferences such as sort order separately from event data.

## Non-Functional Requirements
- Mobile-friendly responsive UI.
- Clear Japanese copy throughout the interface.
- Support both Japanese and English UI.
- Fast interaction with no backend dependency.
- Reasonable accessibility with labeled inputs, buttons, and readable contrast.
- Public release should support installation as a PWA on supported mobile browsers.
- Basic offline support should keep the app shell available after it has been loaded once.

## Constraints
- No server or database.
- No authentication.
- All behavior must work fully client-side.
