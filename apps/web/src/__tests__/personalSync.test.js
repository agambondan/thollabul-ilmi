import {
    pickItems,
    prayerKey,
    countDonePrayers,
    normalizeGoal,
    normalizeMuhasabah,
    normalizeTilawahEntry,
    sumTilawahPages,
    isHafalanMemorized,
    isGoalCompleted,
    todayISO,
    dateISOOffset,
    normalizePrayerLog,
    normalizeHafalan,
    normalizePersonalNote,
    encodePersonalNoteContent,
    muhasabahCreatePayload,
    muhasabahUpdatePayload,
    goalCreatePayload,
    goalUpdatePayload,
    PRAYER_KEYS,
    PERSONAL_NOTE_REF_ID,
    PERSONAL_NOTE_REF_TYPE,
} from "@/lib/personalSync";

describe("pickItems", () => {
    test("returns array as-is", () => {
        expect(pickItems([1, 2, 3])).toEqual([1, 2, 3]);
    });
    test("extracts payload.items", () => {
        expect(pickItems({ items: [1, 2] })).toEqual([1, 2]);
    });
    test("extracts payload.data.items", () => {
        expect(pickItems({ data: { items: [1] } })).toEqual([1]);
    });
    test("extracts payload.data", () => {
        expect(pickItems({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
    });
    test("returns [] for empty payload", () => {
        expect(pickItems({})).toEqual([]);
    });
    test("returns [] for null", () => {
        expect(pickItems(null)).toEqual([]);
    });
});

describe("prayerKey", () => {
    test("normalizes shubuh to subuh", () => {
        expect(prayerKey("shubuh")).toBe("subuh");
    });
    test("normalizes Shubuh to subuh", () => {
        expect(prayerKey("Shubuh")).toBe("subuh");
    });
    test("passes subuh through", () => {
        expect(prayerKey("subuh")).toBe("subuh");
    });
    test("passes dzuhur through", () => {
        expect(prayerKey("dzuhur")).toBe("dzuhur");
    });
    test("handles empty string", () => {
        expect(prayerKey("")).toBe("");
    });
    test("handles null/undefined", () => {
        expect(prayerKey(null)).toBe("");
        expect(prayerKey(undefined)).toBe("");
    });
});

describe("PRAYER_KEYS", () => {
    test("has 5 prayers", () => {
        expect(PRAYER_KEYS).toHaveLength(5);
    });
    test("contains subuh", () => {
        expect(PRAYER_KEYS[0]).toBe("subuh");
    });
    test("contains isya", () => {
        expect(PRAYER_KEYS[4]).toBe("isya");
    });
});

describe("normalizePrayerLog", () => {
    test("normalizes boolean values", () => {
        const result = normalizePrayerLog({ subuh: true, dzuhur: false });
        expect(result.subuh).toBe(true);
        expect(result.dzuhur).toBe(false);
    });
    test('treats "missed" as false', () => {
        const result = normalizePrayerLog({ subuh: "missed" });
        expect(result.subuh).toBe(false);
    });
    test("treats other strings as true", () => {
        const result = normalizePrayerLog({ subuh: "on_time" });
        expect(result.subuh).toBe(true);
    });
    test("extracts from object status", () => {
        const result = normalizePrayerLog({ subuh: { status: "on_time" } });
        expect(result.subuh).toBe(true);
    });
    test("handles array input", () => {
        const result = normalizePrayerLog({
            prayers: [
                { prayer: "Shubuh", status: true },
                { prayer: "dzuhur", status: true },
            ],
        });
        expect(result.subuh).toBe(true);
        expect(result.dzuhur).toBe(true);
    });
    test("returns defaults for empty input", () => {
        const result = normalizePrayerLog({});
        PRAYER_KEYS.forEach((key) => expect(result[key]).toBeUndefined());
    });
});

describe("countDonePrayers", () => {
    test("counts true values", () => {
        expect(
            countDonePrayers({
                subuh: true,
                dzuhur: true,
                ashar: false,
                maghrib: true,
                isya: false,
            }),
        ).toBe(3);
    });
    test("counts from full log", () => {
        expect(
            countDonePrayers({
                subuh: true,
                dzuhur: true,
                ashar: true,
                maghrib: true,
                isya: true,
            }),
        ).toBe(5);
    });
    test("returns 0 for empty", () => {
        expect(countDonePrayers({})).toBe(0);
    });
});

describe("normalizeGoal", () => {
    test("normalizes a complete goal", () => {
        const goal = {
            id: "1",
            title: "Read Quran",
            target: 30,
            progress: 5,
            type: "tilawah",
        };
        const result = normalizeGoal(goal);
        expect(result.title).toBe("Read Quran");
        expect(result.target).toBe(30);
        expect(result.current).toBe(5);
        expect(result.type).toBe("tilawah");
        expect(result.unit).toBe("halaman");
        expect(result.completed).toBe(false);
    });

    test("detects completed from is_completed", () => {
        expect(normalizeGoal({ id: "1", is_completed: true }).completed).toBe(
            true,
        );
    });

    test("detects completed from completed", () => {
        expect(normalizeGoal({ id: "1", completed: true }).completed).toBe(
            true,
        );
    });

    test("infers type from category Hadith", () => {
        const result = normalizeGoal({ id: "1", category: "Hadith" });
        expect(result.type).toBe("hadith");
        expect(result.unit).toBe("hadith");
    });

    test("infers type from category Quran", () => {
        const result = normalizeGoal({ id: "1", category: "Quran" });
        expect(result.type).toBe("tilawah");
        expect(result.unit).toBe("halaman");
    });

    test("handles unit from description", () => {
        const result = normalizeGoal({
            id: "1",
            description: "Unit: halaman",
            type: "custom",
        });
        expect(result.unit).toBe("halaman");
    });

    test("handles wrapped payload", () => {
        const result = normalizeGoal({ data: { id: "2", title: "Wrapped" } });
        expect(result.title).toBe("Wrapped");
    });
});

describe("isGoalCompleted", () => {
    test("true for completed goal", () => {
        expect(isGoalCompleted({ completed: true })).toBe(true);
    });
    test("false for incomplete goal", () => {
        expect(isGoalCompleted({ completed: false })).toBe(false);
    });
    test("false for no completed field", () => {
        expect(isGoalCompleted({})).toBe(false);
    });
});

describe("normalizeMuhasabah", () => {
    test("normalizes a complete entry", () => {
        const entry = {
            id: "1",
            content: "Hari ini baik",
            date: "2026-05-14",
            mood: "baik",
        };
        const result = normalizeMuhasabah(entry);
        expect(result.content).toBe("Hari ini baik");
        expect(result.date).toBe("2026-05-14");
        expect(result.mood).toBe("baik");
    });

    test("maps mood_score to mood", () => {
        const result = normalizeMuhasabah({ id: "1", mood_score: 5 });
        expect(result.mood).toBe("syukur");
    });

    test("falls back to notes field", () => {
        const result = normalizeMuhasabah({ id: "1", notes: "notes" });
        expect(result.content).toBe("notes");
    });

    test("uses today date as fallback", () => {
        const result = normalizeMuhasabah({ id: "1" });
        expect(result.date).toBe(todayISO());
    });
});

describe("muhasabahCreatePayload", () => {
    test("creates payload", () => {
        const result = muhasabahCreatePayload({
            content: "test",
            date: "2026-05-14",
            mood: "baik",
        });
        expect(result.content).toBe("test");
        expect(result.is_private).toBe(true);
        expect(result.mood_score).toBe(4);
    });
    test("defaults mood_score to 3", () => {
        const result = muhasabahCreatePayload({ content: "test" });
        expect(result.mood_score).toBe(3);
    });
});

describe("muhasabahUpdatePayload", () => {
    test("does not include date", () => {
        const result = muhasabahUpdatePayload({
            content: "test",
            mood: "syukur",
        });
        expect(result.content).toBe("test");
        expect(result.is_private).toBe(true);
        expect(result.mood_score).toBe(5);
        expect(result.date).toBeUndefined();
    });
});

describe("normalizeHafalan", () => {
    test("normalizes surah_id", () => {
        expect(normalizeHafalan({ surah_id: 1 }).status).toBe("not_started");
    });
    test("normalizes status", () => {
        expect(normalizeHafalan({ status: "hafal" }).status).toBe("memorized");
        expect(normalizeHafalan({ status: "belum" }).status).toBe(
            "not_started",
        );
        expect(normalizeHafalan({ status: "sedang" }).status).toBe(
            "in_progress",
        );
    });
    test("handles surah_number", () => {
        const result = normalizeHafalan({ surah_number: 36 });
        expect(result.surah_number).toBe(36);
    });
});

describe("isHafalanMemorized", () => {
    test("true for memorized", () => {
        expect(isHafalanMemorized({ status: "hafal" })).toBe(true);
    });
    test("false for others", () => {
        expect(isHafalanMemorized({ status: "sedang" })).toBe(false);
    });
    test("false for empty", () => {
        expect(isHafalanMemorized({})).toBe(false);
    });
});

describe("normalizeTilawahEntry", () => {
    test("normalizes pages value", () => {
        expect(normalizeTilawahEntry({ pages: 5 }).pages).toBe(5);
    });
    test("normalizes pages_read", () => {
        expect(normalizeTilawahEntry({ pages_read: 3 }).pages).toBe(3);
    });
    test("defaults pages to 0", () => {
        expect(normalizeTilawahEntry({}).pages).toBe(0);
    });
    test("adds date from today", () => {
        const result = normalizeTilawahEntry({});
        expect(result.date).toBe(todayISO());
    });
});

describe("sumTilawahPages", () => {
    test("sums pages from array", () => {
        const items = [{ pages: 2 }, { pages: 3 }];
        expect(sumTilawahPages(items)).toBe(5);
    });
    test("handles wrapped payload", () => {
        const items = { items: [{ pages: 5 }] };
        expect(sumTilawahPages(items)).toBe(5);
    });
    test("filters by predicate", () => {
        const items = [
            { pages: 2, date: "2026-05-01" },
            { pages: 3, date: "2026-05-02" },
        ];
        const result = sumTilawahPages(items, (date) => date === "2026-05-01");
        expect(result).toBe(2);
    });
    test("returns 0 for empty", () => {
        expect(sumTilawahPages([])).toBe(0);
    });
});

describe("normalizePersonalNote", () => {
    test("parses JSON content", () => {
        const note = {
            id: "1",
            content: JSON.stringify({
                title: "Note title",
                content: "Content",
                tags: ["islam"],
            }),
        };
        const result = normalizePersonalNote(note);
        expect(result.title).toBe("Note title");
        expect(result.content).toBe("Content");
        expect(result.tags).toEqual(["islam"]);
    });
    test("handles plain text content", () => {
        const note = { id: "1", content: "Plain text" };
        const result = normalizePersonalNote(note);
        expect(result.content).toBe("Plain text");
        expect(result.title).toBe("Catatan");
    });
});

describe("encodePersonalNoteContent", () => {
    test("encodes to JSON", () => {
        const result = JSON.parse(
            encodePersonalNoteContent({
                content: "test",
                tags: ["a"],
                title: "Title",
            }),
        );
        expect(result.title).toBe("Title");
        expect(result.tags).toEqual(["a"]);
    });
});

describe("constants", () => {
    test("PERSONAL_NOTE_REF_TYPE", () => {
        expect(PERSONAL_NOTE_REF_TYPE).toBe("personal");
    });
    test("PERSONAL_NOTE_REF_ID", () => {
        expect(PERSONAL_NOTE_REF_ID).toBe(0);
    });
});
