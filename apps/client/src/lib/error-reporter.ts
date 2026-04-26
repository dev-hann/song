import { apiFetch } from './api-client';

interface ClientErrorReport {
  message: string;
  stack?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

async function sendErrorReport(report: ClientErrorReport): Promise<void> {
  try {
    const res = await apiFetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!res.ok) {
      console.error('[ErrorReporter] Failed to send error report:', res.status);
    }
  } catch (err) {
    console.error('[ErrorReporter] Network error:', err);
  }
}

export function reportError(
  error: Error | unknown,
  context?: { route?: string; metadata?: Record<string, unknown> },
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error('[Client Error]', message, stack);

  sendErrorReport({
    message,
    stack,
    route: context?.route || window.location.pathname,
    metadata: {
      ...context?.metadata,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
  });
}

export function initErrorReporter(): () => void {
  const handleError = (event: ErrorEvent) => {
    reportError(event.error || new Error(event.message), {
      route: window.location.pathname,
      metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
    event.preventDefault();
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
      route: window.location.pathname,
      metadata: { type: 'unhandledrejection' },
    });
    event.preventDefault();
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}
