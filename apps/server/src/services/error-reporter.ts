import crypto from 'crypto';
import { createIssue, findOpenIssue, addComment, reopenIssue } from './github-issues.js';

interface ErrorContext {
  source: 'server' | 'client';
  route?: string;
  method?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorCacheEntry {
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  issueNumber?: number;
}

const errorCache = new Map<string, ErrorCacheEntry>();
const MAX_ISSUES_PER_HOUR = 10;
const CACHE_TTL = 24 * 60 * 60 * 1000;
let issuesThisHour = 0;
let lastHourReset = Date.now();

function evictExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of errorCache) {
    if (now - entry.lastSeen.getTime() > CACHE_TTL) {
      errorCache.delete(key);
    }
  }
}

function generateFingerprint(message: string, route?: string): string {
  const content = `${message}::${route || 'unknown'}`;
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
}

function generateTitle(message: string, source: string, route?: string): string {
  const routePart = route ? ` (${route})` : '';
  return `[ERROR] ${message.substring(0, 80)}${routePart}`;
}

function generateBody(
  message: string,
  stack: string | undefined,
  context: ErrorContext,
  occurrenceCount: number,
): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [
    '## Error Details',
    `- **Message**: ${message}`,
    `- **Source**: ${context.source}`,
    `- **Route**: ${context.method || 'UNKNOWN'} ${context.route || 'unknown'}`,
    `- **Timestamp**: ${timestamp}`,
    `- **Occurrences**: ${occurrenceCount}회`,
    '',
  ];

  if (context.userAgent) {
    lines.push(`- **User-Agent**: ${context.userAgent}`, '');
  }

  if (stack) {
    lines.push('## Stack Trace', '```', stack.substring(0, 2000), '```', '');
  }

  if (context.metadata && Object.keys(context.metadata).length > 0) {
    lines.push('## Additional Context', '```json', JSON.stringify(context.metadata, null, 2).substring(0, 1000), '```', '');
  }

  return lines.join('\n');
}

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastHourReset >= 3600000) {
    issuesThisHour = 0;
    lastHourReset = now;
  }
  if (issuesThisHour >= MAX_ISSUES_PER_HOUR) return false;
  issuesThisHour++;
  return true;
}

export async function reportError(
  error: Error | { message: string; stack?: string },
  context: ErrorContext,
): Promise<void> {
  const message = error.message || 'Unknown error';
  const stack = 'stack' in error ? error.stack : undefined;
  const fingerprint = generateFingerprint(message, context.route);
  const title = generateTitle(message, context.source, context.route);
  const labels = ['bug', 'auto-reported', context.source === 'server' ? 'server-error' : 'client-error'];

  const cached = errorCache.get(fingerprint);

  if (cached) {
    cached.count++;
    cached.lastSeen = new Date();

    if (cached.issueNumber) {
      const body = `**동일 에러 재발생** (${cached.count}회)\n- Timestamp: ${new Date().toISOString()}\n- Route: ${context.method || ''} ${context.route || ''}`;
      await addComment(cached.issueNumber, body);
    }
    return;
  }

  const cacheEntry: ErrorCacheEntry = {
    count: 1,
    firstSeen: new Date(),
    lastSeen: new Date(),
  };
  errorCache.set(fingerprint, cacheEntry);

  if (errorCache.size > 200) {
    evictExpiredEntries();
  }

  if (!checkRateLimit()) {
    console.warn('[ErrorReporter] Rate limit reached, skipping GitHub Issue creation');
    return;
  }

  const existing = await findOpenIssue(title);

  if (existing) {
    cacheEntry.issueNumber = existing.number;

    if (existing.state === 'closed') {
      await reopenIssue(existing.number);
    }

    const body = `**에러 재발생**\n- Timestamp: ${new Date().toISOString()}\n- Route: ${context.method || ''} ${context.route || ''}\n- Stack:\n\`\`\`\n${(stack || '').substring(0, 500)}\n\`\`\``;
    await addComment(existing.number, body);
  } else {
    const body = generateBody(message, stack, context, 1);
    const result = await createIssue(title, body, labels);
    if (result) {
      cacheEntry.issueNumber = result.number;
    }
  }
}
