jest.mock('../api/client', () => ({
  API_URL: 'http://localhost:9900',
}));

jest.mock('../storage/session');

const AsyncStorage = require('@react-native-async-storage/async-storage');
const { readSession } = require('../storage/session');
const { getVisitorId, trackScreenView } = require('../api/analytics');

const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true });

describe('analytics api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    readSession.mockReset();
    readSession.mockResolvedValue(null);
  });

  test('getVisitorId generates and persists new id', async () => {
    const id = await getVisitorId();
    expect(id).toBeTruthy();
    expect(id.split('-').length).toBe(2);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tholabul:mobile-visitor-id',
      id,
    );
  });

  test('getVisitorId returns existing id', async () => {
    AsyncStorage.getItem.mockResolvedValue('visitor-123');
    const id = await getVisitorId();
    expect(id).toBe('visitor-123');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('trackScreenView sends POST without token for guest', async () => {
    readSession.mockResolvedValue(null);
    await trackScreenView({ path: 'mobile:/home', referrer: '' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://localhost:9900/api/v1/analytics/page-view');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.headers.Authorization).toBeUndefined();
    const body = JSON.parse(opts.body);
    expect(body.path).toBe('mobile:/home');
    expect(body.source).toBe('mobile');
    expect(body.visitor_id).toBeTruthy();
  });

  test('trackScreenView sends Authorization when logged in', async () => {
    readSession.mockResolvedValue({ token: 'jwt-token-123' });
    await trackScreenView({ path: 'mobile:/quran' });

    const opts = fetchSpy.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe('Bearer jwt-token-123');
  });

  test('trackScreenView sends referrer when provided', async () => {
    await trackScreenView({ path: 'mobile:/quran', referrer: 'mobile:/home' });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.referrer).toBe('mobile:/home');
  });

  test('trackScreenView does not throw on network error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    await expect(
      trackScreenView({ path: 'mobile:/home' }),
    ).resolves.toBeUndefined();
  });

  test('AnalyticsTracker lifecycle (integration via public API)', async () => {
    // Simulate initial mount: track home
    await trackScreenView({ path: 'mobile:/home' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    let body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.path).toBe('mobile:/home');

    // Simulate tab switch to quran
    fetchSpy.mockClear();
    await trackScreenView({
      path: 'mobile:/quran',
      referrer: 'mobile:/home',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.path).toBe('mobile:/quran');
    expect(body.referrer).toBe('mobile:/home');
  });
});
