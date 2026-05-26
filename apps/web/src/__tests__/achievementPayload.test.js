import { getAchievementItems } from '@/lib/achievementPayload';

describe('getAchievementItems', () => {
  test('returns array payloads as-is', () => {
    expect(getAchievementItems([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  test('extracts items payloads', () => {
    expect(getAchievementItems({ items: [{ id: 1 }] })).toEqual([{ id: 1 }]);
  });

  test('extracts achievements payloads', () => {
    expect(getAchievementItems({ achievements: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });

  test('extracts nested achievements payloads', () => {
    expect(getAchievementItems({ data: { achievements: [{ id: 3 }] } })).toEqual([{ id: 3 }]);
  });
});
