import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/mockApi';

const publicRoutes = [
  '/',
  '/hadith',
  '/panduan-sholat',
  '/kajian',
  '/wirid',
  '/tilawah',
  '/tafsir',
  '/jadwal-sholat',
  '/wirid-custom',
  '/contact',
  '/dev',
  '/quran/page-mushaf',
  '/quran',
  '/dzikir',
  '/tasbih',
  '/sholat-tracker',
  '/muroja-ah',
  '/doa',
  '/amalan',
  '/muhasabah',
  '/kamus',
  '/kiblat',
  '/search',
  '/asmaul-husna/flashcard',
  '/asmaul-husna',
  '/siroh',
  '/khatam',
  '/hafalan',
  '/manasik',
  '/perawi',
  '/zakat',
  '/stats',
  '/blog',
  '/auth/register',
  '/auth/login',
  '/leaderboard',
  '/imsakiyah',
  '/faraidh',
  '/tahlil',
  '/hijri',
  '/quiz',
  '/goals',
  '/sejarah',
  '/asbabun-nuzul',
  '/notes',
  '/fiqh',
];

const dashboardRoutes = [
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/bookmarks',
  '/dashboard/notifications',
  '/dashboard/hadith',
  '/dashboard/panduan-sholat',
  '/dashboard/kajian',
  '/dashboard/wirid',
  '/dashboard/tilawah',
  '/dashboard/tafsir',
  '/dashboard/jadwal-sholat',
  '/dashboard/wirid-custom',
  '/dashboard/quran',
  '/dashboard/quran/page-mushaf',
  '/dashboard/dzikir',
  '/dashboard/tasbih',
  '/dashboard/sholat-tracker',
  '/dashboard/muroja-ah',
  '/dashboard/doa',
  '/dashboard/amalan',
  '/dashboard/muhasabah',
  '/dashboard/kamus',
  '/dashboard/kiblat',
  '/dashboard/search',
  '/dashboard/asmaul-husna',
  '/dashboard/siroh',
  '/dashboard/khatam',
  '/dashboard/hafalan',
  '/dashboard/manasik',
  '/dashboard/perawi',
  '/dashboard/zakat',
  '/dashboard/stats',
  '/dashboard/blog',
  '/dashboard/leaderboard',
  '/dashboard/imsakiyah',
  '/dashboard/faraidh',
  '/dashboard/tahlil',
  '/dashboard/hijri',
  '/dashboard/quiz',
  '/dashboard/goals',
  '/dashboard/sejarah',
  '/dashboard/asbabun-nuzul',
  '/dashboard/notes',
  '/dashboard/fiqh',
];

test.describe('Public Routes Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  for (const route of publicRoutes) {
    test(`Should successfully load public route: ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response.status()).toBeLessThan(400);
    });
  }
});

test.describe('Dashboard Routes Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { isAuthenticated: true });
  });

  for (const route of dashboardRoutes) {
    test(`Should successfully load or redirect dashboard route: ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response.status()).toBeLessThan(400);
    });
  }
});
