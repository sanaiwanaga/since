import type { EventItem } from '../types';
import {
  brightenHexColor,
  getContrastTextColor,
  getLastTriggeredAt,
  getTargetProgressState,
} from './time';

export type EventListItemViewModel = {
  accentBright: string;
  goTextColor: '#111827' | '#ffffff';
  lastTriggeredAt: string | null;
  progressRatio: number | null;
  progressDegrees: number;
  overflowDegrees: number;
};

export const getEventListItemViewModel = (
  event: EventItem,
  now: Date,
): EventListItemViewModel => {
  const { progressRatio, overflowRatio } = getTargetProgressState(event.history, event.targetInterval, now);

  return {
    accentBright: brightenHexColor(event.color, 0.24),
    goTextColor: getContrastTextColor(event.color),
    lastTriggeredAt: getLastTriggeredAt(event.history),
    progressRatio,
    progressDegrees: progressRatio === null ? 0 : Math.round(progressRatio * 360),
    overflowDegrees: Math.round(overflowRatio * 360),
  };
};
