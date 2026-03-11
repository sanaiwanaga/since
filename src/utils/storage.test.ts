import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_EVENT_COLOR,
  exportEventsJson,
  LEGACY_STORAGE_KEY,
  loadEvents,
  parseEventsJson,
  saveEvents,
  STORAGE_KEY,
} from './storage';

describe('storage utils', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns empty array when no saved data exists', () => {
    expect(loadEvents()).toEqual([]);
  });

  it('saves and loads events', () => {
    const events = [
      {
        id: '1',
        name: 'うんち',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
        history: [],
        color: DEFAULT_EVENT_COLOR,
        targetInterval: null,
      },
    ];

    saveEvents(events);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(loadEvents()).toEqual(events);
  });

  it('ignores malformed data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken');
    expect(loadEvents()).toEqual([]);
  });

  it('migrates legacy lastTriggeredAt data', () => {
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'うんち',
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
          lastTriggeredAt: '2026-03-10T02:00:00.000Z',
        },
      ]),
    );

    expect(loadEvents()).toEqual([
      {
        id: '1',
        name: 'うんち',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
        history: [{ ts: '2026-03-10T02:00:00.000Z' }],
        color: DEFAULT_EVENT_COLOR,
        targetInterval: null,
      },
    ]);
  });

  it('loads events from the legacy storage key and rewrites to the new key on save', () => {
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'legacy-key',
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
          history: [],
          color: DEFAULT_EVENT_COLOR,
          targetInterval: null,
        },
      ]),
    );

    const events = loadEvents();
    expect(events).toHaveLength(1);

    saveEvents(events);

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('exports and parses event data JSON', () => {
    const events = [
      {
        id: '1',
        name: 'うんち',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
        history: [{ ts: '2026-03-10T02:00:00.000Z' }],
        color: '#0f766e',
        targetInterval: { value: 3, unit: 'days' as const },
      },
    ];

    const json = exportEventsJson(events);
    expect(parseEventsJson(json)).toEqual(events);
  });

  it('rejects invalid imported JSON structure', () => {
    expect(parseEventsJson(JSON.stringify({ bad: true }))).toBeNull();
    expect(
      parseEventsJson(
        JSON.stringify([
          {
            id: '1',
            name: 'bad',
            createdAt: '2026-03-10T00:00:00.000Z',
            updatedAt: '2026-03-10T00:00:00.000Z',
            history: [1],
          },
        ]),
      ),
    ).toBeNull();
  });

  it('migrates string-array history into history entry objects', () => {
    expect(
      parseEventsJson(
        JSON.stringify([
          {
            id: '1',
            name: 'string-history',
            createdAt: '2026-03-10T00:00:00.000Z',
            updatedAt: '2026-03-10T00:00:00.000Z',
            history: ['2026-03-10T02:00:00.000Z'],
            color: DEFAULT_EVENT_COLOR,
            targetInterval: { value: 2, unit: 'days' },
          },
        ]),
      ),
    ).toEqual([
      {
        id: '1',
        name: 'string-history',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
        history: [{ ts: '2026-03-10T02:00:00.000Z' }],
        color: DEFAULT_EVENT_COLOR,
        targetInterval: { value: 2, unit: 'days' },
      },
    ]);
  });

  it('migrates day-based and minute-based target intervals', () => {
    expect(
      parseEventsJson(
        JSON.stringify([
          {
            id: '1',
            name: 'old-days',
            createdAt: '2026-03-10T00:00:00.000Z',
            updatedAt: '2026-03-10T00:00:00.000Z',
            history: [],
            color: DEFAULT_EVENT_COLOR,
            targetIntervalDays: 2,
          },
          {
            id: '2',
            name: 'old-minutes',
            createdAt: '2026-03-10T00:00:00.000Z',
            updatedAt: '2026-03-10T00:00:00.000Z',
            history: [],
            color: DEFAULT_EVENT_COLOR,
            targetIntervalMinutes: 90,
          },
        ]),
      ),
    ).toEqual([
      {
        id: '1',
        name: 'old-days',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
        history: [],
        color: DEFAULT_EVENT_COLOR,
        targetInterval: { value: 2, unit: 'days' },
      },
      {
        id: '2',
        name: 'old-minutes',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
        history: [],
        color: DEFAULT_EVENT_COLOR,
        targetInterval: { value: 90, unit: 'minutes' },
      },
    ]);
  });
});
