import { CheckCircle2 } from 'lucide-react';
import type { MoodOption } from '../lib/types';

interface SuccessStateProps {
  option: MoodOption;
  onReset: () => void;
}

export function SuccessState({ option, onReset }: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 animate-fadeIn">
      {/* Success icon */}
      <div className="relative">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center animate-scaleIn"
          style={{ backgroundColor: option.bgColor }}
        >
          <CheckCircle2
            className="w-12 h-12"
            style={{ color: option.color }}
          />
        </div>
      </div>

      {/* Emoji */}
      <span className="text-6xl">{option.emoji}</span>

      {/* Message */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
          Thank you!
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Your <span className="font-semibold" style={{ color: option.color }}>{option.label}</span> feedback has been recorded.
        </p>
      </div>

      {/* Vote again button */}
      <button
        onClick={onReset}
        className="mt-4 px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300
          bg-slate-100 dark:bg-slate-700/50
          hover:bg-slate-200 dark:hover:bg-slate-700
          transition-colors duration-200"
      >
        Submit another vote
      </button>
    </div>
  );
}
