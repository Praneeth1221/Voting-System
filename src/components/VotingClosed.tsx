import { Clock, Moon, Coffee, Sun } from 'lucide-react';
import { MEAL_PERIODS } from '../lib/mealSchedule';

interface VotingClosedProps {
  currentTime?: string;
}

export function VotingClosed({ currentTime }: VotingClosedProps) {
  // Determine which icon/message to show based on approximate time
  let icon = <Moon className="w-16 h-16 text-indigo-400" />;
  let message = 'Voting is currently closed';
  let subMessage = 'Please come back during a meal period';

  if (currentTime) {
    const parts = currentTime.split(':');
    const hour = parseInt(parts[0], 10);

    if (hour >= 0 && hour < 7) {
      icon = <Moon className="w-16 h-16 text-indigo-400" />;
      message = 'Good Morning!';
      subMessage = `Breakfast voting opens at ${MEAL_PERIODS[0].displayStart}`;
    } else if (hour >= 10 && hour < 12) {
      icon = <Coffee className="w-16 h-16 text-amber-500" />;
      message = 'Breakfast voting has ended';
      subMessage = `Lunch voting opens at ${MEAL_PERIODS[1].displayStart}`;
    } else if (hour >= 14 && hour < 17) {
      icon = <Sun className="w-16 h-16 text-orange-400" />;
      message = 'Lunch voting has ended';
      subMessage = `Evening Snack voting opens at ${MEAL_PERIODS[2].displayStart}`;
    } else if (hour >= 19) {
      icon = <Moon className="w-16 h-16 text-indigo-400" />;
      message = 'All meals for today are complete';
      subMessage = `Breakfast voting opens tomorrow at ${MEAL_PERIODS[0].displayStart}`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center px-4">
      {/* Icon with subtle animation */}
      <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse">
        {icon}
      </div>

      {/* Clock icon */}
      <div className="flex items-center gap-2 text-slate-400">
        <Clock className="w-5 h-5" />
        <span className="text-sm font-medium">Voting Schedule</span>
      </div>

      {/* Message */}
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-200">
        {message}
      </h2>
      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md">
        {subMessage}
      </p>

      {/* Schedule display */}
      <div className="mt-6 w-full max-w-sm space-y-3">
        {MEAL_PERIODS.map((period) => (
          <div
            key={period.name}
            className="flex items-center justify-between px-5 py-3.5 rounded-xl
              bg-white dark:bg-slate-800/50 
              border border-slate-200/60 dark:border-slate-700/60
              shadow-sm"
          >
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {period.name}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {period.displayStart} – {period.displayEnd}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
