import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { MoodOption } from '../lib/types';

interface SuccessStateProps {
  option: MoodOption;
  onReset: () => void;
}

export function SuccessState({ option, onReset }: SuccessStateProps) {
  // Auto-return to voting dashboard after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onReset();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onReset]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 animate-fadeIn">
      {/* Success icon */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center animate-scaleIn"
          style={{ backgroundColor: option.bgColor }}
        >
          <CheckCircle2
            className="w-14 h-14"
            style={{ color: option.color }}
          />
        </div>
      </div>

      {/* Message */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
          Thank you!
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-base">
          Your feedback has been recorded
        </p>
      </div>
    </div>
  );
}
