import type { AppLanguage, HistoryEntry, TargetInterval, TargetIntervalUnit } from '../types';

const LOCALES: Record<AppLanguage, string> = {
  ja: 'ja-JP',
  en: 'en-US',
};

const getDateTimeFormatter = (language: AppLanguage) =>
  new Intl.DateTimeFormat(LOCALES[language], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const getMonthFormatter = (language: AppLanguage) =>
  new Intl.DateTimeFormat(LOCALES[language], {
    year: 'numeric',
    month: 'long',
  });

const getShortDayFormatter = (language: AppLanguage) =>
  new Intl.DateTimeFormat(LOCALES[language], {
    month: 'numeric',
    day: 'numeric',
  });

const formatDurationFromMinutes = (totalMinutes: number, language: AppLanguage): string => {
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (language === 'en') {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return `${days}日 ${hours}時間 ${minutes}分`;
};

export const formatDurationBetweenDates = (
  newerValue: string,
  olderValue: string,
  language: AppLanguage,
): string => {
  const newer = new Date(newerValue);
  const older = new Date(olderValue);

  if (Number.isNaN(newer.getTime()) || Number.isNaN(older.getTime())) {
    return language === 'en' ? 'Not recorded' : '未記録';
  }

  const totalMinutes = Math.max(0, Math.floor((newer.getTime() - older.getTime()) / 60000));
  return formatDurationFromMinutes(totalMinutes, language);
};

const TARGET_INTERVAL_LABELS: Record<AppLanguage, Record<TargetIntervalUnit, string>> = {
  ja: {
    seconds: '秒',
    minutes: '分',
    hours: '時間',
    days: '日',
    weeks: '週',
    months: 'か月',
  },
  en: {
    seconds: 's',
    minutes: 'm',
    hours: 'h',
    days: 'd',
    weeks: 'w',
    months: 'mo',
  },
};

const formatDurationFromSeconds = (totalSeconds: number, language: AppLanguage): string => {
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  if (language === 'en') {
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  if (days > 0) {
    return `${days}日 ${hours}時間 ${minutes}分`;
  }

  if (hours > 0) {
    return `${hours}時間 ${minutes}分 ${seconds}秒`;
  }

  if (minutes > 0) {
    return `${minutes}分 ${seconds}秒`;
  }

  return `${seconds}秒`;
};

const getElapsedMsFromValue = (value: string | null, now: Date): number | null => {
  if (!value) {
    return null;
  }

  const start = new Date(value);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  return Math.max(0, now.getTime() - start.getTime());
};

const getHistoryTimestamps = (history: HistoryEntry[]): string[] => history.map((entry) => entry.ts);

const addTargetInterval = (base: Date, targetInterval: TargetInterval): Date => {
  const due = new Date(base);

  switch (targetInterval.unit) {
    case 'seconds':
      due.setSeconds(due.getSeconds() + targetInterval.value);
      break;
    case 'minutes':
      due.setMinutes(due.getMinutes() + targetInterval.value);
      break;
    case 'hours':
      due.setHours(due.getHours() + targetInterval.value);
      break;
    case 'days':
      due.setDate(due.getDate() + targetInterval.value);
      break;
    case 'weeks':
      due.setDate(due.getDate() + targetInterval.value * 7);
      break;
    case 'months':
      due.setMonth(due.getMonth() + targetInterval.value);
      break;
  }

  return due;
};

const getTargetDurationMs = (history: HistoryEntry[], targetInterval: TargetInterval): number | null => {
  const lastTriggeredAt = getLastTriggeredAt(history);
  if (!lastTriggeredAt) {
    return null;
  }

  const start = new Date(lastTriggeredAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  return Math.max(0, addTargetInterval(start, targetInterval).getTime() - start.getTime());
};

export const getLastTriggeredAt = (history: HistoryEntry[]): string | null =>
  history.length > 0 ? history[history.length - 1].ts : null;

export const formatDateTime = (value: string | null, language: AppLanguage): string => {
  if (!value) {
    return language === 'en' ? 'Not recorded' : '未記録';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return language === 'en' ? 'Not recorded' : '未記録';
  }

  return getDateTimeFormatter(language).format(date);
};

export const formatElapsedTime = (history: HistoryEntry[], now: Date, language: AppLanguage): string => {
  const lastTriggeredAt = getLastTriggeredAt(history);
  if (!lastTriggeredAt) {
    return language === 'en' ? 'Not recorded' : '未記録';
  }

  const diffMs = getElapsedMsFromValue(lastTriggeredAt, now);
  if (diffMs === null) {
    return language === 'en' ? 'Not recorded' : '未記録';
  }

  const totalMinutes = Math.floor(diffMs / 60000);

  return formatDurationFromMinutes(totalMinutes, language);
};

const getIntervalsInMinutes = (history: HistoryEntry[]): number[] =>
  getHistoryTimestamps(history)
    .slice(1)
    .map((current, index) => {
      const previous = new Date(history[index]?.ts ?? '');
      const next = new Date(current);

      if (Number.isNaN(previous.getTime()) || Number.isNaN(next.getTime())) {
        return null;
      }

      return Math.max(0, Math.floor((next.getTime() - previous.getTime()) / 60000));
    })
    .filter((value): value is number => value !== null);

export type EventStats = {
  averageInterval: string;
  shortestInterval: string;
  longestInterval: string;
  recent7DaysCount: number;
};

export type CalendarCell = {
  key: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  hasRecord: boolean;
};

export type TargetProgressState = {
  progressRatio: number | null;
  overflowRatio: number;
};

export type DailyCountPoint = {
  key: string;
  label: string;
  count: number;
};

export const getEventStats = (history: HistoryEntry[], now: Date, language: AppLanguage): EventStats => {
  const intervals = getIntervalsInMinutes(history);
  const recentThreshold = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const recent7DaysCount = history.filter((entry) => {
    const date = new Date(entry.ts);
    return !Number.isNaN(date.getTime()) && date.getTime() >= recentThreshold;
  }).length;

  if (intervals.length === 0) {
    return {
      averageInterval: language === 'en' ? 'Not recorded' : '未記録',
      shortestInterval: language === 'en' ? 'Not recorded' : '未記録',
      longestInterval: language === 'en' ? 'Not recorded' : '未記録',
      recent7DaysCount,
    };
  }

  const average = Math.floor(intervals.reduce((sum, value) => sum + value, 0) / intervals.length);

  return {
    averageInterval: formatDurationFromMinutes(average, language),
    shortestInterval: formatDurationFromMinutes(Math.min(...intervals), language),
    longestInterval: formatDurationFromMinutes(Math.max(...intervals), language),
    recent7DaysCount,
  };
};

export const buildRecentDailyCountSeries = (
  timestamps: string[],
  now: Date,
  language: AppLanguage,
  days = 14,
): DailyCountPoint[] => {
  const counts = new Map<string, number>();

  timestamps.forEach((value) => {
    const key = getLocalDateKey(value);
    if (!key) {
      return;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from({ length: days }, (_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - index));
    const key = getLocalDateKey(current)!;

    return {
      key,
      label: getShortDayFormatter(language).format(current),
      count: counts.get(key) ?? 0,
    };
  });
};

export const getLocalDateKey = (value: Date | string): string | null => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const formatMonthLabel = (date: Date, language: AppLanguage): string => getMonthFormatter(language).format(date);

export const buildCalendarMonth = (month: Date, history: HistoryEntry[]): CalendarCell[] => {
  const start = startOfMonth(month);
  const startWeekday = start.getDay();
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1 - startWeekday);
  const markedDays = new Set(
    history
      .map((entry) => getLocalDateKey(entry.ts))
      .filter((value): value is string => value !== null),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + index);
    const key = getLocalDateKey(current)!;

    return {
      key,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === start.getMonth(),
      hasRecord: markedDays.has(key),
    };
  });
};

export const getContrastTextColor = (hexColor: string): '#111827' | '#ffffff' => {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) {
    return '#ffffff';
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 160 ? '#111827' : '#ffffff';
};

export const brightenHexColor = (hexColor: string, amount = 0.18): string => {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) {
    return hexColor;
  }

  const channels = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((value) =>
    Number.parseInt(value, 16),
  );

  if (channels.some((value) => Number.isNaN(value))) {
    return hexColor;
  }

  const adjusted = channels
    .map((value) => Math.round(value + (255 - value) * amount))
    .map((value) => Math.max(0, Math.min(255, value)))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

  return `#${adjusted}`;
};

export const formatTargetInterval = (targetInterval: TargetInterval | null, language: AppLanguage): string => {
  if (targetInterval === null || targetInterval.value < 0) {
    return language === 'en' ? 'Not set' : '未設定';
  }

  return `${targetInterval.value}${TARGET_INTERVAL_LABELS[language][targetInterval.unit]}`;
};

export const getElapsedMinutes = (history: HistoryEntry[], now: Date): number | null => {
  const lastTriggeredAt = getLastTriggeredAt(history);
  const diffMs = getElapsedMsFromValue(lastTriggeredAt, now);
  if (diffMs === null) {
    return null;
  }

  return Math.floor(diffMs / 60000);
};

export const getTargetIntervalStatus = (
  history: HistoryEntry[],
  targetInterval: TargetInterval | null,
  now: Date,
  language: AppLanguage,
): string => {
  if (targetInterval === null) {
    return language === 'en' ? 'Not set' : '未設定';
  }

  const lastTriggeredAt = getLastTriggeredAt(history);
  const targetLabel = formatTargetInterval(targetInterval, language);

  if (!lastTriggeredAt) {
    return language === 'en' ? `Target ${targetLabel}` : `目標 ${targetLabel}`;
  }

  const start = new Date(lastTriggeredAt);
  if (Number.isNaN(start.getTime())) {
    return language === 'en' ? `Target ${targetLabel}` : `目標 ${targetLabel}`;
  }

  const due = addTargetInterval(start, targetInterval);
  const remainingMs = due.getTime() - now.getTime();

  if (remainingMs > 0) {
    return language === 'en'
      ? `${formatDurationFromSeconds(Math.ceil(remainingMs / 1000), language)} remaining`
      : `あと ${formatDurationFromSeconds(Math.ceil(remainingMs / 1000), language)}`;
  }

  if (remainingMs === 0) {
    return language === 'en' ? 'Right on target' : 'ちょうど目標です';
  }

  return language === 'en'
    ? `${formatDurationFromSeconds(Math.ceil(Math.abs(remainingMs) / 1000), language)} over`
    : `${formatDurationFromSeconds(Math.ceil(Math.abs(remainingMs) / 1000), language)} 超過`;
};


export const getTargetProgressState = (
  history: HistoryEntry[],
  targetInterval: TargetInterval | null,
  now: Date,
): TargetProgressState => {
  if (targetInterval === null) {
    return {
      progressRatio: null,
      overflowRatio: 0,
    };
  }

  const lastTriggeredAt = getLastTriggeredAt(history);
  const elapsedMs = getElapsedMsFromValue(lastTriggeredAt, now);
  if (elapsedMs === null) {
    return {
      progressRatio: 0,
      overflowRatio: 0,
    };
  }

  const targetMs = getTargetDurationMs(history, targetInterval);
  if (targetMs === null || targetMs <= 0) {
    return {
      progressRatio: 1,
      overflowRatio: 1,
    };
  }

  const totalRatio = elapsedMs / targetMs;

  return {
    progressRatio: Math.min(1, totalRatio),
    overflowRatio: totalRatio > 1 ? Math.min(1, totalRatio - 1) : 0,
  };
};
