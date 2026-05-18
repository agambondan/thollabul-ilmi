import AsyncStorage from '@react-native-async-storage/async-storage';
import { readSession } from '../storage/session';
import { API_URL } from './client';

const VISITOR_KEY = 'tholabul:mobile-visitor-id';

const generateId = () => {
  const ts = Date.now().toString(36);
  const r1 = Math.random().toString(36).slice(2, 10);
  const r2 = Math.random().toString(36).slice(2, 10);
  return `${ts}-${r1}${r2}`;
};

export const getVisitorId = async () => {
  try {
    const existing = await AsyncStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const next = generateId();
    await AsyncStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return generateId();
  }
};

export const trackScreenView = async ({ path, referrer }) => {
  try {
    const [visitor_id, session] = await Promise.all([
      getVisitorId(),
      readSession().catch(() => null),
    ]);
    const body = { visitor_id, path, source: 'mobile' };
    if (referrer) body.referrer = referrer;
    await fetch(`${API_URL}/api/v1/analytics/page-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // fire-and-forget
  }
};
