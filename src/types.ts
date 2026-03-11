export type TargetIntervalUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

export type TargetInterval = {
  value: number;
  unit: TargetIntervalUnit;
};

export type AppLanguage = 'ja' | 'en';

export type EventSortOrder = 'recentlyTriggeredDesc' | 'createdAtDesc' | 'nameAsc';

export type HistoryEntry = {
  ts: string;
};

export type EventItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
  color: string;
  targetInterval: TargetInterval | null;
};
