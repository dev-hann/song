// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockPush = vi.fn();
const mockUseSession = vi.fn();
const mockUseTheme = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: mockPush }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
  mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: vi.fn() });
});

describe('SettingsPage', () => {
  it('displays version from NEXT_PUBLIC_APP_VERSION', async () => {
    const original = process.env.NEXT_PUBLIC_APP_VERSION;
    process.env.NEXT_PUBLIC_APP_VERSION = '2.5.0';

    const { default: Page } = await import('../page');
    render(<Page />, { wrapper: createWrapper() });

    expect(screen.getByText('2.5.0')).toBeInTheDocument();

    process.env.NEXT_PUBLIC_APP_VERSION = original;
  });

  it('falls back to default version when env is not set', async () => {
    const original = process.env.NEXT_PUBLIC_APP_VERSION;
    delete process.env.NEXT_PUBLIC_APP_VERSION;

    const { default: Page } = await import('../page');
    render(<Page />, { wrapper: createWrapper() });

    expect(screen.getByText('0.1.0')).toBeInTheDocument();

    process.env.NEXT_PUBLIC_APP_VERSION = original;
  });

  it('renders 버전 label in the 정보 section', async () => {
    const { default: Page } = await import('../page');
    render(<Page />, { wrapper: createWrapper() });

    expect(screen.getByText('버전')).toBeInTheDocument();
  });

  it('renders 정보 section heading', async () => {
    const { default: Page } = await import('../page');
    render(<Page />, { wrapper: createWrapper() });

    expect(screen.getByText('정보')).toBeInTheDocument();
  });
});
