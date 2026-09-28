import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MealStatus } from '../lib/types';

export function useCurrentMeal() {
  const [mealStatus, setMealStatus] = useState<MealStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMealStatus = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_current_meal_status');

      if (rpcError) {
        throw rpcError;
      }

      setMealStatus(data as MealStatus);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch meal status:', err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMealStatus();

    // Refresh every 15 seconds — ensures override expiry
    // and meal window transitions are detected promptly
    const interval = setInterval(fetchMealStatus, 15000);

    return () => clearInterval(interval);
  }, [fetchMealStatus]);

  return { mealStatus, loading, error, refresh: fetchMealStatus };
}
