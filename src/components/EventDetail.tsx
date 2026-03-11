import { useState } from 'react';
import { useI18n } from '../i18n';
import type { EventItem, TargetInterval, TargetIntervalUnit } from '../types';
import {
  formatDateTime,
  formatDurationBetweenDates,
  formatElapsedTime,
  formatTargetInterval,
  getContrastTextColor,
  getEventStats,
  getLastTriggeredAt,
  getTargetIntervalStatus,
} from '../utils/time';
import { EventCalendar } from './EventCalendar';

const TARGET_INTERVAL_UNITS: Array<{ value: TargetIntervalUnit; label: string }> = [
  { value: 'seconds', label: '秒' },
  { value: 'minutes', label: '分' },
  { value: 'hours', label: '時間' },
  { value: 'days', label: '日' },
  { value: 'weeks', label: '週' },
  { value: 'months', label: '月' },
];

type EventDetailProps = {
  event: EventItem;
  now: Date;
  onBack: () => void;
  onTrigger: (id: string) => void;
  onUpdate: (id: string, name: string) => boolean;
  onUpdateTargetInterval: (id: string, targetInterval: TargetInterval | null) => void;
  onDelete: (id: string) => void;
};

export const EventDetail = ({
  event,
  now,
  onBack,
  onTrigger,
  onUpdate,
  onUpdateTargetInterval,
  onDelete,
}: EventDetailProps) => {
  const { messages, language } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGoActive, setIsGoActive] = useState(false);
  const [draftName, setDraftName] = useState(event.name);
  const [error, setError] = useState('');
  const stats = getEventStats(event.history, now, language);
  const lastTriggeredAt = getLastTriggeredAt(event.history);
  const historyItems = [...event.history].reverse();
  const goTextColor = getContrastTextColor(event.color);
  const [targetValue, setTargetValue] = useState(
    event.targetInterval === null ? '' : String(event.targetInterval.value),
  );
  const [targetUnit, setTargetUnit] = useState<TargetIntervalUnit>(
    event.targetInterval?.unit ?? 'days',
  );

  const targetStatus = getTargetIntervalStatus(event.history, event.targetInterval, now, language);

  const handleSave = () => {
    const ok = onUpdate(event.id, draftName);
    if (!ok) {
      setError(messages.eventForm.errors.nameRequired);
      return;
    }

    setIsEditing(false);
    setError('');
  };

  const handleDelete = () => {
    if (window.confirm(messages.detail.deleteConfirm(event.name))) {
      onDelete(event.id);
      onBack();
    }
  };

  const handleTargetSave = () => {
    const trimmed = targetValue.trim();
    if (!trimmed) {
      onUpdateTargetInterval(event.id, null);
      return;
    }

    const value = Number.parseInt(trimmed, 10);
    if (Number.isNaN(value) || value < 0) {
      return;
    }

    onUpdateTargetInterval(event.id, {
      value,
      unit: targetUnit,
    });
  };

  const handleTrigger = () => {
    setIsGoActive(true);
    onTrigger(event.id);
    window.setTimeout(() => setIsGoActive(false), 160);
  };

  return (
    <section
      className="detail-view"
      style={
        {
          '--event-accent': event.color,
          '--event-accent-contrast': goTextColor,
        } as React.CSSProperties
      }
    >
      <button className="ghost-button back-button" type="button" onClick={onBack}>
        {messages.detail.back}
      </button>

      <article className="detail-hero">
        <div className="detail-header">
          <div className="detail-title-group">
            {isEditing ? (
              <>
                <label className="sr-only" htmlFor={`edit-${event.id}`}>
                  {messages.detail.editNameLabel}
                </label>
                <input
                  id={`edit-${event.id}`}
                  className="text-input"
                  type="text"
                  value={draftName}
                  onChange={(currentEvent) => {
                    setDraftName(currentEvent.target.value);
                    if (error) {
                      setError('');
                    }
                  }}
                  maxLength={50}
                />
                {error ? <p className="form-error">{error}</p> : null}
              </>
            ) : (
              <h2 className="detail-title">{event.name}</h2>
            )}
          </div>
          <button
            className={`go-button${isGoActive ? ' is-fired' : ''}`}
            type="button"
            onClick={handleTrigger}
          >
            {messages.common.go}
          </button>
        </div>

        <dl className="stats-grid detail-stats">
          <div className="meta-card">
            <dt>{messages.detail.summary.lastRecorded}</dt>
            <dd>{formatDateTime(lastTriggeredAt, language)}</dd>
          </div>
          <div className="meta-card">
            <dt>{messages.detail.summary.elapsed}</dt>
            <dd className="elapsed-value">{formatElapsedTime(event.history, now, language)}</dd>
          </div>
          <div className="meta-card">
            <dt>{messages.detail.summary.average}</dt>
            <dd>{stats.averageInterval}</dd>
          </div>
          <div className="meta-card">
            <dt>{messages.detail.summary.recent7Days}</dt>
            <dd>{language === 'en' ? `${stats.recent7DaysCount}` : `${stats.recent7DaysCount}回`}</dd>
          </div>
          {isEditing ? (
            <>
              <div className="meta-card">
                <dt>{messages.detail.summary.targetInterval}</dt>
                <dd>{formatTargetInterval(event.targetInterval, language)}</dd>
              </div>
              <div className="meta-card">
                <dt>{messages.detail.summary.untilTarget}</dt>
                <dd>{targetStatus}</dd>
              </div>
            </>
          ) : null}
        </dl>

        <div className="event-actions">
          {isEditing ? (
            <>
              <button className="secondary-button" type="button" onClick={handleSave}>
                {messages.common.save}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setDraftName(event.name);
                  setIsEditing(false);
                  setError('');
                }}
              >
                {messages.common.cancel}
              </button>
            </>
          ) : (
            <button className="secondary-button" type="button" onClick={() => setIsEditing(true)}>
              {messages.detail.edit}
            </button>
          )}
          <button className="danger-button" type="button" onClick={handleDelete}>
            {messages.common.delete}
          </button>
        </div>

        {isEditing ? (
          <section className="color-section" aria-label={messages.eventForm.targetSectionAria}>
            <h3 className="section-title">{messages.detail.targetSectionTitle}</h3>
            <div className="target-form">
              <label className="sr-only" htmlFor={`target-${event.id}`}>
                {messages.eventForm.targetValueLabel}
              </label>
              <input
                id={`target-${event.id}`}
                className="text-input"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder={messages.detail.targetValuePlaceholder}
                value={targetValue}
                onChange={(currentEvent) => setTargetValue(currentEvent.target.value)}
              />
              <label className="sr-only" htmlFor={`target-unit-${event.id}`}>
                {messages.eventForm.targetUnitLabel}
              </label>
              <select
                id={`target-unit-${event.id}`}
                className="text-input target-unit-select"
                value={targetUnit}
                onChange={(currentEvent) => setTargetUnit(currentEvent.target.value as TargetIntervalUnit)}
              >
                {TARGET_INTERVAL_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {language === 'en'
                      ? {
                          seconds: 'Seconds',
                          minutes: 'Minutes',
                          hours: 'Hours',
                          days: 'Days',
                          weeks: 'Weeks',
                          months: 'Months',
                        }[unit.value]
                      : unit.label}
                  </option>
                ))}
              </select>
              <button className="secondary-button" type="button" onClick={handleTargetSave}>
                {messages.common.save}
              </button>
            </div>
            <p className="target-help">{messages.detail.targetHelp}</p>
          </section>
        ) : null}
      </article>

      <EventCalendar history={event.history} now={now} color={event.color} />

      <section className="detail-panel history-toggle-panel">
        <div className="detail-panel-header">
          <div>
            <h3 className="section-title">{messages.detail.historyTitle}</h3>
          </div>
          <button
            className="secondary-button history-toggle-button"
            type="button"
            aria-expanded={isHistoryOpen}
            onClick={() => setIsHistoryOpen((current) => !current)}
          >
            {isHistoryOpen ? messages.detail.historyHide : messages.detail.historyShow}
          </button>
        </div>

        {isHistoryOpen ? (
          historyItems.length === 0 ? (
            <p className="history-empty">{messages.detail.historyEmpty}</p>
          ) : (
            <ol className="history-timeline" aria-label={messages.detail.historyTitle}>
              {historyItems.map((item, index) => {
                const previousItem = historyItems[index + 1];

                return (
                  <li key={`${item.ts}-${index}`} className="history-timeline-item">
                    <article className="history-timeline-card">
                      <span className="history-marker" aria-hidden="true" />
                      <span className="history-timeline-datetime">
                        {formatDateTime(item.ts, language)}
                      </span>
                    </article>

                    {previousItem ? (
                      <div className="history-timeline-gap" aria-label={messages.detail.historyGapPrefix}>
                        <span className="history-timeline-line" aria-hidden="true" />
                        <p className="history-timeline-gap-text">
                          <span className="history-timeline-gap-label">
                            {messages.detail.historyGapPrefix}
                          </span>{' '}
                          <strong>
                            {formatDurationBetweenDates(item.ts, previousItem.ts, language)}
                          </strong>
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )
        ) : null}
      </section>
    </section>
  );
};
