import { Clock, CalendarDays } from 'lucide-react';
import { getMealDisplayName } from '../lib/mealSchedule';

interface MealStatusDisplayProps {
  date: string;
  day: string;
  meal: string;
  mealStart: string;
  mealEnd: string;
  overrideActive?: boolean;
}

export function MealStatusDisplay({
  date,
  day,
  meal,
  mealStart,
  mealEnd,
  overrideActive,
}: MealStatusDisplayProps) {
  // Format the date nicely
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format times for display
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  };

  // Use code-controlled display name instead of database value
  const displayMealName = getMealDisplayName(meal);

  return (
    <div className="text-center space-y-3">
      {/* Date & Day */}
      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <CalendarDays className="w-4 h-4" />
        <span className="text-sm font-medium">
          {formattedDate} • {day}
        </span>
      </div>

      {/* Meal Title — uses frontend display name */}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
        {displayMealName}
      </h2>

      {/* Schedule */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
        bg-indigo-50 dark:bg-indigo-900/30 
        text-indigo-600 dark:text-indigo-400">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-semibold">
          {formatTime(mealStart)} — {formatTime(mealEnd)}
        </span>
      </div>

      {/* Override indicator */}
      {overrideActive && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
          bg-amber-50 dark:bg-amber-900/20 
          text-amber-600 dark:text-amber-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Testing Mode
        </div>
      )}
    </div>
  );
}
