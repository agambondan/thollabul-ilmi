import { allFeatures, belajarFeatureGroups } from '../data/mobileFeatures';

const supportedFeatureTypes = new Set([
  'asmaul-flashcard',
  'asmaul-wirid',
  'bookmarks',
  'faraidh',
  'feed',
  'forum',
  'hijri',
  'historical-map',
  'kamus',
  'list',
  'notes',
  'notifications',
  'protected-list',
  'quiz',
  'sholat-tracker',
  'surah-content',
  'tasbih',
  'tokoh',
  'user-wird',
  'zakat',
]);

const expectedBelajarFeatureKeysByGroup = {
  'Kajian & Artikel': ['community-feed', 'kajian', 'blog'],
  'Siroh & Sejarah': ['siroh', 'sejarah', 'manasik'],
  'Fiqh & Panduan': ['fiqh', 'panduan-sholat', 'user-wird'],
  Referensi: ['kamus', 'tafsir', 'asbabun-nuzul', 'perawi', 'jarh-tadil', 'asmaul-husna', 'asmaul-flashcard'],
  Evaluasi: ['quiz'],
  'Personal Ringkas': ['goals', 'stats', 'leaderboard', 'bookmarks', 'notes'],
};

const localRendererTypes = new Set([
  'asmaul-flashcard',
  'asmaul-wirid',
  'faraidh',
  'forum',
  'historical-map',
  'notifications',
  'sholat-tracker',
  'surah-content',
  'tasbih',
  'tokoh',
  'zakat',
]);

const directLoaderTypes = new Set(['bookmarks', 'feed', 'hijri', 'kamus', 'notes', 'quiz', 'user-wird']);

describe('allFeatures', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(allFeatures)).toBe(true);
    expect(allFeatures.length).toBeGreaterThan(0);
  });

  test('each feature has required fields', () => {
    for (const feature of allFeatures) {
      expect(typeof feature.key).toBe('string');
      expect(feature.key.trim()).toBe(feature.key);
      expect(feature.key.length).toBeGreaterThan(0);
      expect(typeof feature.title).toBe('string');
      expect(feature.title.trim().length).toBeGreaterThan(0);
      expect(typeof feature.subtitle).toBe('string');
      expect(feature.subtitle.trim().length).toBeGreaterThan(0);
      expect(typeof feature.group).toBe('string');
      expect(feature.group.trim().length).toBeGreaterThan(0);
      expect(typeof feature.type).toBe('string');
      expect(feature.type.trim().length).toBeGreaterThan(0);
    }
  });

  test('all features have unique keys', () => {
    const keys = allFeatures.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('all feature route types are handled by ExploreScreen', () => {
    const unsupportedFeatures = allFeatures
      .filter((feature) => !supportedFeatureTypes.has(feature.type))
      .map((feature) => `${feature.key}:${feature.type}`);

    expect(unsupportedFeatures).toEqual([]);
  });

  test('remote list features declare API endpoints', () => {
    const endpointIssues = allFeatures
      .filter((feature) => ['list', 'protected-list'].includes(feature.type))
      .filter((feature) => typeof feature.endpoint !== 'string' || !feature.endpoint.startsWith('/api/'))
      .map((feature) => `${feature.key}:${feature.endpoint ?? 'missing'}`);

    expect(endpointIssues).toEqual([]);
  });

  test('surah content features declare supported content types', () => {
    const supportedContentTypes = new Set(['tafsir', 'asbabun-nuzul']);
    const contentTypeIssues = allFeatures
      .filter((feature) => feature.type === 'surah-content')
      .filter((feature) => !supportedContentTypes.has(feature.contentType))
      .map((feature) => `${feature.key}:${feature.contentType ?? 'missing'}`);

    expect(contentTypeIssues).toEqual([]);
  });

  test('all features have a concrete Explore loading strategy', () => {
    const strategyIssues = allFeatures
      .filter((feature) => {
        if (localRendererTypes.has(feature.type)) return false;
        if (directLoaderTypes.has(feature.type)) return false;
        if (['list', 'protected-list'].includes(feature.type) && typeof feature.endpoint === 'string') return false;
        return true;
      })
      .map((feature) => `${feature.key}:${feature.type}`);

    expect(strategyIssues).toEqual([]);
  });
});

describe('belajarFeatureGroups', () => {
  test('has expected groups', () => {
    const labels = belajarFeatureGroups.map((g) => g.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Kajian & Artikel',
        'Siroh & Sejarah',
        'Fiqh & Panduan',
        'Referensi',
        'Evaluasi',
        'Personal Ringkas',
      ]),
    );
  });

  test('all feature keys in each group are unique', () => {
    for (const group of belajarFeatureGroups) {
      const keys = group.features.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  test('matches the current Explore feature inventory', () => {
    for (const [label, expectedKeys] of Object.entries(expectedBelajarFeatureKeysByGroup)) {
      const group = belajarFeatureGroups.find((item) => item.label === label);
      expect(group?.features.map((feature) => feature.key)).toEqual(expectedKeys);
    }
  });
});
