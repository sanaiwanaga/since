import type { HistoryEntry } from '../types';
import { useState } from 'react';
import { useI18n } from '../i18n';
import {
  buildCalendarMonth,
  formatMonthLabel,
  getLocalDateKey,
  getLastTriggeredAt,
  startOfMonth,
} from '../utils/time';

type EventCalendarProps = {
  history: HistoryEntry[];
  now: Date;
  color: string;
};

export const EventCalendar = ({ history, now, color }: EventCalendarProps) => {
  const { messages, language } = useI18n();
  const initialAnchor = getLastTriggeredAt(history) ?? now.toISOString();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date(initialAnchor)),
  );
  const cells = buildCalendarMonth(visibleMonth, history);
  const todayKey = getLocalDateKey(now);
  const monthLabel = formatMonthLabel(visibleMonth, language);

  return (
    <section className="detail-panel" style={{ '--event-accent': color } as React.CSSProperties}>
      <div className="calendar-header">
        <div>
          <h3 className="section-title">{messages.calendar.title}</h3>
          <p className="calendar-subtitle">{messages.calendar.subtitle}</p>
        </div>
        <div className="calendar-nav">
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              setVisibleMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          >
            ◀
          </button>
          <p className="calendar-title">{monthLabel}</p>
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              setVisibleMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          >
            ▶
          </button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label={messages.calendar.gridAria(monthLabel)}>
        {messages.calendar.weekdays.map((weekday) => (
          <div key={weekday} className="calendar-weekday" role="columnheader">
            {weekday}
          </div>
        ))}
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`calendar-cell${cell.isCurrentMonth ? '' : ' is-outside'}${
              todayKey === cell.key ? ' is-today' : ''
            }`}
            role="gridcell"
            aria-label={messages.calendar.cellAria(cell.key, cell.hasRecord)}
          >
            <span className="calendar-day-number">{cell.dayNumber}</span>
            {cell.hasRecord ? <span className="calendar-dot" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
};
