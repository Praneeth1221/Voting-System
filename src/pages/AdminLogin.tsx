import { useState } from 'react';
import { LogIn, UtensilsCrossed, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function AdminLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 
      dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20
      flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40">
            <UtensilsCrossed className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Sign in to manage meal feedback
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl 
            border border-slate-200/60 dark:border-slate-700/60 p-6 space-y-5"
        >
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 
              text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-700/50
                text-slate-800 dark:text-white
                placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all duration-200"
              placeholder="admin@company.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-700/50
                text-slate-800 dark:text-white
                placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white
              bg-indigo-500 hover:bg-indigo-600
              shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
              transition-all duration-200
              disabled:opacity-70 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 
              dark:hover:text-indigo-400 transition-colors"
          >
            ← Back to meal feedback
          </a>
        </div>
      </div>
    </div>
  );
}
