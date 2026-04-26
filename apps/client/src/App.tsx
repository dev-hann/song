import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from './components/app-layout';
import { AudioProvider } from './context/audio-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { GoogleOAuthProvider } from '@react-oauth/google';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import LikedPage from './pages/LikedPage';
import RecentPage from './pages/RecentPage';
import MelonChartPage from './pages/MelonChartPage';
import LoginPage from './pages/LoginPage';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function ProtectedRoutes({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
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
                <AppRoutes />
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
