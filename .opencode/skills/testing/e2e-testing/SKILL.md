---
name: e2e-testing
description: Test end-to-end user flows with Playwright
license: MIT
compatibility: opencode
metadata:
  category: testing
  complexity: advanced
---

## What I do
- Test complete user flows with Playwright
- Test page navigation and routing
- Test form submissions and user interactions
- Test loading states and error handling
- Test cross-browser compatibility
- Use Playwright locators and assertions
- Follow user-centric testing patterns

## When to use me
Use this when you need to:
- Write end-to-end tests for user flows
- Test page navigation and routing
- Test form submissions and user interactions
- Test loading states and error handling
- Test cross-browser compatibility

I'll ask clarifying questions if:
- User flow needs clarification
- Page routing or navigation is unclear

## Pattern: Basic Page Navigation
```typescript
import { test, expect } from '@playwright/test';

test('should navigate to demo page', async ({ page }) => {
  await page.goto('/demo');

  await expect(page).toHaveTitle(/YouTube.js API Demo/);
  await expect(page.getByRole('heading', { name: /YouTube.js API Demo/i })).toBeVisible();
});
```

## Pattern: Testing Form Inputs
```typescript
test('should search and display results', async ({ page }) => {
  await page.goto('/demo');

  const searchInput = page.getByPlaceholder('검색어를 입력하세요...');
  const searchButton = page.getByRole('button', { name: '검색' });

  await searchInput.fill('test query');
  await searchButton.click();

  await page.waitForTimeout(1000);

  await expect(page.getByText('결과')).toBeVisible();
});
```

## Pattern: Testing User Interactions
```typescript
test('should navigate between tabs', async ({ page }) => {
  await page.goto('/demo');

  const feedTab = page.getByRole('button', { name: /피드/i });
  await feedTab.click();

  await expect(page.getByText('결과')).toBeVisible();
});
```

## Pattern: Testing Loading States
```typescript
test('should display loading state', async ({ page }) => {
  await page.goto('/demo');

  const searchInput = page.getByPlaceholder('검색어를 입력하세요...');
  const searchButton = page.getByRole('button', { name: '검색' });

  await searchInput.fill('test query');
  await searchButton.click();

  await expect(page.getByText('로딩 중...')).toBeVisible();
});
```

## Pattern: Testing Keyboard Interactions
```typescript
test('should search when Enter key is pressed', async ({ page }) => {
  await page.goto('/demo');

  const searchInput = page.getByPlaceholder('검색어를 입력하세요...');

  await searchInput.fill('test query');
  await searchInput.press('Enter');

  await page.waitForTimeout(1000);

  await expect(page.getByText('결과')).toBeVisible();
});
```

## Pattern: Testing Error States
```typescript
test('should display error message on failure', async ({ page }) => {
  await page.goto('/demo');

  const searchInput = page.getByPlaceholder('검색어를 입력하세요...');
  const searchButton = page.getByRole('button', { name: '검색' });

  await searchInput.fill('invalid query');
  await searchButton.click();

  await expect(page.getByText(/error/i)).toBeVisible();
});
```

## Pattern: Testing Async Operations
```typescript
test('should wait for async content to load', async ({ page }) => {
  await page.goto('/demo');

  const feedTab = page.getByRole('button', { name: /피드/i });
  await feedTab.click();

  await page.waitForLoadState('networkidle');

  await expect(page.getByText('결과')).toBeVisible();
});
```

## Pattern: Testing API Responses
```typescript
test('should verify API response', async ({ page }) => {
  await page.goto('/demo');

  const searchInput = page.getByPlaceholder('검색어를 입력하세요...');
  const searchButton = page.getByRole('button', { name: '검색' });

  await searchInput.fill('test query');
  await searchButton.click();

  const response = await page.waitForResponse((res) =>
    res.url().includes('/api/youtube/search') && res.status() === 200
  );

  const data = await response.json();
  expect(data).toHaveProperty('results');
});
```

## Pattern: Testing Multiple Tabs
```typescript
test('should test multiple tabs', async ({ page }) => {
  await page.goto('/demo');

  const tabs = [/검색/i, /피드/i, /채널/i, /재생목록/i];

  for (const tabName of tabs) {
    const tab = page.getByRole('button', { name: tabName });
    await tab.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('결과')).toBeVisible();
  }
});
```

## Pattern: Test Hooks
```typescript
test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display search input', async ({ page }) => {
    await expect(page.getByPlaceholder('검색어를 입력하세요...')).toBeVisible();
  });

  test('should search and display results', async ({ page }) => {
    const searchInput = page.getByPlaceholder('검색어를 입력하세요...');
    const searchButton = page.getByRole('button', { name: '검색' });

    await searchInput.fill('test query');
    await searchButton.click();

    await expect(page.getByText('결과')).toBeVisible();
  });
});
```

## Playwright Locators Reference

| Locator | Description |
|---------|-------------|
| `page.getByRole('button', { name: /text/i })` | Find by ARIA role and text |
| `page.getByText('text')` | Find by text content |
| `page.getByPlaceholder('text')` | Find by placeholder |
| `page.getByTestId('id')` | Find by test ID |
| `page.locator('selector')` | Find by CSS/XPath selector |

## Playwright Assertions Reference

| Assertion | Description |
|-----------|-------------|
| `toBeVisible()` | Element is visible |
| `toBeHidden()` | Element is hidden |
| `toHaveText('text')` | Element has text |
| `toHaveAttribute('attr', 'value')` | Element has attribute |
| `toHaveURL('url')` | Page has URL |
| `toHaveTitle('title')` | Page has title |

## Test Organization
```typescript
test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test.describe('UI Elements', () => {
    test('should display search input');
    test('should display search button');
  });

  test.describe('User Interactions', () => {
    test('should search and display results');
    test('should search when Enter key is pressed');
  });

  test.describe('State Management', () => {
    test('should display loading state');
    test('should display error state');
  });
});
```

## Cross-Browser Testing
```typescript
test('should work on all browsers', async ({ page, browserName }) => {
  await page.goto('/demo');

  const searchInput = page.getByPlaceholder('검색어를 입력하세요...');
  await searchInput.fill('test query');

  await expect(page.getByPlaceholder('검색어를 입력하세요...')).toHaveValue('test query');
});
```

---

**Related SKILLS:** component-testing.md, hook-testing.md, api-testing.md
