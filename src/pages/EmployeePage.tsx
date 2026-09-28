import { useState, useCallback } from 'react';
import { UtensilsCrossed, AlertCircle } from 'lucide-react';
import { useCurrentMeal } from '../hooks/useCurrentMeal';
import { supabase } from '../lib/supabase';
import { MOOD_OPTIONS } from '../lib/mealSchedule';
import type { MoodOption, VoteResult } from '../lib/types';
import { MealStatusDisplay } from '../components/MealStatus';
import { MoodCard } from '../components/MoodCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SuccessState } from '../components/SuccessState';
import { VotingClosed } from '../components/VotingClosed';
import { LoadingSpinner } from '../components/LoadingSpinner';

type PageState = 'loading' | 'voting' | 'closed' | 'confirming' | 'submitting' | 'success' | 'error' | 'rejected';

export function EmployeePage() {
  const { mealStatus, loading, error: fetchError, refresh } = useCurrentMeal();
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [confirmedMood, setConfirmedMood] = useState<MoodOption | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determine current display state
  const getDisplayState = (): PageState => {
    if (loading) return 'loading';
    if (fetchError) return 'error';
    if (pageState === 'success') return 'success';
    if (pageState === 'rejected') return 'rejected';
    if (!mealStatus?.is_open) return 'closed';
    if (selectedMood) return 'confirming';
    return 'voting';
  };

  const displayState = getDisplayState();

  const handleMoodSelect = useCallback((option: MoodOption) => {
    setSelectedMood(option);
    setSubmitError(null);
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedMood(null);
    setSubmitError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedMood || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { data, error } = await supabase.rpc('submit_vote', {
        p_mood: selectedMood.mood,
      });

      const result = data as VoteResult;

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        if (result.error?.includes('closed') || result.error?.includes('No active') || result.error?.includes('expired')) {
          setPageState('rejected');
          setSelectedMood(null);
        } else {
          setSubmitError(result.error || 'Vote submission failed');
        }
        return;
      }

      // Success!
      setConfirmedMood(selectedMood);
      setSelectedMood(null);
      setPageState('success');
    } catch (err) {
      console.error('Vote submission error:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMood, isSubmitting]);

  const handleReset = useCallback(() => {
    setSelectedMood(null);
    setConfirmedMood(null);
    setPageState('loading');
    setSubmitError(null);
    refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 
      dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Header */}
      <header className="pt-8 pb-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <UtensilsCrossed className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Meal Feedback
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Loading */}
          {displayState === 'loading' && (
            <LoadingSpinner message="Loading meal information..." />
          )}

          {/* Error */}
          {displayState === 'error' && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
              <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                Connection Error
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                {fetchError}
              </p>
              <button
                onClick={refresh}
                className="mt-4 px-6 py-3 rounded-xl font-semibold text-white
                  bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Voting Closed */}
          {displayState === 'closed' && (
            <VotingClosed currentTime={mealStatus?.current_time} />
          )}

          {/* Rejected (window closed during confirmation) */}
          {displayState === 'rejected' && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
              <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-900/20">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                Voting Period Closed
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                The voting window closed before your feedback could be submitted. 
                Please try again during the next meal period.
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-3 rounded-xl font-semibold text-white
                  bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          )}

          {/* Success — auto-returns after 1.5s */}
          {displayState === 'success' && confirmedMood && (
            <SuccessState option={confirmedMood} onReset={handleReset} />
          )}

          {/* Active Voting / Confirming */}
          {(displayState === 'voting' || displayState === 'confirming') && mealStatus && (
            <div className="space-y-8 pt-4">
              {/* Meal status header — uses code-controlled display name */}
              <MealStatusDisplay
                date={mealStatus.current_date}
                day={mealStatus.day}
                meal={mealStatus.meal!}
                mealStart={mealStatus.meal_start!}
                mealEnd={mealStatus.meal_end!}
                overrideActive={mealStatus.override_active}
              />

              {/* Instruction text */}
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                How was your meal? Tap to share your feedback
              </p>

              {/* Mood grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                {MOOD_OPTIONS.map((option) => (
                  <MoodCard
                    key={option.mood}
                    option={option}
                    onSelect={handleMoodSelect}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {selectedMood && (
            <ConfirmationModal
              option={selectedMood}
              isSubmitting={isSubmitting}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}

          {/* Submit Error Toast */}
          {submitError && (
            <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-slideUp">
              <div className="bg-red-500 text-white px-5 py-4 rounded-xl shadow-xl
                flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{submitError}</p>
                <button
                  onClick={() => setSubmitError(null)}
                  className="ml-auto text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
