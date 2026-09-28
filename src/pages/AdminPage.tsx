import { useAuth } from '../hooks/useAuth';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function AdminPage() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 
        dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
