import { describe, expect, it } from 'vitest';
import {
  buildRecentDailyCountSeries,
  brightenHexColor,
  buildCalendarMonth,
  formatDateTime,
  formatDurationBetweenDates,
  formatElapsedTime,
  formatTargetInterval,
  getElapsedMinutes,
  getEventStats,
  getLastTriggeredAt,
  getLocalDateKey,
  getTargetProgressState,
  getTargetIntervalStatus,
} from './time';

describe('time utils', () => {
  it('returns 未記録 for missing timestamp', () => {
    expect(formatDateTime(null, 'ja')).toBe('未記録');
    expect(formatElapsedTime([], new Date('2026-03-10T00:00:00.000Z'), 'ja')).toBe('未記録');
  });

  it('formats elapsed time in days hours and minutes', () => {
    const now = new Date('2026-03-10T12:30:00.000Z');
    expect(
      formatElapsedTime([{ ts: '2026-03-09T10:15:00.000Z' }, { ts: '2026-03-10T10:15:00.000Z' }], now, 'ja'),
    ).toBe('0日 2時間 15分');
  });

  it('formats the interval between two history records', () => {
    expect(
      formatDurationBetweenDates('2026-03-09T12:30:00.000Z', '2026-03-06T00:30:00.000Z', 'ja'),
    ).toBe('3日 12時間 0分');
    expect(
      formatDurationBetweenDates('2026-03-09T12:30:00.000Z', '2026-03-09T09:30:00.000Z', 'en'),
    ).toBe('0d 3h 0m');
  });

  it('returns last triggered timestamp from history', () => {
    expect(getLastTriggeredAt([])).toBeNull();
    expect(getLastTriggeredAt([{ ts: '2026-03-01T00:00:00.000Z' }])).toBe('2026-03-01T00:00:00.000Z');
  });

  it('calculates event stats from history', () => {
    const now = new Date('2026-03-10T12:30:00.000Z');
    const stats = getEventStats(
      [
        { ts: '2026-03-03T12:30:00.000Z' },
        { ts: '2026-03-04T12:30:00.000Z' },
        { ts: '2026-03-06T00:30:00.000Z' },
        { ts: '2026-03-09T12:30:00.000Z' },
      ],
      now,
      'ja',
    );

    expect(stats.averageInterval).toBe('2日 0時間 0分');
    expect(stats.shortestInterval).toBe('1日 0時間 0分');
    expect(stats.longestInterval).toBe('3日 12時間 0分');
    expect(stats.recent7DaysCount).toBe(4);
  });

  it('builds calendar marks using local date keys', () => {
    const cells = buildCalendarMonth(new Date('2026-03-01T00:00:00.000Z'), [
      { ts: '2026-03-09T00:30:00.000Z' },
      { ts: '2026-03-09T10:30:00.000Z' },
      { ts: '2026-03-10T01:00:00.000Z' },
    ]);

    expect(getLocalDateKey('2026-03-09T00:30:00.000Z')).toMatch(/^2026-03-0\d$/);
    expect(cells.filter((cell) => cell.hasRecord)).toHaveLength(2);
  });

  it('builds recent daily count series for the last 14 days', () => {
    const series = buildRecentDailyCountSeries(
      ['2026-03-08T00:30:00.000Z', '2026-03-08T10:30:00.000Z', '2026-03-10T01:00:00.000Z'],
      new Date('2026-03-10T12:30:00.000Z'),
      'ja',
    );

    expect(series).toHaveLength(14);
    expect(series.at(-3)).toMatchObject({ count: 2 });
    expect(series.at(-1)).toMatchObject({ count: 1 });
  });

  it('formats target interval and status', () => {
    const now = new Date('2026-03-10T12:30:00.000Z');
    const history = [{ ts: '2026-03-10T10:30:00.000Z' }];

    expect(formatTargetInterval({ value: 3, unit: 'days' }, 'ja')).toBe('3日');
    expect(formatTargetInterval({ value: 30, unit: 'seconds' }, 'ja')).toBe('30秒');
    expect(getElapsedMinutes(history, now)).toBe(120);
    expect(getTargetIntervalStatus(history, { value: 1, unit: 'days' }, now, 'ja')).toBe('あと 22時間 0分 0秒');
    expect(getTargetIntervalStatus(history, { value: 1, unit: 'hours' }, now, 'ja')).toBe(
      '1時間 0分 0秒 超過',
    );
  });

  it('formats English elapsed and target status text', () => {
    const now = new Date('2026-03-10T12:30:00.000Z');
    const history = [{ ts: '2026-03-10T10:30:00.000Z' }];

    expect(formatElapsedTime(history, now, 'en')).toBe('0d 2h 0m');
    expect(formatTargetInterval({ value: 2, unit: 'weeks' }, 'en')).toBe('2w');
    expect(getTargetIntervalStatus(history, { value: 1, unit: 'days' }, now, 'en')).toBe(
      '22h 0m 0s remaining',
    );
  });

  it('splits target progress into first and second laps', () => {
    const now = new Date('2026-03-12T12:00:00.000Z');
    const state = getTargetProgressState([{ ts: '2026-03-10T00:00:00.000Z' }], { value: 1, unit: 'days' }, now);

    expect(state).toEqual({
      progressRatio: 1,
      overflowRatio: 1,
    });
  });

  it('brightens event colors for overflow progress', () => {
    expect(brightenHexColor('#336699', 0.25)).toBe('#668cb3');
    expect(brightenHexColor('invalid')).toBe('invalid');
  });
});
