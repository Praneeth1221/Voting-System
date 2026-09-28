import type { MoodOption } from '../lib/types';

interface MoodCardProps {
  option: MoodOption;
  onSelect: (option: MoodOption) => void;
  disabled?: boolean;
}

export function MoodCard({ option, onSelect, disabled }: MoodCardProps) {
  return (
    <button
      onClick={() => onSelect(option)}
      disabled={disabled}
      className="group relative flex flex-col items-center justify-center gap-3 p-6 sm:p-8 
        rounded-2xl border-2 border-slate-200/60 dark:border-slate-700/60
        bg-white dark:bg-slate-800/50 
        hover:border-opacity-100 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
        hover:-translate-y-1 
        active:translate-y-0 active:shadow-md
        transition-all duration-200 ease-out
        cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
        min-w-[140px] sm:min-w-[160px]"
      style={{
        borderColor: disabled ? undefined : option.color + '30',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = option.color + '80';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = option.bgColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = option.color + '30';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
        }
      }}
    >
      {/* Emoji */}
      <span className="text-5xl sm:text-6xl transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
        {option.emoji}
      </span>

      {/* Percentage badge */}
      <span
        className="text-sm font-bold px-3 py-1 rounded-full"
        style={{
          backgroundColor: option.bgColor,
          color: option.color,
        }}
      >
        {option.percentage}
      </span>

      {/* Label */}
      <span className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200">
        {option.label}
      </span>
    </button>
  );
}
