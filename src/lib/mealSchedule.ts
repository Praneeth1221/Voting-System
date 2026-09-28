// ============================================================
// Centralized Meal Schedule Logic
// All meal period rules live here — do not duplicate elsewhere
// Business timezone: Asia/Colombo
// ============================================================

import type { MoodOption } from './types';

export const BUSINESS_TIMEZONE = 'Asia/Colombo';

// ============================================================
// MEAL DISPLAY NAMES — Edit these to change what employees see
// The keys must match the database meal identifiers exactly.
// The values are presentation-only and can be freely changed.
// ============================================================
export const MEAL_DISPLAY_NAMES: Record<string, string> = {
  'Breakfast': 'උදෑසන ආහාරය',
  'Lunch': 'දිවා ආහාරය',
  'Evening Snack': 'සවස ආහාරය',
};

/**
 * Convert a database meal key to its frontend display name.
 * Falls back to the raw key if no mapping is defined.
 */
export function getMealDisplayName(dbMealKey: string): string {
  return MEAL_DISPLAY_NAMES[dbMealKey] || dbMealKey;
}

export interface MealPeriod {
  /** Database identifier — do NOT change */
  key: string;
  /** Display name — controlled by MEAL_DISPLAY_NAMES */
  displayName: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  displayStart: string;
  displayEnd: string;
}

export const MEAL_PERIODS: MealPeriod[] = [
  {
    key: 'Breakfast',
    displayName: getMealDisplayName('Breakfast'),
    startHour: 7,
    startMinute: 0,
    endHour: 10,
    endMinute: 30,
    displayStart: '7:00 AM',
    displayEnd: '10:30 AM',
  },
  {
    key: 'Lunch',
    displayName: getMealDisplayName('Lunch'),
    startHour: 12,
    startMinute: 0,
    endHour: 14,
    endMinute: 30,
    displayStart: '12:00 PM',
    displayEnd: '2:30 PM',
  },
  {
    key: 'Evening Snack',
    displayName: getMealDisplayName('Evening Snack'),
    startHour: 17,
    startMinute: 0,
    endHour: 19,
    endMinute: 0,
    displayStart: '5:00 PM',
    displayEnd: '7:00 PM',
  },
];

export const MOOD_OPTIONS: MoodOption[] = [
  {
    mood: 'very_happy',
    emoji: '😄',
    label: 'Very Happy',
    percentage: '100%',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    hoverColor: 'rgba(16, 185, 129, 0.2)',
  },
  {
    mood: 'happy',
    emoji: '😊',
    label: 'Happy',
    percentage: '75%',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    hoverColor: 'rgba(59, 130, 246, 0.2)',
  },
  {
    mood: 'normal',
    emoji: '😐',
    label: 'Normal',
    percentage: '50%',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    hoverColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    mood: 'sad',
    emoji: '😞',
    label: 'Sad',
    percentage: '25%',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    hoverColor: 'rgba(239, 68, 68, 0.2)',
  },
];

/**
 * Find the active meal period for given hour:minute.
 * Used for client-side display hints only — server validates authoritatively.
 */
export function findActiveMealPeriod(hour: number, minute: number): MealPeriod | null {
  const timeInMinutes = hour * 60 + minute;

  for (const period of MEAL_PERIODS) {
    const start = period.startHour * 60 + period.startMinute;
    const end = period.endHour * 60 + period.endMinute;
    if (timeInMinutes >= start && timeInMinutes < end) {
      return period;
    }
  }

  return null;
}

/**
 * Get the next upcoming meal period (for display when voting is closed).
 */
export function getNextMealPeriod(hour: number, minute: number): MealPeriod | null {
  const timeInMinutes = hour * 60 + minute;

  for (const period of MEAL_PERIODS) {
    const start = period.startHour * 60 + period.startMinute;
    if (timeInMinutes < start) {
      return period;
    }
  }

  // After all meals today, next is breakfast tomorrow
  return MEAL_PERIODS[0];
}

/**
 * Format a time string (HH:MM:SS) to 12-hour display
 */
export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}
