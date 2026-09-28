import { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Download,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { exportToExcel } from '../utils/excelExport';
import type { MealRecord } from '../lib/types';
import { format } from 'date-fns';

const PAGE_SIZE = 30; // 10 days × 3 meals per page

export function AdminDashboard() {
  const { signOut } = useAuth();
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('meal_records')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Get paginated records
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchErr } = await supabase
        .from('meal_records')
        .select('*')
        .order('date', { ascending: false })
        .order('scheduled_start', { ascending: true })
        .range(from, to);

      if (fetchErr) throw fetchErr;
      setRecords(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch ALL records for export
      const { data, error: fetchErr } = await supabase
        .from('meal_records')
        .select('*')
        .order('date', { ascending: true })
        .order('scheduled_start', { ascending: true });

      if (fetchErr) throw fetchErr;
      exportToExcel(data || []);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatLastVoteTime = (timeStr: string | null): string => {
    if (!timeStr) return '—';
    try {
      return format(new Date(timeStr), 'HH:mm:ss');
    } catch {
      return '—';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 
      dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 
        dark:border-slate-700/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <UtensilsCrossed className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Meal Feedback History
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={exporting || totalCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                bg-emerald-500 hover:bg-emerald-600 text-white
                shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                bg-slate-100 dark:bg-slate-800 
                text-slate-600 dark:text-slate-300
                hover:bg-slate-200 dark:hover:bg-slate-700
                transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 
            text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totalCount} total records
          </p>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl 
          border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Main meal
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    😄 Very Happy
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    😊 Happy
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    😐 Normal
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    😞 Sad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-slate-500 dark:text-slate-400">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400">
                      No meal records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {record.date}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {record.day}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {record.meal}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                        {formatLastVoteTime(record.last_vote_time)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-sm font-bold
                          bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                          {record.very_happy_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-sm font-bold
                          bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          {record.happy_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-sm font-bold
                          bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                          {record.normal_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-sm font-bold
                          bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                          {record.sad_count}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-4
              flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
