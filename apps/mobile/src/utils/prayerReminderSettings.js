import { preferenceKeys, readPreference } from "../storage/preferences";

export const prayerScheduleRows = [
    ["imsak", "prayer.name.imsak"],
    ["fajr", "prayer.name.fajr"],
    ["sunrise", "prayer.name.sunrise"],
    ["dhuhr", "prayer.name.dhuhr"],
    ["asr", "prayer.name.asr"],
    ["maghrib", "prayer.name.maghrib"],
    ["isha", "prayer.name.isha"],
];

export const prayerMethods = [
    ["kemenag", "Kemenag"],
    ["mwl", "MWL"],
    ["makkah", "Makkah"],
    ["isna", "ISNA"],
];

export const prayerMadhabs = [
    ["shafi", "Shafi"],
    ["hanafi", "Hanafi"],
];

export const defaultAdjustments = prayerScheduleRows.reduce(
    (acc, [key]) => ({
        ...acc,
        [key]: 0,
    }),
    {},
);

export const defaultReminderPrayers = [
    "fajr",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
];
export const reminderLeadOptions = [0, 5, 10, 15, 30];
export const defaultReminderLeadMinutes = 10;
export const defaultPrayerMethod = "kemenag";
export const defaultPrayerMadhab = "shafi";
export const SCHEDULE_CACHE_COORD_TOLERANCE = 0.1;

const prayerKeys = new Set(prayerScheduleRows.map(([key]) => key));

export const toMinutes = (time) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
    if (!match) return null;

    return Number(match[1]) * 60 + Number(match[2]);
};

export const formatMinutes = (value) => {
    const wrapped = ((value % 1440) + 1440) % 1440;
    const hours = `${Math.floor(wrapped / 60)}`.padStart(2, "0");
    const minutes = `${wrapped % 60}`.padStart(2, "0");
    return `${hours}:${minutes}`;
};

export const localDateKey = (date) => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

export const hasUsablePrayerTimes = (value) =>
    Boolean(value) &&
    typeof value === "object" &&
    defaultReminderPrayers.every((key) => toMinutes(value[key]) !== null);

export const normalizeCoords = (value) =>
    Number.isFinite(value?.lat) &&
    Number.isFinite(value?.lng) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lng) <= 180
        ? { lat: value.lat, lng: value.lng }
        : null;

export const normalizeSavedLocation = (value) => {
    const saved = normalizeCoords(value);
    if (!saved) return null;
    return { ...saved, source: value.source === "manual" ? "manual" : "gps" };
};

export const normalizeScheduleCache = (value) => {
    const cachedCoords = normalizeCoords(value?.coords);
    if (
        !cachedCoords ||
        !hasUsablePrayerTimes(value?.prayers) ||
        typeof value?.method !== "string" ||
        typeof value?.madhab !== "string" ||
        !Number.isFinite(value?.updatedAt)
    ) {
        return null;
    }

    return {
        coords: cachedCoords,
        madhab: value.madhab,
        method: value.method,
        prayers: value.prayers,
        updatedAt: value.updatedAt,
    };
};

export const scheduleCacheMatchesLocation = (cache, target) =>
    Boolean(cache) &&
    Boolean(target) &&
    Math.abs(cache.coords.lat - target.lat) <= SCHEDULE_CACHE_COORD_TOLERANCE &&
    Math.abs(cache.coords.lng - target.lng) <= SCHEDULE_CACHE_COORD_TOLERANCE;

export const normalizePrayerMethod = (value) =>
    prayerMethods.some(([key]) => key === value) ? value : defaultPrayerMethod;

export const normalizePrayerMadhab = (value) =>
    prayerMadhabs.some(([key]) => key === value) ? value : defaultPrayerMadhab;

export const normalizeReminderLead = (value) =>
    reminderLeadOptions.includes(value) ? value : defaultReminderLeadMinutes;

export const normalizeReminderPrayers = (value) => {
    if (!Array.isArray(value) || !value.some((key) => prayerKeys.has(key))) {
        return defaultReminderPrayers;
    }

    return value.filter((key) => prayerKeys.has(key));
};

export const normalizeAdjustments = (value) => ({
    ...defaultAdjustments,
    ...(value && typeof value === "object" ? value : {}),
});

export const buildAdjustedPrayerTimes = (
    prayers,
    adjustments = defaultAdjustments,
) =>
    prayerScheduleRows.reduce((acc, [key]) => {
        const raw = prayers?.[key];
        const minutes = toMinutes(raw);
        return {
            ...acc,
            [key]:
                minutes === null
                    ? raw
                    : formatMinutes(minutes + (adjustments?.[key] ?? 0)),
        };
    }, {});

export const buildPrayerLabels = (translate) =>
    Object.fromEntries(
        prayerScheduleRows.map(([key]) => [
            key,
            translate(`prayer.name.${key}`),
        ]),
    );

export const countReminderPrayers = (reminders) =>
    new Set(
        (Array.isArray(reminders) ? reminders : [])
            .map((item) => item?.prayer)
            .filter(Boolean),
    ).size;

export const createPrayerTimesResolver = ({
    adjustments,
    coords,
    lookup,
    madhab,
    method,
}) => {
    const target = normalizeCoords(coords);
    if (!target || typeof lookup !== "function") return undefined;

    return async (date) => {
        try {
            const raw = await lookup({
                ...target,
                date: localDateKey(date),
                madhab,
                method,
            });
            return hasUsablePrayerTimes(raw)
                ? buildAdjustedPrayerTimes(raw, adjustments)
                : null;
        } catch {
            return null;
        }
    };
};

export const readPrayerReminderSettings = async () => {
    const [
        enabled,
        leadMinutes,
        selectedPrayers,
        adjustments,
        location,
        scheduleCache,
    ] = await Promise.all([
        readPreference(preferenceKeys.prayerReminderEnabled, false),
        readPreference(
            preferenceKeys.prayerReminderLeadMinutes,
            defaultReminderLeadMinutes,
        ),
        readPreference(
            preferenceKeys.prayerReminderPrayers,
            defaultReminderPrayers,
        ),
        readPreference(preferenceKeys.prayerAdjustments, defaultAdjustments),
        readPreference(preferenceKeys.prayerLocation, null),
        readPreference(preferenceKeys.prayerScheduleCache, null),
    ]);

    return {
        adjustments: normalizeAdjustments(adjustments),
        enabled: Boolean(enabled),
        leadMinutes: normalizeReminderLead(leadMinutes),
        location: normalizeSavedLocation(location),
        scheduleCache: normalizeScheduleCache(scheduleCache),
        selectedPrayers: normalizeReminderPrayers(selectedPrayers),
    };
};
