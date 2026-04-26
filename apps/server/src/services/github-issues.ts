import { Octokit } from 'octokit';
import { env } from '../lib/env.js';

let octokitInstance: Octokit | null = null;

function getOctokit(): Octokit | null {
  if (!env.GITHUB_TOKEN) return null;
  if (octokitInstance) return octokitInstance;
  octokitInstance = new Octokit({ auth: env.GITHUB_TOKEN });
  return octokitInstance;
}

function parseRepo() {
  const [owner, repo] = env.GITHUB_REPO.split('/');
  return { owner, repo };
}

const REQUIRED_LABELS = [
  { name: 'bug', color: 'd73a4a', description: 'Something isn\'t working' },
  { name: 'auto-reported', color: '0075ca', description: 'Automatically reported by error reporter' },
  { name: 'server-error', color: 'e99695', description: 'Error from server-side' },
  { name: 'client-error', color: 'bfdadc', description: 'Error from client-side' },
];

let labelsInitialized = false;

export async function ensureLabels(): Promise<void> {
  const octokit = getOctokit();
  if (!octokit) return;
  if (labelsInitialized) return;

  const { owner, repo } = parseRepo();
  try {
    for (const label of REQUIRED_LABELS) {
      try {
        await octokit.rest.issues.createLabel({
          owner,
          repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
      } catch (err: any) {
        if (err.status !== 422) throw err;
      }
    }
    labelsInitialized = true;
  } catch (error) {
    console.error('[GitHub] Failed to ensure labels:', error);
  }
}

export async function findOpenIssue(title: string): Promise<{ number: number; state: string } | null> {
  const octokit = getOctokit();
  if (!octokit) return null;

  const { owner, repo } = parseRepo();
  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      labels: 'auto-reported',
    });

    const match = data.find((issue) => issue.title === title);
    if (match) return { number: match.number, state: match.state };
    return null;
  } catch (error) {
    console.error('[GitHub] Failed to search issues:', error);
    return null;
  }
}

export async function createIssue(
  title: string,
  body: string,
  labels: string[],
): Promise<{ number: number; url: string } | null> {
  const octokit = getOctokit();
  if (!octokit) return null;

  await ensureLabels();

  const { owner, repo } = parseRepo();
  try {
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    return { number: data.number, url: data.html_url };
  } catch (error) {
    console.error('[GitHub] Failed to create issue:', error);
    return null;
  }
}

export async function addComment(issueNumber: number, body: string): Promise<void> {
  const octokit = getOctokit();
  if (!octokit) return;

  const { owner, repo } = parseRepo();
  try {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  } catch (error) {
    console.error('[GitHub] Failed to add comment:', error);
  }
}

export async function reopenIssue(issueNumber: number): Promise<void> {
  const octokit = getOctokit();
  if (!octokit) return;

  const { owner, repo } = parseRepo();
  try {
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: 'open',
    });
  } catch (error) {
    console.error('[GitHub] Failed to reopen issue:', error);
  }
}
