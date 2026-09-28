import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
        <Loader2 className="w-16 h-16 absolute top-0 left-0 animate-spin text-indigo-500" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
}
