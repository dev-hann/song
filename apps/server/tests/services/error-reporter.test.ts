const mockCreateIssue = vi.fn();
const mockFindOpenIssue = vi.fn();
const mockAddComment = vi.fn();
const mockReopenIssue = vi.fn();

vi.mock('../../src/services/github-issues.js', () => ({
  createIssue: mockCreateIssue,
  findOpenIssue: mockFindOpenIssue,
  addComment: mockAddComment,
  reopenIssue: mockReopenIssue,
}));

describe('reportError', () => {
  let reportError: typeof import('../../src/services/error-reporter.js').reportError;

  beforeEach(async () => {
    vi.resetModules();
    mockCreateIssue.mockReset();
    mockFindOpenIssue.mockReset();
    mockAddComment.mockReset();
    mockReopenIssue.mockReset();

    const mod = await import('../../src/services/error-reporter.js');
    reportError = mod.reportError;
  });

  it('creates new issue for first occurrence', async () => {
    mockFindOpenIssue.mockResolvedValue(null);
    mockCreateIssue.mockResolvedValue({ number: 1, url: 'https://github.com/test/repo/issues/1' });

    await reportError(new Error('Something broke'), { source: 'server' });

    expect(mockFindOpenIssue).toHaveBeenCalledWith(
      expect.stringContaining('Something broke'),
    );
    expect(mockCreateIssue).toHaveBeenCalledWith(
      expect.stringContaining('Something broke'),
      expect.any(String),
      ['bug', 'auto-reported', 'server-error'],
    );
    expect(mockAddComment).not.toHaveBeenCalled();
    expect(mockReopenIssue).not.toHaveBeenCalled();
  });

  it('uses client-error label for client source', async () => {
    mockFindOpenIssue.mockResolvedValue(null);
    mockCreateIssue.mockResolvedValue({ number: 2, url: '...' });

    await reportError(new Error('Client oops'), { source: 'client' });

    expect(mockCreateIssue).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      ['bug', 'auto-reported', 'client-error'],
    );
  });

  it('adds comment for duplicate error (same fingerprint)', async () => {
    mockFindOpenIssue.mockResolvedValue(null);
    mockCreateIssue.mockResolvedValue({ number: 5, url: '...' });

    const error = new Error('Same error');
    const context = { source: 'server' };

    await reportError(error, context);
    await reportError(error, context);

    expect(mockCreateIssue).toHaveBeenCalledTimes(1);
    expect(mockAddComment).toHaveBeenCalledWith(5, expect.stringContaining('동일 에러 재발생'));
    expect(mockAddComment).toHaveBeenCalledWith(5, expect.stringContaining('2회'));
  });

  it('respects rate limit (10 issues per hour)', async () => {
    mockFindOpenIssue.mockResolvedValue(null);
    mockCreateIssue.mockResolvedValue({ number: 1, url: '...' });

    for (let i = 0; i < 12; i++) {
      await reportError(new Error(`Unique error ${i}`), { source: 'server' });
    }

    expect(mockCreateIssue).toHaveBeenCalledTimes(10);
  });

  it('finds and reopens existing closed issue', async () => {
    mockFindOpenIssue.mockResolvedValue({ number: 42, state: 'closed' });

    await reportError(new Error('Known bug'), { source: 'server' });

    expect(mockReopenIssue).toHaveBeenCalledWith(42);
    expect(mockAddComment).toHaveBeenCalledWith(42, expect.stringContaining('에러 재발생'));
    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  it('adds comment to existing open issue without reopening', async () => {
    mockFindOpenIssue.mockResolvedValue({ number: 7, state: 'open' });

    await reportError(new Error('Existing open'), { source: 'server' });

    expect(mockReopenIssue).not.toHaveBeenCalled();
    expect(mockAddComment).toHaveBeenCalledWith(7, expect.any(String));
    expect(mockCreateIssue).not.toHaveBeenCalled();
  });
});
