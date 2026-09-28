// ============================================================
// Centralized Meal Schedule Logic
// All meal period rules live here — do not duplicate elsewhere
// Business timezone: Asia/Colombo
// ============================================================

import type { MoodOption } from './types';

export const BUSINESS_TIMEZONE = 'Asia/Colombo';

export interface MealPeriod {
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  displayStart: string;
  displayEnd: string;
}

export const MEAL_PERIODS: MealPeriod[] = [
  {
    name: 'Breakfast',
    startHour: 7,
    startMinute: 0,
    endHour: 10,
    endMinute: 30,
    displayStart: '7:00 AM',
    displayEnd: '10:30 AM',
  },
  {
    name: 'Lunch',
    startHour: 12,
    startMinute: 0,
    endHour: 14,
    endMinute: 30,
    displayStart: '12:00 PM',
    displayEnd: '2:30 PM',
  },
  {
    name: 'Evening Snack',
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
