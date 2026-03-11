import { useEffect, useState } from 'react';
import type { EventItem, TargetInterval } from '../types';
import { DEFAULT_EVENT_COLOR, loadEvents, saveEvents } from '../utils/storage';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useEvents = () => {
  const [events, setEvents] = useState<EventItem[]>(() => loadEvents());

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const createEvent = (
    name: string,
    color = DEFAULT_EVENT_COLOR,
    targetInterval: TargetInterval | null = null,
  ) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return false;
    }

    const now = new Date().toISOString();
    setEvents((current) => [
      {
        id: createId(),
        name: trimmedName,
        createdAt: now,
        updatedAt: now,
        history: [],
        color,
        targetInterval,
      },
      ...current,
    ]);
    return true;
  };

  const updateEvent = (id: string, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return false;
    }

    setEvents((current) =>
      current.map((event) =>
        event.id === id
          ? {
              ...event,
              name: trimmedName,
              updatedAt: new Date().toISOString(),
            }
          : event,
      ),
    );
    return true;
  };

  const deleteEvent = (id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  const triggerEvent = (id: string) => {
    const now = new Date().toISOString();
    setEvents((current) =>
      current.map((event) =>
        event.id === id
          ? {
              ...event,
              history: [...event.history, { ts: now }],
              updatedAt: now,
            }
          : event,
      ),
    );
  };

  const replaceEvents = (nextEvents: EventItem[]) => {
    setEvents(nextEvents);
  };

  const updateEventTargetInterval = (id: string, targetInterval: TargetInterval | null) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === id
          ? {
              ...event,
              targetInterval,
              updatedAt: new Date().toISOString(),
            }
          : event,
      ),
    );
  };

  return {
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    triggerEvent,
    replaceEvents,
    updateEventTargetInterval,
  };
};
