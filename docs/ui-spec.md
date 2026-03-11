# UI Specification

## Tone
The interface should feel practical, quick, and clear rather than decorative. Japanese labels should be short and unambiguous so the user can operate the app without interpretation effort.

## Page Sections

### Footer Tabs
- Bottom tab bar with:
  - `ホーム`
  - `履歴`
  - `設定`
- Active tab should be visually distinct.
- Event detail remains part of the home flow rather than becoming a separate tab.

### Header
- App title: `経過時間トラッカー`
- Supporting text: explain that pressing `GO` records the current time and shows elapsed time.
- The top area should feel like a small public app landing surface rather than a developer demo.

### Event Creation
- Home screen includes a floating add button labeled with `+`.
- Tapping it opens a creation modal.
- Modal fields:
  - event name
  - color selection
  - optional target interval value and unit
  - `追加`
- Validation message for empty submission: `イベント名を入力してください`
- Target interval may be left blank and should remain unset in that case.

### Backup and Restore
- `設定` tab also includes:
  - display section
  - data management section
  - compact About section
- Display section includes:
  - `言語`
  - `並び順`
  - `テーマ`
- Display description: `アプリの表示方法を変更できます。`
- Data management section title: `データ管理`
- Data management description: `イベントデータのバックアップや復元ができます。`
- Export button: `JSONを書き出す`
- Import control:
  - file picker accepting `.json`
  - action label: `JSONを読み込む`
- Success messages should clearly state completion.
- Error messages should clearly state invalid format or read failure.
- Backup and restore controls live in the `設定` tab.
- Language options should include:
  - `日本語`
  - `English`
- Changing the language should immediately update visible UI text.
- Sort order options should include:
  - `最近記録した順`
  - `作成が新しい順`
  - `名前順`
- The sort selection should persist locally and affect the home event list.
- Theme may be shown as a placeholder until implemented.
- About section should show:
  - `Since`
  - `周期ログアプリ`
  - version
  - `© Sana Iwanaga`

### Event List
- If no events exist, show an empty-state card with text such as `イベントがありません。上のフォームから追加してください。`
- Cards should stack vertically on mobile with comfortable spacing.
- Keep each item compact and focused on immediate actions.
- The `GO` button must be the most visually prominent action on the screen.
- The top of the home screen should prioritize the list rather than explanatory copy or settings controls.

### Event List Item Content
- Event name
- Last recorded section:
  - label: `前回記録`
  - value: formatted datetime or `未記録`
- Elapsed section:
  - label: `経過時間`
  - value:
    - when recorded: `X日 Y時間 Z分`
    - when not recorded: `未記録`
- Action buttons:
  - `GO`
  - `詳細`

### Event Detail Page
- Back action: `一覧へ戻る`
- Header shows:
  - event name
  - `GO`
  - `編集`
  - `削除`
- Summary shows:
  - `前回記録`
  - `経過時間`
  - `平均間隔`
  - `直近7日間の記録回数`
- Target setting shows:
  - numeric input
  - unit dropdown with `秒`, `分`, `時間`, `日`, `週`, `月`
  - current target label such as `3日` or `2時間`
  - remaining or overrun status
- Calendar section:
  - monthly calendar grid
  - month navigation
  - dates with one or more records show a visible circle
  - multiple records on one date still show one circle
  - calendar cells should be easy to scan on small screens
- History section:
  - hidden by default
  - revealed by `履歴を見る`
  - toggle label switches to `履歴を閉じる` while open
  - rendered as a vertical timeline
  - latest records appear first
  - each record card shows formatted local datetime
  - each gap between records shows the elapsed interval from the previous entry
- Color selection should not require opening the detail page.

### Global History Page
- Show a lightweight trend chart for daily record counts in the last 14 days.
- Allow selecting a single event to view its recent daily trend.
- Show recent records from all events in descending datetime order.
- Each row should show:
  - event name
  - recorded datetime
  - event color marker
  - detail navigation

## Interaction Rules
- `GO` immediately records the current time.
- `GO` appends a new timestamp to the event history.
- `詳細` opens the event detail page.
- `編集` is available on the detail page.
- `保存` commits the new event name if valid.
- `キャンセル` restores the previous name and exits edit mode.
- `削除` asks for confirmation before removing the event, and returns to the list if deletion succeeds from detail.
- Export writes the current full event dataset as a JSON file.
- Import validates the selected JSON and replaces the current dataset only when valid.

## Responsive Behavior
- Mobile-first layout.
- Form fields and buttons should span available width on small screens.
- On wider screens, event card actions can align horizontally.
- Tap targets should remain large enough for finger input.

## Accessibility Expectations
- Inputs require associated labels.
- Buttons require visible text.
- Use sufficient contrast and clear focus styles.
- Confirmation for deletion should avoid accidental data loss.
