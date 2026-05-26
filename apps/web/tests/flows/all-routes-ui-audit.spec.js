import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { defaultMockUser, setupApiMocks } from '../fixtures/mockApi';

const appRoot = path.join(process.cwd(), 'src/app');

const routeOverrides = {
  '/admin/blog/[id]/edit': '/admin/blog/1/edit',
  '/admin/siroh/[id]/edit': '/admin/siroh/1/edit',
  '/blog/[slug]': '/blog/sample-post',
  '/dashboard/blog/[slug]': '/dashboard/blog/sample-post',
  '/dashboard/forum/[slug]': '/dashboard/forum/sample-question',
  '/dashboard/hadith/[slug]': '/dashboard/hadith/bukhari',
  '/dashboard/hadith/[slug]/[number]': '/dashboard/hadith/bukhari/1',
  '/dashboard/hadith/theme/[slug]': '/dashboard/hadith/theme/niat',
  '/dashboard/library/[slug]': '/dashboard/library/sample-book',
  '/dashboard/perawi/[id]': '/dashboard/perawi/1',
  '/dashboard/quran/[slug]': '/dashboard/quran/Al-Fatihah',
  '/dashboard/siroh/[slug]': '/dashboard/siroh/sample-story',
  '/dashboard/tafsir/[slug]': '/dashboard/tafsir/Al-Fatihah',
  '/forum/[slug]': '/forum/sample-question',
  '/hadith/[slug]': '/hadith/bukhari',
  '/hadith/[slug]/[number]': '/hadith/bukhari/1',
  '/hadith/theme/[slug]': '/hadith/theme/niat',
  '/hadits/[slug]/[number]': '/hadits/bukhari/1',
  '/library/[slug]': '/library/sample-book',
  '/perawi/[id]': '/perawi/1',
  '/quran/[...slug]': '/quran/surah/Al-Fatihah',
  '/siroh/[id]': '/siroh/1',
  '/tafsir/[slug]': '/tafsir/Al-Fatihah',
};

const dashboardRedirectRoutes = new Set([
  '/amalan',
  '/bookmarks',
  '/goals',
  '/hafalan',
  '/muhasabah',
  '/muroja-ah',
  '/notifications',
  '/sholat-tracker',
  '/stats',
  '/tilawah',
]);

const ignoredConsoleErrorPatterns = [
  /Failed to load resource/i,
  /favicon/i,
  /Open Next\.js Dev Tools/i,
  /Download the React DevTools/i,
];

const capturedConsoleWarningPatterns = [
  /width\(-?\d+\) and height\(-?\d+\) of chart should be greater than 0/i,
];

const ignoredRawKeyPatterns = [
  /api\/v1/i,
  /test@example\.com/i,
];

function listPageRoutes(dir = appRoot, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPageRoutes(entryPath, `${prefix}/${entry.name}`);
    if (entry.name === 'page.js') return [prefix || '/'];
    return [];
  });
}

function concretizeRoute(route) {
  if (routeOverrides[route]) return routeOverrides[route];
  return route
    .replace('[...slug]', 'sample')
    .replace('[slug]', 'sample')
    .replace('[id]', '1')
    .replace('[number]', '1');
}

function authOptionsForRoute(route) {
  if (route.startsWith('/admin')) {
    return { isAuthenticated: true, mockUser: { ...defaultMockUser, role: 'admin' } };
  }
  if (route.startsWith('/dashboard') || dashboardRedirectRoutes.has(route)) {
    return { isAuthenticated: true };
  }
  return {};
}

const routes = [...new Set(listPageRoutes().map(concretizeRoute))].sort();

test.describe('all web routes UI audit', () => {
  test.setTimeout(90000);

  for (const route of routes) {
    test(`${route} renders without route-level UI regressions`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (msg) => {
        if (msg.type() === 'warning') {
          const text = msg.text();
          if (capturedConsoleWarningPatterns.some((pattern) => pattern.test(text))) {
            errors.push(text);
          }
          return;
        }
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (ignoredConsoleErrorPatterns.some((pattern) => pattern.test(text))) return;
        errors.push(text);
      });

      await page.setViewportSize({ width: 412, height: 915 });
      const authOptions = authOptionsForRoute(route);
      if (authOptions.isAuthenticated) {
        await page.addInitScript(() => {
          localStorage.setItem('auth_token', 'mock-token-123');
        });
      }
      await setupApiMocks(page, authOptions);

      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 75000 });
      expect(response?.status(), `${route} status`).toBeLessThan(400);

      const body = page.locator('body');
      await expect.poll(
        async () => (await body.innerText()).trim().length,
        { message: `${route} body text`, timeout: 60000 },
      ).toBeGreaterThan(20);
      const bodyText = await body.innerText();
      expect(errors, `${route} console/page errors`).toEqual([]);

      const globalSettingsButtonCount = await page.getByTestId('global-setting-button').count();
      expect(globalSettingsButtonCount, `${route} global settings button count`).toBeLessThanOrEqual(1);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        overflow.scrollWidth,
        `${route} horizontal overflow: ${overflow.scrollWidth} > ${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 2);

      const rawKeyPattern = /\b(?:admin|common|dashboard|settings|mushaf|quran|hadith|link)\.[a-z0-9_.]+/i;
      const hasRawKey = rawKeyPattern.test(bodyText)
        && !ignoredRawKeyPatterns.some((pattern) => pattern.test(bodyText));
      expect(hasRawKey, `${route} raw i18n key in body`).toBe(false);
    });
  }
});
