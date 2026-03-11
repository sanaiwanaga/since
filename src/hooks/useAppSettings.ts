import { useEffect, useState } from 'react';
import type { AppLanguage, EventSortOrder } from '../types';
import {
  DEFAULT_APP_LANGUAGE,
  DEFAULT_EVENT_SORT_ORDER,
  loadAppSettings,
  saveAppSettings,
} from '../utils/appSettings';

export const useAppSettings = () => {
  const [settings, setSettings] = useState(() => loadAppSettings());

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  return {
    eventSortOrder: settings.eventSortOrder ?? DEFAULT_EVENT_SORT_ORDER,
    language: settings.language ?? DEFAULT_APP_LANGUAGE,
    setEventSortOrder: (eventSortOrder: EventSortOrder) =>
      setSettings((current) => ({ ...current, eventSortOrder })),
    setLanguage: (language: AppLanguage) =>
      setSettings((current) => ({ ...current, language })),
  };
};
