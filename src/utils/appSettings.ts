import type { AppLanguage, EventItem, EventSortOrder } from '../types';
import { getLastTriggeredAt } from './time';

export const APP_SETTINGS_KEY = 'since.app-settings';

export const DEFAULT_EVENT_SORT_ORDER: EventSortOrder = 'createdAtDesc';
export const DEFAULT_APP_LANGUAGE: AppLanguage = 'ja';

export type AppSettings = {
  eventSortOrder: EventSortOrder;
  language: AppLanguage;
};

const isAppLanguage = (value: unknown): value is AppLanguage => value === 'ja' || value === 'en';

const isEventSortOrder = (value: unknown): value is EventSortOrder =>
  value === 'recentlyTriggeredDesc' || value === 'createdAtDesc' || value === 'nameAsc';

const isAppSettings = (value: unknown): value is AppSettings => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return isEventSortOrder(item.eventSortOrder) && isAppLanguage(item.language);
};

export const loadAppSettings = (): AppSettings => {
  if (typeof window === 'undefined') {
    return { eventSortOrder: DEFAULT_EVENT_SORT_ORDER, language: DEFAULT_APP_LANGUAGE };
  }

  const raw = window.localStorage.getItem(APP_SETTINGS_KEY);
  if (!raw) {
    return { eventSortOrder: DEFAULT_EVENT_SORT_ORDER, language: DEFAULT_APP_LANGUAGE };
  }

  try {
    const parsed = JSON.parse(raw);
    if (isAppSettings(parsed)) {
      return parsed;
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const item = parsed as Record<string, unknown>;
      if (isEventSortOrder(item.eventSortOrder)) {
        return {
          eventSortOrder: item.eventSortOrder,
          language: isAppLanguage(item.language) ? item.language : DEFAULT_APP_LANGUAGE,
        };
      }
    }
  } catch {
    return { eventSortOrder: DEFAULT_EVENT_SORT_ORDER, language: DEFAULT_APP_LANGUAGE };
  }

  return { eventSortOrder: DEFAULT_EVENT_SORT_ORDER, language: DEFAULT_APP_LANGUAGE };
};

export const saveAppSettings = (settings: AppSettings): void => {
  window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
};

const compareDateDesc = (left: string | null, right: string | null): number => {
  const leftTime = left ? new Date(left).getTime() : -Infinity;
  const rightTime = right ? new Date(right).getTime() : -Infinity;
  return rightTime - leftTime;
};

export const sortEvents = (events: EventItem[], sortOrder: EventSortOrder): EventItem[] => {
  const nextEvents = [...events];

  switch (sortOrder) {
    case 'recentlyTriggeredDesc':
      return nextEvents.sort((left, right) => {
        const byLastTriggered = compareDateDesc(
          getLastTriggeredAt(left.history),
          getLastTriggeredAt(right.history),
        );
        if (byLastTriggered !== 0) {
          return byLastTriggered;
        }

        return compareDateDesc(left.createdAt, right.createdAt);
      });
    case 'nameAsc':
      return nextEvents.sort((left, right) =>
        left.name.localeCompare(right.name, 'ja'),
      );
    case 'createdAtDesc':
    default:
      return nextEvents.sort((left, right) => compareDateDesc(left.createdAt, right.createdAt));
  }
};
