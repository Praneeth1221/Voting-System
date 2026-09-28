import { X, Loader2 } from 'lucide-react';
import type { MoodOption } from '../lib/types';

interface ConfirmationModalProps {
  option: MoodOption;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  option,
  isSubmitting,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={!isSubmitting ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl 
        w-full max-w-sm p-8 animate-scaleIn
        border border-slate-200/50 dark:border-slate-700/50">
        
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full 
            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-700
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Emoji */}
          <span className="text-7xl animate-bounceIn">{option.emoji}</span>

          {/* Label */}
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {option.label}
          </h3>

          {/* Percentage */}
          <span
            className="text-lg font-bold px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: option.bgColor,
              color: option.color,
            }}
          >
            {option.percentage}
          </span>

          {/* Confirmation text */}
          <p className="text-slate-500 dark:text-slate-400 text-base mt-2">
            Confirm your feedback?
          </p>

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-white text-lg
              shadow-lg hover:shadow-xl
              transform hover:-translate-y-0.5 active:translate-y-0
              transition-all duration-200
              disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg
              flex items-center justify-center gap-2"
            style={{
              backgroundColor: option.color,
              boxShadow: `0 8px 24px ${option.color}40`,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'CONFIRM'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
