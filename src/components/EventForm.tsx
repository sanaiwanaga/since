import { useState } from 'react';
import { useI18n } from '../i18n';
import type { TargetInterval, TargetIntervalUnit } from '../types';
import { DEFAULT_EVENT_COLOR } from '../utils/storage';

const EVENT_COLORS = [
  '#111827',
  '#1d4ed8',
  '#3b82f6',
  '#06b6d4',
  '#14b8a6',
  '#10b981',
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#fb7185',
  '#ec4899',
  '#d946ef',
  '#a855f7',
  '#8b5cf6',
  '#6366f1',
  '#38bdf8',
  '#67e8f9',
  '#4b5563',
  '#94a3b8',
];

const TARGET_INTERVAL_UNITS: Array<{ value: TargetIntervalUnit; label: string }> = [
  { value: 'seconds', label: '秒' },
  { value: 'minutes', label: '分' },
  { value: 'hours', label: '時間' },
  { value: 'days', label: '日' },
  { value: 'weeks', label: '週' },
  { value: 'months', label: '月' },
];

type EventFormProps = {
  onSubmit: (name: string, color: string, targetInterval: TargetInterval | null) => boolean;
  onClose: () => void;
};

export const EventForm = ({ onSubmit, onClose }: EventFormProps) => {
  const { messages, language } = useI18n();
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_EVENT_COLOR);
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState<TargetIntervalUnit>('days');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTarget = targetValue.trim();
    let nextTargetInterval: TargetInterval | null = null;

    if (trimmedTarget) {
      const value = Number.parseInt(trimmedTarget, 10);
      if (Number.isNaN(value) || value < 0) {
        setError(messages.eventForm.errors.targetInvalid);
        return;
      }

      nextTargetInterval = {
        value,
        unit: targetUnit,
      };
    }

    const ok = onSubmit(name, color, nextTargetInterval);
    if (!ok) {
      setError(messages.eventForm.errors.nameRequired);
      return;
    }

    setName('');
    setTargetValue('');
    setTargetUnit('days');
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-create-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="detail-overline">{messages.eventForm.overline}</p>
            <h2 id="event-create-title" className="panel-title panel-title-large">
              {messages.eventForm.title}
            </h2>
          </div>
          <button className="ghost-button modal-close" type="button" onClick={onClose}>
            {messages.common.close}
          </button>
        </div>

        <form className="event-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="event-name">
            {messages.eventForm.nameLabel}
          </label>
          <div className="event-form-row">
            <input
              id="event-name"
              className="text-input"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError('');
                }
              }}
              placeholder={messages.eventForm.namePlaceholder}
              maxLength={50}
              autoFocus
            />
          </div>

          <section className="color-section color-section-standalone" aria-label={messages.eventForm.colorSectionAria}>
            <h3 className="section-title">{messages.eventForm.colorTitle}</h3>
            <div className="color-palette">
              {EVENT_COLORS.map((item) => (
                <button
                  key={item}
                  className={`color-swatch${color === item ? ' is-selected' : ''}`}
                  type="button"
                  aria-label={messages.eventForm.colorAria(item)}
                  aria-pressed={color === item}
                  style={{ '--swatch-color': item } as React.CSSProperties}
                  onClick={() => setColor(item)}
                />
              ))}
            </div>
          </section>

          <section className="color-section color-section-standalone" aria-label={messages.eventForm.targetSectionAria}>
            <h3 className="section-title">{messages.eventForm.targetTitle}</h3>
            <div className="target-form">
              <label className="sr-only" htmlFor="create-target-value">
                {messages.eventForm.targetValueLabel}
              </label>
              <input
                id="create-target-value"
                className="text-input"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder={messages.eventForm.targetPlaceholder}
                value={targetValue}
                onChange={(event) => {
                  setTargetValue(event.target.value);
                  if (error) {
                    setError('');
                  }
                }}
              />
              <label className="sr-only" htmlFor="create-target-unit">
                {messages.eventForm.targetUnitLabel}
              </label>
              <select
                id="create-target-unit"
                className="text-input target-unit-select"
                value={targetUnit}
                onChange={(event) => setTargetUnit(event.target.value as TargetIntervalUnit)}
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
            </div>
            <p className="target-help">{messages.eventForm.targetHelp}</p>
          </section>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>
              {messages.common.cancel}
            </button>
            <button className="primary-button" type="submit">
              {messages.eventForm.add}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
