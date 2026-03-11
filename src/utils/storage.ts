import type { EventItem, HistoryEntry, TargetInterval, TargetIntervalUnit } from '../types';

export const STORAGE_KEY = 'since.events';
export const LEGACY_STORAGE_KEY = 'elapsed-time-tracker.events';

type LegacyEventItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt: string | null;
  targetIntervalMinutes?: number | null;
};

type MinutesEventItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  history: string[];
  color: string;
  targetIntervalMinutes: number | null;
};

type DaysEventItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  history: string[];
  color: string;
  targetIntervalDays: number | null;
};

type ModernHistoryEventItem = Omit<EventItem, 'history'> & {
  history: HistoryEntry[];
};

type StringHistoryEventItem = Omit<EventItem, 'history'> & {
  history: string[];
};

export const DEFAULT_EVENT_COLOR = '#ea580c';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return typeof item.ts === 'string';
};

const isHistoryEntryArray = (value: unknown): value is HistoryEntry[] =>
  Array.isArray(value) && value.every((item) => isHistoryEntry(item));

const toHistoryEntries = (history: string[]): HistoryEntry[] => history.map((ts) => ({ ts }));

const isTargetIntervalUnit = (value: unknown): value is TargetIntervalUnit =>
  value === 'seconds' ||
  value === 'minutes' ||
  value === 'hours' ||
  value === 'days' ||
  value === 'weeks' ||
  value === 'months';

const isTargetInterval = (value: unknown): value is TargetInterval => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.value === 'number' &&
    Number.isFinite(item.value) &&
    item.value >= 0 &&
    isTargetIntervalUnit(item.unit)
  );
};

const isModernHistoryEventItem = (value: unknown): value is ModernHistoryEventItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    isHistoryEntryArray(item.history) &&
    typeof item.color === 'string' &&
    (item.targetInterval === null || isTargetInterval(item.targetInterval))
  );
};

const isStringHistoryEventItem = (value: unknown): value is StringHistoryEventItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    isStringArray(item.history) &&
    typeof item.color === 'string' &&
    (item.targetInterval === null || isTargetInterval(item.targetInterval))
  );
};

const isLegacyEventItem = (value: unknown): value is LegacyEventItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    (typeof item.lastTriggeredAt === 'string' || item.lastTriggeredAt === null)
  );
};

const isMinutesEventItem = (value: unknown): value is MinutesEventItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    isStringArray(item.history) &&
    typeof item.color === 'string' &&
    (typeof item.targetIntervalMinutes === 'number' || item.targetIntervalMinutes === null)
  );
};

const isDaysEventItem = (value: unknown): value is DaysEventItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    isStringArray(item.history) &&
    typeof item.color === 'string' &&
    (typeof item.targetIntervalDays === 'number' || item.targetIntervalDays === null)
  );
};

const normalizeEventItem = (value: unknown): EventItem | null => {
  if (isModernHistoryEventItem(value)) {
    return value;
  }

  if (isStringHistoryEventItem(value)) {
    return {
      ...value,
      history: toHistoryEntries(value.history),
    };
  }

  if (isDaysEventItem(value)) {
    return {
      id: value.id,
      name: value.name,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      history: toHistoryEntries(value.history),
      color: value.color,
      targetInterval:
        typeof value.targetIntervalDays === 'number'
          ? {
              value: value.targetIntervalDays,
              unit: 'days',
            }
          : null,
    };
  }

  if (isMinutesEventItem(value)) {
    return {
      id: value.id,
      name: value.name,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      history: toHistoryEntries(value.history),
      color: value.color,
      targetInterval:
        typeof value.targetIntervalMinutes === 'number'
          ? {
              value: Math.max(1, value.targetIntervalMinutes),
              unit: 'minutes',
            }
          : null,
    };
  }

  if (isLegacyEventItem(value)) {
    return {
      id: value.id,
      name: value.name,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      history: value.lastTriggeredAt ? [{ ts: value.lastTriggeredAt }] : [],
      color: DEFAULT_EVENT_COLOR,
      targetInterval:
        typeof value.targetIntervalMinutes === 'number'
          ? {
              value: Math.max(0, value.targetIntervalMinutes),
              unit: 'minutes',
            }
          : null,
    };
  }

  return null;
};

export const parseEventsData = (value: unknown): EventItem[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map(normalizeEventItem)
    .filter((item): item is EventItem => item !== null);

  return normalized.length === value.length ? normalized : null;
};

export const parseEventsJson = (raw: string): EventItem[] | null => {
  try {
    return parseEventsData(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const loadEvents = (): EventItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return parseEventsJson(raw) ?? [];
  } catch {
    return [];
  }
};

export const saveEvents = (events: EventItem[]): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
};

export const exportEventsJson = (events: EventItem[]): string =>
  JSON.stringify(events, null, 2);
