import {
  isStoredUserLocationFresh,
  readStoredUserLocation,
  writeStoredUserLocation,
} from '@/lib/userLocation';

describe('userLocation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('stores and reads normalized GPS location', () => {
    writeStoredUserLocation({
      label: 'Kecamatan Cakung',
      lat: '-6.184',
      lng: '106.947',
      source: 'gps',
      updatedAt: 1000,
    });

    expect(readStoredUserLocation()).toEqual({
      label: 'Kecamatan Cakung',
      lat: -6.184,
      lng: 106.947,
      source: 'gps',
      updatedAt: 1000,
    });
  });

  test('marks missing or expired location as stale', () => {
    const fresh = { updatedAt: Date.now() - 1000 };
    const stale = { updatedAt: Date.now() - 10000 };

    expect(isStoredUserLocationFresh(null, 5000)).toBe(false);
    expect(isStoredUserLocationFresh(fresh, 5000)).toBe(true);
    expect(isStoredUserLocationFresh(stale, 5000)).toBe(false);
  });
});
