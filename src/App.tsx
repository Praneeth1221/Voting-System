import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { EmployeePage } from './pages/EmployeePage';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy-load admin page to reduce initial bundle size (xlsx is large)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeePage />} />
        <Route
          path="/admin"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
                  <LoadingSpinner message="Loading admin dashboard..." />
                </div>
              }
            >
              <AdminPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
