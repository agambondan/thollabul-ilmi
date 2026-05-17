import AsyncStorage from '@react-native-async-storage/async-storage';

const ASMAUL_WIRID_COUNTS_KEY = 'tholabul:asmaul-wirid-counts';

const normalizeCounts = (value = {}) =>
  Object.entries(value).reduce((acc, [key, count]) => {
    const nextCount = Number(count);
    if (key && Number.isFinite(nextCount) && nextCount > 0) {
      acc[key] = Math.floor(nextCount);
    }
    return acc;
  }, {});

export const readAsmaulWiridCounts = async () => {
  try {
    const raw = await AsyncStorage.getItem(ASMAUL_WIRID_COUNTS_KEY);
    return normalizeCounts(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
};

export const saveAsmaulWiridCounts = async (counts = {}) => {
  const next = normalizeCounts(counts);
  await AsyncStorage.setItem(ASMAUL_WIRID_COUNTS_KEY, JSON.stringify(next));
  return next;
};

export const setAsmaulWiridCount = async (counts = {}, nameId, count) => {
  if (!nameId) return normalizeCounts(counts);
  const next = { ...counts, [nameId]: Math.max(0, Math.floor(Number(count) || 0)) };
  if (next[nameId] <= 0) delete next[nameId];
  return saveAsmaulWiridCounts(next);
};
