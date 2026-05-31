import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockSignIn = vi.fn();
const mockReplace = vi.fn();
const mockUseSession = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...a: unknown[]) => mockSignIn(...a),
  useSession: () => mockUseSession(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
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
});

describe('LoginPage', () => {
  it('renders SONG title and login button', async () => {
    const { default: Page } = await import('../page');
    const { container } = render(<Page />, { wrapper: createWrapper() });

    expect(container.querySelector('h1')?.textContent).toBe('SONG');
    expect(screen.getByText('Google로 계속하기')).toBeInTheDocument();
    expect(screen.getByText('Google 계정으로 로그인하세요')).toBeInTheDocument();
  });

  it('shows loading spinner when session is loading', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    const { default: Page } = await import('../page');
    render(<Page />, { wrapper: createWrapper() });

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /home when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'test@test.com' } },
      status: 'authenticated',
    });
    const { default: Page } = await import('../page');
    render(<Page />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/home');
    });
  });

  it('calls signIn with google on button click', async () => {
    mockSignIn.mockResolvedValue(undefined);
    const { default: Page } = await import('../page');
    const user = userEvent.setup();
    render(<Page />, { wrapper: createWrapper() });

    await user.click(screen.getByText('Google로 계속하기'));

    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/home' });
  });

  it('shows error message when signIn fails', async () => {
    mockSignIn.mockRejectedValue(new Error('fail'));
    const { default: Page } = await import('../page');
    const user = userEvent.setup();
    render(<Page />, { wrapper: createWrapper() });

    await user.click(screen.getByText('Google로 계속하기'));

    await waitFor(() => {
      expect(screen.getByText('로그인에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument();
    });
  });

  it('Google SVG icon has aria-hidden', async () => {
    const { default: Page } = await import('../page');
    render(<Page />, { wrapper: createWrapper() });

    const svg = screen.getByText('Google로 계속하기').closest('button')?.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has safe area padding', async () => {
    const { default: Page } = await import('../page');
    const { container } = render(<Page />, { wrapper: createWrapper() });

    const main = container.firstChild as HTMLElement;
    expect(main.className).toContain('pb-');
  });
});
