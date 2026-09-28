import { Clock, CalendarDays } from 'lucide-react';

interface MealStatusDisplayProps {
  date: string;
  day: string;
  meal: string;
  mealStart: string;
  mealEnd: string;
}

export function MealStatusDisplay({
  date,
  day,
  meal,
  mealStart,
  mealEnd,
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

  return (
    <div className="text-center space-y-3">
      {/* Date & Day */}
      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <CalendarDays className="w-4 h-4" />
        <span className="text-sm font-medium">
          {formattedDate} • {day}
        </span>
      </div>

      {/* Meal Title */}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
        {meal}
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
    </div>
  );
}
