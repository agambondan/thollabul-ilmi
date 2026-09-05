import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SURAH_LIST } from "../constants/surahList";

const HADITH_SLUG_MAP = {
    abudaud: "abudaud",
    abudawud: "abudaud",
    ahmad: "ahmad",
    annasai: "nasai",
    "an-nasai": "nasai",
    "at-tirmidzi": "tirmidzi",
    bukhari: "bukhari",
    darimi: "darimi",
    "ibnu-majah": "ibnumajah",
    ibnmajah: "ibnumajah",
    ibnumajah: "ibnumajah",
    malik: "malik",
    muslim: "muslim",
    nasai: "nasai",
    tirmidzi: "tirmidzi",
    tirmidhi: "tirmidzi",
    "abu-daud": "abudaud",
};

const normalizeKey = (value) =>
    value.toLowerCase().replace(/['’.-]/g, "").replace(/\s+/g, "");

const HADITH_BOOKS =
    "Bukhari|Muslim|Abu Dawud|Tirmidzi|Ibnu Majah|Nasai|Ahmad|Malik|Darimi|at-Tirmidzi|an-Nasa'i";

const QS_PATTERN = /QS\.\s*([^:]+):\s*([\d-]+)/i;

const tokenizeParts = (source) =>
    source
        .split(/[;\n]/)
        .flatMap((segment) => segment.split(/\s*,\s*|\s*&\s*|\s+\bdan\b\s+/i))
        .map((s) => s.trim())
        .filter(Boolean);

const resolveSurahNumber = (surahName) => {
    const clean = normalizeKey(surahName);
    const match = SURAH_LIST.find((s) => {
        return (
            normalizeKey(s.name) === clean ||
            (s.name_en && normalizeKey(s.name_en) === clean) ||
            s.number === Number(surahName)
        );
    });
    return match ? match.number : Number.isFinite(Number(surahName)) ? Number(surahName) : null;
};

export function parseSourceMobile(source) {
    if (!source) return [];
    const refs = [];

    for (const part of tokenizeParts(source)) {
        const hrMatch = part.match(
            new RegExp(
                `^(?:HR\\.?|H\\.R\\.?)?\\s*(${HADITH_BOOKS})\\s+(?:No\\.\\s*)?(\\d+)`,
                "i",
            ),
        );
        if (hrMatch) {
            const bookKey = normalizeKey(hrMatch[1]);
            const slug = HADITH_SLUG_MAP[bookKey];
            const num = Number(hrMatch[2]);
            if (slug && Number.isFinite(num)) {
                refs.push({
                    text: `HR. ${hrMatch[1].trim()} No. ${num}`,
                    tab: "hadith",
                    params: { bookSlug: slug, hadithNumber: num, hadithId: num },
                });
                continue;
            }
        }

        const qsMatch = part.match(QS_PATTERN);
        if (qsMatch) {
            const surahName = qsMatch[1].trim();
            const ayahPart = qsMatch[2].split("-")[0];
            const surahNum = resolveSurahNumber(surahName);
            const ayahNum = Number(ayahPart);
            if (surahNum) {
                refs.push({
                    text: part,
                    tab: "quran",
                    params: {
                        surahNumber: surahNum,
                        ayahNumber: Number.isFinite(ayahNum) ? ayahNum : null,
                    },
                });
                continue;
            }
        }

        refs.push({ text: part, tab: null, params: null });
    }

    return refs;
}

export default function SourceBadges({ source, onOpenTab, style }) {
    if (!source) return null;
    const refs = parseSourceMobile(source);
    if (refs.length === 0) return null;

    return (
        <View style={[styles.container, style]}>
            {refs.map((ref, index) => {
                if (ref.tab && onOpenTab) {
                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.7}
                            onPress={() => onOpenTab(ref.tab, ref.params)}
                            style={styles.badgeLink}
                        >
                            <Text style={styles.linkText}>{ref.text}</Text>
                        </TouchableOpacity>
                    );
                }
                return (
                    <Text key={index} style={styles.plainText}>
                        {ref.text}
                    </Text>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
    },
    badgeLink: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    linkText: {
        color: "#059669",
        fontSize: 11,
        fontWeight: "600",
    },
    plainText: {
        color: "#9ca3af",
        fontSize: 11,
    },
});
