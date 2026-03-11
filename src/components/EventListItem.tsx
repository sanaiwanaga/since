import { useState } from 'react';
import { useI18n } from '../i18n';
import type { EventItem } from '../types';
import { formatDateTime, formatElapsedTime } from '../utils/time';
import { getEventListItemViewModel } from '../utils/eventListItem';

type EventListItemProps = {
  event: EventItem;
  now: Date;
  onTrigger: (id: string) => void;
  onOpenDetail: (id: string) => void;
};

export const EventListItem = ({
  event,
  now,
  onTrigger,
  onOpenDetail,
}: EventListItemProps) => {
  const { messages, language } = useI18n();
  const [isGoActive, setIsGoActive] = useState(false);
  const { accentBright, goTextColor, lastTriggeredAt, progressRatio, progressDegrees, overflowDegrees } =
    getEventListItemViewModel(event, now);

  const handleTrigger = () => {
    setIsGoActive(true);
    onTrigger(event.id);
    window.setTimeout(() => setIsGoActive(false), 160);
  };

  return (
    <article
      className="event-card"
      style={
        {
          '--event-accent': event.color,
          '--event-accent-bright': accentBright,
          '--event-accent-contrast': goTextColor,
        } as React.CSSProperties
      }
    >
      <div className="event-card-header">
        <div className="event-card-lead">
          <div className="list-progress" aria-label={messages.eventListItem.progressAria}>
            <div
              className={`progress-clock${progressRatio === null ? ' is-neutral' : ''}`}
              style={
                {
                  '--progress-deg': `${progressDegrees}deg`,
                  '--overflow-deg': `${overflowDegrees}deg`,
                } as React.CSSProperties
              }
            >
              <span className="progress-clock-center" />
            </div>
        </div>
        <div className="event-title-block">
          <h2 className="event-title">{event.name}</h2>
        </div>
      </div>
        <div className="event-card-actions">
          <button
            className={`go-button${isGoActive ? ' is-fired' : ''}`}
            type="button"
            onClick={handleTrigger}
          >
            {messages.common.go}
          </button>
        </div>
      </div>

      <dl className="event-meta">
        <div className="meta-card">
          <dt>{messages.eventListItem.lastRecorded}</dt>
          <dd>{formatDateTime(lastTriggeredAt, language)}</dd>
        </div>
        <div className="meta-card meta-card-primary">
          <dt>{messages.eventListItem.elapsed}</dt>
          <dd className="elapsed-value">{formatElapsedTime(event.history, now, language)}</dd>
        </div>
      </dl>

      <div className="event-actions">
        <button className="ghost-button detail-link" type="button" onClick={() => onOpenDetail(event.id)}>
          {messages.common.detail}
        </button>
      </div>
    </article>
  );
};
