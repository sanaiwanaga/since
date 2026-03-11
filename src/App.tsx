import packageJson from '../package.json';
import { useEffect, useRef, useState } from 'react';
import { EventDetail } from './components/EventDetail';
import { EventForm } from './components/EventForm';
import { EventListItem } from './components/EventListItem';
import { useAppSettings } from './hooks/useAppSettings';
import { useEvents } from './hooks/useEvents';
import { useNow } from './hooks/useNow';
import { I18nProvider, useI18n } from './i18n';
import type { AppLanguage, EventSortOrder } from './types';
import { sortEvents } from './utils/appSettings';
import { exportEventsJson, parseEventsJson } from './utils/storage';
import { buildRecentDailyCountSeries, formatDateTime } from './utils/time';

type AppTab = 'home' | 'history' | 'settings';

const TabIconHome = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="6" height="6" rx="1.5" />
    <rect x="14" y="4" width="6" height="6" rx="1.5" />
    <rect x="4" y="14" width="6" height="6" rx="1.5" />
    <rect x="14" y="14" width="6" height="6" rx="1.5" />
  </svg>
);

const TabIconHistory = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 8.5v4.2l2.8 1.8" />
  </svg>
);

const TabIconSettings = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 7h14" />
    <path d="M5 12h14" />
    <path d="M5 17h14" />
    <circle cx="9" cy="7" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="11" cy="17" r="2" />
  </svg>
);

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsText(file);
  });

type AppContentProps = {
  language: AppLanguage;
  eventSortOrder: EventSortOrder;
  setEventSortOrder: (eventSortOrder: EventSortOrder) => void;
  setLanguage: (language: AppLanguage) => void;
};

const AppContent = ({
  language,
  eventSortOrder,
  setEventSortOrder,
  setLanguage,
}: AppContentProps) => {
  const { messages } = useI18n();
  const {
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    triggerEvent,
    replaceEvents,
    updateEventTargetInterval,
  } =
    useEvents();
  const now = useNow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedHistoryTrendEventId, setSelectedHistoryTrendEventId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const eventSortOptions: Array<{ value: EventSortOrder; label: string }> = [
    { value: 'recentlyTriggeredDesc', label: messages.settings.sortOptions.recentlyTriggeredDesc },
    { value: 'createdAtDesc', label: messages.settings.sortOptions.createdAtDesc },
    { value: 'nameAsc', label: messages.settings.sortOptions.nameAsc },
  ];
  const sortedEvents = sortEvents(events, eventSortOrder);
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const historyTrendEvents = events.filter((event) => event.history.length > 0);
  const selectedHistoryTrendEvent =
    historyTrendEvents.find((event) => event.id === selectedHistoryTrendEventId) ?? historyTrendEvents[0] ?? null;
  const recentDailySeries = buildRecentDailyCountSeries(
    selectedHistoryTrendEvent?.history.map((entry) => entry.ts) ?? [],
    now,
    language,
  );
  const maxDailyCount = Math.max(1, ...recentDailySeries.map((point) => point.count));
  const chartPoints = recentDailySeries
    .map((point, index) => {
      const x = recentDailySeries.length === 1 ? 0 : (index / (recentDailySeries.length - 1)) * 100;
      const y = 100 - (point.count / maxDailyCount) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const historyEntries = events
    .flatMap((event) =>
      event.history.map((entry, index) => ({
        key: `${event.id}-${entry.ts}-${index}`,
        eventId: event.id,
        eventName: event.name,
        eventColor: event.color,
        recordedAt: entry.ts,
      })),
    )
    .sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime());

  useEffect(() => {
    if (selectedEventId && !selectedEvent) {
      setSelectedEventId(null);
    }
  }, [selectedEvent, selectedEventId]);

  useEffect(() => {
    if (!historyTrendEvents.length) {
      setSelectedHistoryTrendEventId(null);
      return;
    }

    if (!selectedHistoryTrendEventId || !historyTrendEvents.some((event) => event.id === selectedHistoryTrendEventId)) {
      setSelectedHistoryTrendEventId(historyTrendEvents[0]?.id ?? null);
    }
  }, [historyTrendEvents, selectedHistoryTrendEventId]);

  const switchTab = (tab: AppTab) => {
    setActiveTab(tab);
    setSelectedEventId(null);
    setMessage(null);
  };

  const handleExport = () => {
    const json = exportEventsJson(events);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'since-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: messages.status.exportSuccess });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await readFileAsText(file);
      const parsed = parseEventsJson(text);

      if (!parsed) {
        setMessage({ type: 'error', text: messages.status.importInvalid });
        event.target.value = '';
        return;
      }

      replaceEvents(parsed);
      setActiveTab('home');
      setSelectedEventId(null);
      setMessage({ type: 'success', text: messages.status.importSuccess });
    } catch {
      setMessage({ type: 'error', text: messages.status.importReadError });
    }

    event.target.value = '';
  };

  return (
    <main className="page">
      {selectedEvent ? (
        <EventDetail
          event={selectedEvent}
          now={now}
          onBack={() => setSelectedEventId(null)}
          onTrigger={triggerEvent}
          onUpdate={updateEvent}
          onUpdateTargetInterval={updateEventTargetInterval}
          onDelete={deleteEvent}
        />
      ) : (
        <>
          {activeTab === 'home' ? (
            <>
              <section className="detail-view home-view">
                {message ? (
                  <section className="panel panel-intro">
                    <p className={message.type === 'success' ? 'status-success' : 'status-error'}>
                      {message.text}
                    </p>
                  </section>
                ) : null}

                <section className="event-list" aria-label={messages.home.listAria}>
                  <div className="section-band">
                    <p className="section-band-label">{messages.home.collectionLabel}</p>
                    <h2 className="section-band-title">{messages.home.collectionTitle}</h2>
                  </div>
                  {events.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-badge">{messages.home.emptyBadge}</div>
                      <h2>{messages.home.emptyTitle}</h2>
                      <p>{messages.home.emptyCopy}</p>
                    </div>
                  ) : (
                    <>
                      {sortedEvents.map((event) => (
                        <EventListItem
                          key={event.id}
                          event={event}
                          now={now}
                          onTrigger={triggerEvent}
                          onOpenDetail={setSelectedEventId}
                        />
                      ))}
                    </>
                  )}
                </section>
              </section>

              <button
                className="fab-button"
                type="button"
                aria-label={messages.home.addEvent}
                onClick={() => setIsCreateOpen(true)}
              >
                +
              </button>
            </>
          ) : null}

          {activeTab === 'history' ? (
            <section className="detail-view">
              <section className="detail-panel">
                <p className="detail-overline">{messages.history.overline}</p>
                <h2 className="detail-title detail-title-compact">{messages.history.title}</h2>
                <p className="panel-copy">{messages.history.copy}</p>
              </section>

              <section className="detail-panel">
                <h3 className="section-title">{messages.history.trendTitle}</h3>
                <p className="panel-copy">{messages.history.trendCopy}</p>
                {historyTrendEvents.length === 0 ? (
                  <p className="history-empty">{messages.history.empty}</p>
                ) : (
                  <>
                    <div className="settings-field">
                      <label className="field-label" htmlFor="history-trend-event">
                        {messages.history.trendEventLabel}
                      </label>
                      <select
                        id="history-trend-event"
                        className="text-input target-unit-select"
                        value={selectedHistoryTrendEvent?.id ?? ''}
                        onChange={(event) => setSelectedHistoryTrendEventId(event.target.value)}
                      >
                        {historyTrendEvents.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="history-trend-chart" aria-label={messages.history.trendAria} role="img">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <polyline className="history-trend-line" points={chartPoints} />
                        {recentDailySeries.map((point, index) => {
                          const x =
                            recentDailySeries.length === 1 ? 0 : (index / (recentDailySeries.length - 1)) * 100;
                          const y = 100 - (point.count / maxDailyCount) * 100;

                          return (
                            <circle
                              key={point.key}
                              className="history-trend-dot"
                              cx={x}
                              cy={y}
                              r="1.8"
                            />
                          );
                        })}
                      </svg>
                    </div>
                    <ol className="history-trend-axis" aria-hidden="true">
                      {recentDailySeries.map((point) => (
                        <li key={point.key}>
                          <span>{point.label}</span>
                          <strong>{point.count}</strong>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </section>

              <section className="detail-panel">
                <h3 className="section-title">{messages.history.recentTitle}</h3>
                {historyEntries.length === 0 ? (
                  <p className="history-empty">{messages.history.empty}</p>
                ) : (
                  <ol className="history-list history-list-global">
                    {historyEntries.map((entry) => (
                      <li key={entry.key} className="history-item history-item-global">
                        <span
                          className="history-marker"
                          aria-hidden="true"
                          style={{ '--event-accent': entry.eventColor } as React.CSSProperties}
                        />
                        <div className="history-content">
                          <strong>{entry.eventName}</strong>
                          <span>{formatDateTime(entry.recordedAt, language)}</span>
                        </div>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => {
                            setActiveTab('home');
                            setSelectedEventId(entry.eventId);
                          }}
                        >
                          {messages.common.detail}
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </section>
          ) : null}

          {activeTab === 'settings' ? (
            <section className="detail-view">
              <section className="detail-panel">
                <p className="detail-overline">{messages.settings.overline}</p>
                <h2 className="detail-title detail-title-compact">{messages.settings.title}</h2>
                <p className="panel-copy">{messages.settings.copy}</p>
              </section>

              <section className="detail-panel settings-panel-primary">
                <h3 className="section-title">{messages.settings.displayTitle}</h3>
                <p className="panel-copy">{messages.settings.displayCopy}</p>
                <div className="settings-field">
                  <label className="field-label" htmlFor="app-language">
                    {messages.settings.languageLabel}
                  </label>
                  <select
                    id="app-language"
                    className="text-input target-unit-select"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                  >
                    <option value="ja">{messages.settings.languageOptions.ja}</option>
                    <option value="en">{messages.settings.languageOptions.en}</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label className="field-label" htmlFor="event-sort-order">
                    {messages.settings.sortLabel}
                  </label>
                  <select
                    id="event-sort-order"
                    className="text-input target-unit-select"
                    value={eventSortOrder}
                    onChange={(event) => setEventSortOrder(event.target.value as EventSortOrder)}
                  >
                    {eventSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label className="field-label" htmlFor="app-theme">
                    {messages.settings.themeTitle}
                  </label>
                  <input
                    id="app-theme"
                    className="text-input"
                    type="text"
                    value={messages.settings.themeValue}
                    readOnly
                    aria-readonly="true"
                  />
                  <p className="field-help">{messages.settings.themeCopy}</p>
                </div>
              </section>

              <section className="detail-panel settings-panel-secondary">
                <h3 className="section-title">{messages.settings.dataTitle}</h3>
                <p className="panel-copy">{messages.settings.dataCopy}</p>
                <div className="backup-actions">
                  <button className="secondary-button" type="button" onClick={handleExport}>
                    {messages.settings.export}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {messages.settings.import}
                  </button>
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImport}
                    aria-label={messages.settings.fileInputAria}
                  />
                </div>
                {message ? (
                  <p className={message.type === 'success' ? 'status-success' : 'status-error'}>
                    {message.text}
                  </p>
                ) : null}
              </section>

              <section className="detail-panel about-panel">
                <p className="detail-overline">{messages.settings.aboutOverline}</p>
                <h3 className="section-title about-title">{messages.settings.aboutTitle}</h3>
                <p className="about-copy">{messages.settings.aboutCopy}</p>
                <p className="about-meta-line">{`${messages.settings.version} ${packageJson.version}`}</p>
                <p className="about-meta-line about-credit">© Sana Iwanaga</p>
              </section>
            </section>
          ) : null}
        </>
      )}

      {isCreateOpen ? <EventForm onSubmit={createEvent} onClose={() => setIsCreateOpen(false)} /> : null}

      <nav className="tab-bar" aria-label="main tabs">
        <button
          className={`tab-button${activeTab === 'home' ? ' is-active' : ''}`}
          type="button"
          onClick={() => switchTab('home')}
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          <span className="tab-icon" aria-hidden="true">
            <TabIconHome />
          </span>
          <span>{messages.tabs.home}</span>
        </button>
        <button
          className={`tab-button${activeTab === 'history' ? ' is-active' : ''}`}
          type="button"
          onClick={() => switchTab('history')}
          aria-current={activeTab === 'history' ? 'page' : undefined}
        >
          <span className="tab-icon" aria-hidden="true">
            <TabIconHistory />
          </span>
          <span>{messages.tabs.history}</span>
        </button>
        <button
          className={`tab-button${activeTab === 'settings' ? ' is-active' : ''}`}
          type="button"
          onClick={() => switchTab('settings')}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <span className="tab-icon" aria-hidden="true">
            <TabIconSettings />
          </span>
          <span>{messages.tabs.settings}</span>
        </button>
      </nav>
    </main>
  );
};

export default function App() {
  const { language, eventSortOrder, setEventSortOrder, setLanguage } = useAppSettings();

  return (
    <I18nProvider language={language}>
      <AppContent
        language={language}
        eventSortOrder={eventSortOrder}
        setEventSortOrder={setEventSortOrder}
        setLanguage={setLanguage}
      />
    </I18nProvider>
  );
}
