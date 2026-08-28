export const todayISO = () => new Date().toISOString().slice(0, 10);

export const parseApiJson = async (response) => {
    if (!response?.ok) {
        let message = `Request failed: ${response?.status ?? "unknown"}`;
        try {
            const body = await response.clone().json();
            message = body?.message ?? body?.error ?? message;
        } catch {}
        throw new Error(message);
    }
    return response.json();
};

export const pickItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

export const unwrapData = (payload) => payload?.data ?? payload;

export const readLocalArray = (key) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const readLocalObject = (key) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
    } catch {
        return {};
    }
};

export const writeLocalArray = (key, items) => {
    try {
        localStorage.setItem(key, JSON.stringify(items));
    } catch {}
};

export const writeLocalObject = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {}
};

export const prayerKey = (label) => {
    const value = String(label ?? "").toLowerCase();
    if (value === "shubuh") return "subuh";
    return value;
};

export const PRAYER_KEYS = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];

export const normalizePrayerLog = (payload = {}) => {
    const data = unwrapData(payload) ?? {};
    const source = data?.prayers ?? data;
    const fromArray = Array.isArray(source)
        ? source.reduce((acc, item) => {
              if (item?.prayer) acc[prayerKey(item.prayer)] = item;
              return acc;
          }, {})
        : source;

    return PRAYER_KEYS.reduce((acc, key) => {
        const value = fromArray?.[key];
        if (typeof value === "boolean") {
            acc[key] = value;
        } else if (typeof value === "string") {
            acc[key] = value !== "missed";
        } else if (value && typeof value === "object") {
            acc[key] = value.status && value.status !== "missed";
        }
        return acc;
    }, {});
};

export const readLocalPrayerLog = (date = todayISO()) =>
    normalizePrayerLog(readLocalObject(`sholat_log_${date}`));

export const writeLocalPrayerLog = (date, log) =>
    writeLocalObject(`sholat_log_${date}`, normalizePrayerLog(log));

export const countDonePrayers = (log = {}) =>
    PRAYER_KEYS.filter((key) => Boolean(normalizePrayerLog(log)[key])).length;

export const dateISOOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
};

export const buildLocalPrayerRows = (days = 7) => {
    const rows = [];
    for (let i = -(days - 1); i <= 0; i++) {
        const date = dateISOOffset(i);
        rows.push({ date, count: countDonePrayers(readLocalPrayerLog(date)) });
    }
    return rows;
};

export const calcLocalPrayerStreak = () => {
    let streak = 0;
    for (let i = 0; i >= -365; i--) {
        if (countDonePrayers(readLocalPrayerLog(dateISOOffset(i))) > 0) {
            streak += 1;
        } else {
            break;
        }
    }
    return streak;
};

const categoryToType = {
    Hadith: "hadith",
    Ibadah: "custom",
    Ilmu: "custom",
    Lainnya: "custom",
    Quran: "tilawah",
};

const typeToCategory = {
    custom: "Lainnya",
    hadith: "Hadith",
    hafalan: "Quran",
    khatam: "Quran",
    tilawah: "Quran",
};

const typeToUnit = {
    custom: "kali",
    hadith: "hadith",
    hafalan: "surah",
    khatam: "juz",
    tilawah: "halaman",
};

export const normalizeGoal = (goal) => {
    const data = unwrapData(goal) ?? {};
    const type = data.type ?? categoryToType[data.category] ?? "custom";
    const rawDescription = data.description ?? "";
    const unitFromDescription = rawDescription.match(/^Unit:\s*(.+)$/i)?.[1];
    return {
        id: String(data.id),
        category: data.category ?? typeToCategory[type] ?? "Lainnya",
        completed: Boolean(data.is_completed ?? data.completed),
        current: Number(
            data.progress ?? data.current ?? data.current_value ?? 0,
        ),
        deadline: data.end_date ?? data.deadline ?? "",
        title: data.title ?? "",
        target: Number(data.target ?? data.target_value ?? 1),
        type,
        unit: data.unit ?? unitFromDescription ?? typeToUnit[type] ?? "kali",
    };
};

export const goalCreatePayload = (goal) => ({
    description: goal.unit ? `Unit: ${goal.unit}` : "",
    end_date: goal.deadline || undefined,
    start_date: todayISO(),
    target: Number(goal.target ?? 1),
    title: goal.title,
    type: categoryToType[goal.category] ?? goal.type ?? "custom",
});

export const goalUpdatePayload = (goal) => ({
    description: goal.unit ? `Unit: ${goal.unit}` : "",
    end_date: goal.deadline || undefined,
    is_completed: goal.completed,
    progress: Number(goal.current ?? 0),
    target: Number(goal.target ?? 1),
    title: goal.title,
});

export const isGoalCompleted = (goal) => Boolean(normalizeGoal(goal).completed);

const moodToScore = {
    baik: 4,
    biasa: 3,
    berat: 2,
    syukur: 5,
};

const scoreToMood = {
    1: "berat",
    2: "berat",
    3: "biasa",
    4: "baik",
    5: "syukur",
};

export const normalizeMuhasabah = (entry) => {
    const data = unwrapData(entry) ?? {};
    return {
        id: String(data.id),
        content: data.content ?? data.notes ?? "",
        date: (data.date ?? data.created_at ?? todayISO()).slice(0, 10),
        mood: data.mood ?? scoreToMood[data.mood_score] ?? "biasa",
    };
};

export const muhasabahCreatePayload = (entry) => ({
    content: entry.content,
    date: entry.date,
    is_private: true,
    mood_score: moodToScore[entry.mood] ?? 3,
});

export const muhasabahUpdatePayload = (entry) => ({
    content: entry.content,
    is_private: true,
    mood_score: moodToScore[entry.mood] ?? 3,
});

export const PERSONAL_NOTE_REF_TYPE = "personal";
export const PERSONAL_NOTE_REF_ID = 0;

export const encodePersonalNoteContent = (note) =>
    JSON.stringify({
        content: note.content ?? "",
        tags: note.tags ?? [],
        title: note.title ?? "",
    });

export const normalizePersonalNote = (note) => {
    const data = unwrapData(note) ?? {};
    let parsed = null;
    try {
        parsed = JSON.parse(data.content ?? "");
    } catch {}

    return {
        id: String(data.id),
        content: parsed?.content ?? data.content ?? "",
        date: (data.created_at ?? data.date ?? todayISO()).slice(0, 10),
        tags: Array.isArray(parsed?.tags)
            ? parsed.tags
            : Array.isArray(data.tags)
              ? data.tags
              : [],
        title: parsed?.title ?? data.title ?? "Catatan",
    };
};

const statusMap = {
    belum: "not_started",
    hafal: "memorized",
    in_progress: "in_progress",
    memorized: "memorized",
    not_started: "not_started",
    sedang: "in_progress",
};

export const normalizeHafalan = (item = {}) => {
    const data = unwrapData(item) ?? {};
    return {
        ...data,
        status: statusMap[data.status] ?? "not_started",
        surah_id: data.surah_id ?? data.surah_number ?? data.surah?.number,
        surah_name:
            data.surah_name ??
            data.surah?.latin_name ??
            data.surah?.name_latin ??
            data.surah?.name ??
            data.name ??
            "-",
        surah_number: data.surah_number ?? data.surah?.number ?? data.surah_id,
    };
};

export const isHafalanMemorized = (item) =>
    normalizeHafalan(item).status === "memorized";

export const normalizeTilawahEntry = (entry = {}) => {
    const data = unwrapData(entry) ?? {};
    return {
        ...data,
        date: data.date ?? todayISO(),
        pages: Number(data.pages ?? data.pages_read ?? 0),
    };
};

export const sumTilawahPages = (items, predicate = () => true) =>
    pickItems(items)
        .map(normalizeTilawahEntry)
        .filter((entry) => predicate(entry.date))
        .reduce((sum, entry) => sum + entry.pages, 0);
