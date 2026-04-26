import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from './components/app-layout';
import { AudioProvider } from './context/audio-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { lazy, Suspense, Component, type ReactNode } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const PlaylistDetailPage = lazy(() => import('./pages/PlaylistDetailPage'));
const LikedPage = lazy(() => import('./pages/LikedPage'));
const RecentPage = lazy(() => import('./pages/RecentPage'));
const MelonChartPage = lazy(() => import('./pages/MelonChartPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
          <h2>문제가 발생했습니다</h2>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoutes({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#666' }}>
      로딩 중...
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoutes>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                  <Route path="/liked" element={<LikedPage />} />
                  <Route path="/recent" element={<RecentPage />} />
                  <Route path="/chart" element={<MelonChartPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoutes>
          }
        />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <AudioProvider>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    style: {
                      background: '#1c1c1e',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.08)',
                    },
                  }}
                />
              </AudioProvider>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
