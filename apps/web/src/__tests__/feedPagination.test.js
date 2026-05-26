import { getFeedItems, getFeedTotal } from '@/lib/feedPagination';

describe('feed pagination helpers', () => {
  test('extracts feed items from common payload shapes', () => {
    expect(getFeedItems([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(getFeedItems({ items: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(getFeedItems({ data: { items: [{ id: 3 }] } })).toEqual([{ id: 3 }]);
    expect(getFeedItems({ data: [{ id: 4 }] })).toEqual([{ id: 4 }]);
  });

  test('uses explicit total before inferred next-page total', () => {
    expect(getFeedTotal({ total: 7, last: false }, 1, 20, 3)).toBe(7);
  });

  test('infers another page when API omits total and last is false', () => {
    expect(getFeedTotal({ last: false }, 2, 20, 5)).toBe(26);
  });
});
