import { HelpCircle, Users } from "lucide-react-native";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { radius, spacing } from "../../theme";

const LEVEL_COLORS = {
    nabi: {
        bg: "#f3e8ff",
        border: "#c084fc",
        text: "#6b21a8",
        badge: "#faf5ff",
        badgeText: "#581c87",
        avatar: "#9333ea",
    },
    sahabat: {
        bg: "#fce7f3",
        border: "#f472b6",
        text: "#9d174d",
        badge: "#fdf2f8",
        badgeText: "#831843",
        avatar: "#db2777",
    },
    tabiin: {
        bg: "#fef3c7",
        border: "#fbbf24",
        text: "#92400e",
        badge: "#fffbeb",
        badgeText: "#78350f",
        avatar: "#d97706",
    },
    tabiut_tabiin: {
        bg: "#d1fae5",
        border: "#34d399",
        text: "#065f46",
        badge: "#ecfdf5",
        badgeText: "#064e3b",
        avatar: "#059669",
    },
    aimmah: {
        bg: "#dbeafe",
        border: "#60a5fa",
        text: "#1e40af",
        badge: "#eff6ff",
        badgeText: "#1e3a8a",
        avatar: "#2563eb",
    },
};

const SANAD_TREE_DATA = {
    id: 1,
    nama_latin: "Muhammad Rasulullah ﷺ",
    nama_arab: "مُحَمَّدٌ رَسُولُ اللَّهِ ﷺ",
    tabaqah: "Nabi & Rasul",
    levelKey: "nabi",
    status: "Nabi",
    tahun_wafat: 11,
    initial: "ﷺ",
    children: [
        {
            id: 3,
            nama_latin: "Abdullah bin Umar",
            nama_arab: "عَبْدُ اللَّهِ بْنُ عُمَرَ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Tsiqah",
            tahun_wafat: 73,
            initial: "U",
            branchKey: "ibnu_umar",
            children: [
                {
                    id: 6,
                    nama_latin: "Nafi' Maula Ibnu Umar",
                    nama_arab: "نَافِعٌ مَوْلَى ابْنِ عُمَرَ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 117,
                    initial: "N",
                    children: [
                        {
                            id: 8,
                            nama_latin: "Malik bin Anas",
                            nama_arab: "مَالِكُ بْنُ أَنَسٍ",
                            tabaqah: "Tabi'ut Tabi'in",
                            levelKey: "tabiut_tabiin",
                            status: "Imam Darul Hijrah",
                            tahun_wafat: 179,
                            initial: "M",
                            children: [
                                {
                                    id: 23,
                                    nama_latin: "Muhammad bin Idris asy-Syafi'i",
                                    nama_arab: "مُحَمَّدُ بْنُ إِدْرِيسَ الشَّافِعِيُّ",
                                    tabaqah: "Imam Mazhab",
                                    levelKey: "aimmah",
                                    status: "Nashirus Sunnah",
                                    tahun_wafat: 204,
                                    initial: "S",
                                    children: [
                                        {
                                            id: 22,
                                            nama_latin: "Ahmad bin Hanbal",
                                            nama_arab: "أَحْمَدُ بْنُ حَنْبَلٍ",
                                            tabaqah: "Imam Mazhab",
                                            levelKey: "aimmah",
                                            status: "Imam Ahlus Sunnah",
                                            tahun_wafat: 241,
                                            initial: "Ah",
                                            children: [
                                                {
                                                    id: 9,
                                                    nama_latin: "Muhammad bin Ismail al-Bukhari",
                                                    nama_arab: "مُحَمَّدُ بْنُ إِسْمَاعِيلَ البُخَارِيُّ",
                                                    tabaqah: "Shahih Bukhari",
                                                    levelKey: "aimmah",
                                                    status: "Amirul Mukminin",
                                                    tahun_wafat: 256,
                                                    initial: "B",
                                                },
                                                {
                                                    id: 10,
                                                    nama_latin: "Muslim bin al-Hajjaj",
                                                    nama_arab: "مُسْلِمُ بْنُ الحَجَّاجِ",
                                                    tabaqah: "Shahih Muslim",
                                                    levelKey: "aimmah",
                                                    status: "Imam Tsiqah",
                                                    tahun_wafat: 261,
                                                    initial: "Mu",
                                                },
                                                {
                                                    id: 11,
                                                    nama_latin: "Abu Dawud as-Sijistani",
                                                    nama_arab: "أَبُو دَاوُدَ السِّجِسْتَانِيُّ",
                                                    tabaqah: "Sunan Abu Dawud",
                                                    levelKey: "aimmah",
                                                    status: "Imam Muhaddits",
                                                    tahun_wafat: 275,
                                                    initial: "D",
                                                    children: [
                                                        {
                                                            id: 12,
                                                            nama_latin: "Muhammad bin Isa at-Tirmidzi",
                                                            nama_arab: "مُحَمَّدُ بْنُ عِيسَى التِّرْمِذِيُّ",
                                                            tabaqah: "Jami' at-Tirmidzi",
                                                            levelKey: "aimmah",
                                                            status: "Imam Al-Hafizh",
                                                            tahun_wafat: 279,
                                                            initial: "T",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 56,
                    nama_latin: "Ikrimah bin Khalid",
                    nama_arab: "عِكْرِمَةُ بْنُ خَالِدٍ",
                    tabaqah: "Thabaqah 4",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 114,
                    initial: "I",
                },
                {
                    id: 55,
                    nama_latin: "Hanzhalah bin Abu Sufyan",
                    nama_arab: "حَنْظَلَةُ بْنُ أَبِي سُفْيَانَ",
                    tabaqah: "Thabaqah 6",
                    levelKey: "tabiut_tabiin",
                    status: "Tsiqah Tsabat",
                    tahun_wafat: 151,
                    initial: "H",
                    children: [
                        {
                            id: 54,
                            nama_latin: "Ubaidullah bin Musa",
                            nama_arab: "عُبَيْدُ اللَّهِ بْنُ مُوسَى",
                            tabaqah: "Thabaqah 9",
                            levelKey: "aimmah",
                            status: "Tsiqah",
                            tahun_wafat: 213,
                            initial: "Ub",
                        },
                    ],
                },
            ],
        },
        {
            id: 2,
            nama_latin: "Abu Hurairah",
            nama_arab: "أَبُو هُرَيْرَةَ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Rawi Terbanyak",
            tahun_wafat: 57,
            initial: "H",
            branchKey: "abu_hurairah",
            children: [
                {
                    id: 20,
                    nama_latin: "Sa'id bin al-Musayyab",
                    nama_arab: "سَعِيدُ بْنُ المُسَيَّبِ",
                    tabaqah: "Sayyidut Tabi'in",
                    levelKey: "tabiin",
                    status: "Faqih Madinah",
                    tahun_wafat: 94,
                    initial: "M",
                },
                {
                    id: 21,
                    nama_latin: "Abu Salamah bin Abdurrahman",
                    nama_arab: "أَبُو سَلَمَةَ بْنُ عَبْدِ الرَّحْمَنِ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Faqih Madinah",
                    tahun_wafat: 104,
                    initial: "Sl",
                },
                {
                    id: 50,
                    nama_latin: "Atha' bin Yasar",
                    nama_arab: "عَطَاءُ بْنُ يَسَارٍ",
                    tabaqah: "Thabaqah 3",
                    levelKey: "tabiin",
                    status: "Tsiqah Fadlil",
                    tahun_wafat: 103,
                    initial: "Y",
                },
                {
                    id: 53,
                    nama_latin: "Amir bin Sa'd",
                    nama_arab: "عَامِرُ بْنُ سَعْدٍ",
                    tabaqah: "Thabaqah 3",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 104,
                    initial: "Am",
                    children: [
                        {
                            id: 52,
                            nama_latin: "Bukair bin Mismar",
                            nama_arab: "بُكَيْرُ بْنُ مِسْمَارٍ",
                            tabaqah: "Thabaqah 6",
                            levelKey: "tabiut_tabiin",
                            status: "Shaduq",
                            tahun_wafat: 150,
                            initial: "Bk",
                        },
                    ],
                },
                {
                    id: 61,
                    nama_latin: "Abu Zur'ah bin Amr bin Jarir",
                    nama_arab: "أَبُو زُرْعَةَ بْنُ عَمْرٍو",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    initial: "Z",
                    children: [
                        {
                            id: 60,
                            nama_latin: "Abu Hayyan at-Taimi",
                            nama_arab: "أَبُو حَيَّانَ التَّيْمِيُّ",
                            tabaqah: "Thabaqah 6",
                            levelKey: "tabiut_tabiin",
                            status: "Tsiqah",
                            tahun_wafat: 145,
                            initial: "Hy",
                            children: [
                                {
                                    id: 59,
                                    nama_latin: "Isma'il bin Ibrahim (Ibnu 'Ulayyah)",
                                    nama_arab: "إِسْمَاعِيلُ بْنُ إِبْرَاهِيمَ",
                                    tabaqah: "Thabaqah 8",
                                    levelKey: "tabiut_tabiin",
                                    status: "Hafizh Tsiqah",
                                    tahun_wafat: 193,
                                    initial: "Ul",
                                    children: [
                                        {
                                            id: 58,
                                            nama_latin: "Musaddad bin Musarhad",
                                            nama_arab: "مُسَدَّدُ بْنُ مُسَرْهَدٍ",
                                            tabaqah: "Thabaqah 10",
                                            levelKey: "aimmah",
                                            status: "Hafizh Bashrah",
                                            tahun_wafat: 228,
                                            initial: "Ms",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: 4,
            nama_latin: "Anas bin Malik",
            nama_arab: "أَنَسُ بْنُ مَالِكٍ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Tsiqah",
            tahun_wafat: 93,
            initial: "A",
            branchKey: "anas_bin_malik",
            children: [
                {
                    id: 7,
                    nama_latin: "Ibnu Syihab az-Zuhri",
                    nama_arab: "مُحَمَّدُ بْنُ مُسْلِمٍ الزُّهْرِيُّ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Imam Al-Hafizh",
                    tahun_wafat: 124,
                    initial: "Zh",
                    children: [
                        {
                            id: 13,
                            nama_latin: "Qutaibah bin Sa'id",
                            nama_arab: "قُتَيْبَةُ بْنُ سَعِيدٍ",
                            tabaqah: "Thabaqah 5",
                            levelKey: "tabiut_tabiin",
                            status: "Tsiqah Tsabat",
                            tahun_wafat: 240,
                            initial: "Q",
                        },
                    ],
                },
                {
                    id: 64,
                    nama_latin: "Qatadah bin Di'amah",
                    nama_arab: "قَتَادَةُ بْنُ دِعَامَةَ",
                    tabaqah: "Thabaqah 4",
                    levelKey: "tabiin",
                    status: "Hafizh Mufassir",
                    tahun_wafat: 117,
                    initial: "Qt",
                    children: [
                        {
                            id: 63,
                            nama_latin: "Syu'bah bin al-Hajjaj",
                            nama_arab: "شُعْبَةُ بْنُ الحَجَّاجِ",
                            tabaqah: "Thabaqah 7",
                            levelKey: "tabiut_tabiin",
                            status: "Amirul Mukminin",
                            tahun_wafat: 160,
                            initial: "Sy",
                            children: [
                                {
                                    id: 62,
                                    nama_latin: "Yahya bin Sa'id al-Qattan",
                                    nama_arab: "يَحْيَى بْنُ سَعِيدٍ القَطَّانُ",
                                    tabaqah: "Thabaqah 9",
                                    levelKey: "aimmah",
                                    status: "Imam Naqid",
                                    tahun_wafat: 198,
                                    initial: "Yh",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: 5,
            nama_latin: "Aisyah Ummul Mukminin",
            nama_arab: "عَائِشَةُ أُمُّ المُؤْمِنِينَ",
            tabaqah: "Sahabat (Faqihah)",
            levelKey: "sahabat",
            status: "Tsiqah",
            tahun_wafat: 58,
            initial: "Ai",
            branchKey: "aisyah",
            children: [
                {
                    id: 49,
                    nama_latin: "Abu Suhail Nafi' bin Malik",
                    nama_arab: "أَبُو سُهَيْلٍ نَافِعُ بْنُ مَالِكٍ",
                    tabaqah: "Thabaqah 4",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 140,
                    initial: "Sh",
                    children: [
                        {
                            id: 48,
                            nama_latin: "Ismail bin Ja'far",
                            nama_arab: "إِسْمَاعِيلُ بْنُ جَعْفَرٍ",
                            tabaqah: "Thabaqah 8",
                            levelKey: "tabiut_tabiin",
                            status: "Qari & Tsiqah",
                            tahun_wafat: 180,
                            initial: "J",
                            children: [
                                {
                                    id: 51,
                                    nama_latin: "Sulaiman Abu ar-Rabi'",
                                    nama_arab: "سُلَيْمَانُ أَبُو الرَّبِيعِ",
                                    tabaqah: "Thabaqah 10",
                                    levelKey: "aimmah",
                                    status: "Tsiqah",
                                    tahun_wafat: 234,
                                    initial: "Sl",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: 14,
            nama_latin: "Umar bin Khattab",
            nama_arab: "عُمَرُ بْنُ الخَطَّابِ",
            tabaqah: "Khulafaur Rasyidin",
            levelKey: "sahabat",
            status: "Amirul Mukminin",
            tahun_wafat: 23,
            initial: "Um",
            branchKey: "sahabat_lainnya",
            children: [
                {
                    id: 57,
                    nama_latin: "Malik bin Abi 'Amir",
                    nama_arab: "مَالِكُ بْنُ أَبِي عَامِرٍ",
                    tabaqah: "Kibarut Tabi'in",
                    levelKey: "tabiin",
                    status: "Kakek Imam Malik",
                    tahun_wafat: 74,
                    initial: "Ma",
                },
            ],
        },
        {
            id: 15,
            nama_latin: "Ali bin Abi Talib",
            nama_arab: "عَلِيُّ بْنُ أَبِي طَالِبٍ",
            tabaqah: "Khulafaur Rasyidin",
            levelKey: "sahabat",
            status: "Amirul Mukminin",
            tahun_wafat: 40,
            initial: "Al",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 16,
            nama_latin: "Abdullah bin Abbas",
            nama_arab: "عَبْدُ اللَّهِ بْنُ عَبَّاسٍ",
            tabaqah: "Habrul Ummah",
            levelKey: "sahabat",
            status: "Tarjumanul Quran",
            tahun_wafat: 68,
            initial: "Ab",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 17,
            nama_latin: "Jabir bin Abdullah",
            nama_arab: "جَابِرُ بْنُ عَبْدِ اللَّهِ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Muktsirun",
            tahun_wafat: 78,
            initial: "Jb",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 18,
            nama_latin: "Abu Sa'id al-Khudri",
            nama_arab: "أَبُو سَعِيدٍ الخُدْرِيُّ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Muktsirun",
            tahun_wafat: 74,
            initial: "Kh",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 19,
            nama_latin: "Abdullah bin Mas'ud",
            nama_arab: "عَبْدُ اللَّهِ بْنُ مَسْعُودٍ",
            tabaqah: "Sahabat (Faqih Kufah)",
            levelKey: "sahabat",
            status: "Kibarush Shahabah",
            tahun_wafat: 32,
            initial: "Ms",
            branchKey: "sahabat_lainnya",
        },
    ],
};

function getQualityTier(status) {
    if (!status) return "tsiqah";
    const s = status.toLowerCase();
    if (
        s.includes("dhaif") ||
        s.includes("layyin") ||
        s.includes("majhul") ||
        s.includes("matruk") ||
        s.includes("kadzdzab")
    ) {
        return "dhaif";
    }
    if (
        s.includes("shaduq") ||
        s.includes("maqbul") ||
        s.includes("la ba") ||
        s.includes("hasan")
    ) {
        return "shaduq";
    }
    return "tsiqah";
}

function MobileOrgCard({ node, onOpenPerawi, isRoot = false, qualityFilter = "all" }) {
    const levelStyle = LEVEL_COLORS[node.levelKey] || LEVEL_COLORS.tabiin;
    const tier = getQualityTier(node.status);
    const isQualityMatch = qualityFilter === "all" || tier === qualityFilter;
    const isFaded = qualityFilter !== "all" && !isQualityMatch;

    return (
        <Pressable
            accessibilityRole='button'
            onPress={() => onOpenPerawi && onOpenPerawi(node)}
            style={({ pressed }) => [
                styles.card,
                {
                    borderColor:
                        qualityFilter !== "all" && isQualityMatch
                            ? tier === "tsiqah"
                                ? "#059669"
                                : tier === "shaduq"
                                  ? "#2563eb"
                                  : "#dc2626"
                            : isRoot
                              ? "#c084fc"
                              : levelStyle.border,
                    borderTopColor:
                        qualityFilter !== "all" && isQualityMatch
                            ? tier === "tsiqah"
                                ? "#059669"
                                : tier === "shaduq"
                                  ? "#2563eb"
                                  : "#dc2626"
                            : isRoot
                              ? "#9333ea"
                              : levelStyle.border,
                    backgroundColor: "#ffffff",
                    opacity: isFaded ? 0.3 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                },
            ]}
        >
            {/* Top Badge Avatar */}
            <View
                style={[
                    styles.avatarBadge,
                    { backgroundColor: levelStyle.avatar },
                ]}
            >
                <Text style={styles.avatarText}>
                    {node.initial || (node.nama_latin ? node.nama_latin[0] : "?")}
                </Text>
            </View>

            {/* Tabaqah pill */}
            <View
                style={[
                    styles.tabaqahPill,
                    { backgroundColor: levelStyle.bg },
                ]}
            >
                <Text
                    numberOfLines={1}
                    style={[styles.tabaqahText, { color: levelStyle.text }]}
                >
                    {node.tabaqah}
                </Text>
            </View>

            {/* Arabic Name */}
            {node.nama_arab ? (
                <Text numberOfLines={1} style={styles.arabicName}>
                    {node.nama_arab}
                </Text>
            ) : null}

            {/* Latin Name */}
            <Text numberOfLines={2} style={styles.latinName}>
                {node.nama_latin}
            </Text>

            {/* Meta */}
            <View style={styles.metaRow}>
                {node.tahun_wafat ? (
                    <Text style={styles.metaText}>w. {node.tahun_wafat} H</Text>
                ) : null}
                {node.status ? (
                    <Text numberOfLines={1} style={styles.statusText}>
                        • {node.status}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    );
}

function MobileOrgTreeNode({ node, onOpenPerawi, isRoot = false, qualityFilter = "all" }) {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <View style={styles.nodeWrapper}>
            <MobileOrgCard
                node={node}
                onOpenPerawi={onOpenPerawi}
                isRoot={isRoot}
                qualityFilter={qualityFilter}
            />

            {hasChildren ? (
                <View style={styles.branchWrapper}>
                    {/* Stem down from parent */}
                    <View style={styles.verticalStem} />

                    {/* Children row with horizontal crossbar */}
                    <View style={styles.childrenRowContainer}>
                        {node.children.length > 1 ? (
                            <View style={styles.horizontalBar} />
                        ) : null}

                        <View style={styles.childrenRow}>
                            {node.children.map((child, idx) => (
                                <View key={child.id || idx} style={styles.childBranch}>
                                    <View style={styles.verticalDropLine} />
                                    <MobileOrgTreeNode
                                        node={child}
                                        onOpenPerawi={onOpenPerawi}
                                        qualityFilter={qualityFilter}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

export function PerawiSanadTreeMobile({ onOpenPerawi }) {
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [qualityFilter, setQualityFilter] = useState("all");

    const filteredTree = {
        ...SANAD_TREE_DATA,
        children:
            selectedBranch === "all"
                ? SANAD_TREE_DATA.children
                : SANAD_TREE_DATA.children.filter((c) =>
                      selectedBranch === "sahabat_lainnya"
                          ? c.branchKey === "sahabat_lainnya"
                          : c.branchKey === selectedBranch,
                  ),
    };

    return (
        <View style={styles.container}>
            {/* Header info */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Users color='#0f766e' size={18} />
                    <Text style={styles.title}>Bagan Silsilah Sanad (40 Perawi)</Text>
                </View>
                <Text style={styles.subtitle}>
                    Transmisi sanad dari Rasulullah ﷺ ke Sahabat hingga Aimmah
                </Text>
            </View>

            {/* Quality Filter Chips */}
            <View style={styles.qualityFilterRow}>
                {[
                    { key: "all", label: "Semua Kualitas" },
                    { key: "tsiqah", label: "Tsiqah (Shahih)" },
                    { key: "shaduq", label: "Shaduq (Hasan)" },
                    { key: "dhaif", label: "Dhaif" },
                ].map(({ key, label }) => (
                    <Pressable
                        key={key}
                        onPress={() => setQualityFilter(key)}
                        style={[
                            styles.qualityChip,
                            qualityFilter === key && styles.qualityChipActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.qualityChipText,
                                qualityFilter === key && styles.qualityChipTextActive,
                            ]}
                        >
                            {label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Branch Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                {[
                    { key: "all", label: "Semua Jalur (40)" },
                    { key: "ibnu_umar", label: "Ibnu Umar (Emas)" },
                    { key: "abu_hurairah", label: "Abu Hurairah" },
                    { key: "anas_bin_malik", label: "Anas bin Malik" },
                    { key: "aisyah", label: "Aisyah r.a." },
                    { key: "sahabat_lainnya", label: "Sahabat Lainnya" },
                ].map(({ key, label }) => (
                    <Pressable
                        key={key}
                        onPress={() => setSelectedBranch(key)}
                        style={[
                            styles.filterChip,
                            selectedBranch === key && styles.filterChipActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                selectedBranch === key &&
                                    styles.filterChipTextActive,
                            ]}
                        >
                            {label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Scrollable Diagram Canvas */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                contentContainerStyle={styles.canvasContainer}
            >
                <View style={styles.canvasInner}>
                    <MobileOrgTreeNode
                        node={filteredTree}
                        onOpenPerawi={onOpenPerawi}
                        isRoot
                        qualityFilter={qualityFilter}
                    />
                </View>
            </ScrollView>

            {/* Footer Hint */}
            <View style={styles.footer}>
                <HelpCircle color='#0f766e' size={14} />
                <Text style={styles.footerText}>
                    Ketuk perawi untuk melihat biografi & jarh wa ta&apos;dil lengkap.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#f8fafc",
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        padding: spacing.md,
        marginVertical: spacing.sm,
    },
    header: {
        marginBottom: spacing.sm,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    title: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
    },
    subtitle: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    qualityFilterRow: {
        flexDirection: "row",
        gap: 6,
        paddingBottom: spacing.xs,
        flexWrap: "wrap",
    },
    qualityChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.md,
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    qualityChipActive: {
        backgroundColor: "#0d9488",
        borderColor: "#0d9488",
    },
    qualityChipText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#64748b",
    },
    qualityChipTextActive: {
        color: "#ffffff",
    },
    filterRow: {
        flexDirection: "row",
        gap: 6,
        paddingBottom: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
    },
    filterChipActive: {
        backgroundColor: "#0f766e",
        borderColor: "#0f766e",
    },
    filterChipText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#475569",
    },
    filterChipTextActive: {
        color: "#ffffff",
    },
    canvasContainer: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    canvasInner: {
        alignItems: "center",
    },
    nodeWrapper: {
        alignItems: "center",
    },
    card: {
        width: 140,
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 8,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderTopWidth: 3.5,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    avatarBadge: {
        position: "absolute",
        top: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#ffffff",
    },
    avatarText: {
        color: "#ffffff",
        fontSize: 9,
        fontWeight: "800",
    },
    tabaqahPill: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: radius.full,
        marginBottom: 3,
    },
    tabaqahText: {
        fontSize: 8,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    arabicName: {
        fontSize: 11,
        fontFamily: "Amiri, serif",
        color: "#475569",
        textAlign: "center",
        marginBottom: 1,
    },
    latinName: {
        fontSize: 11,
        fontWeight: "700",
        color: "#0f172a",
        textAlign: "center",
        lineHeight: 14,
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    metaText: {
        fontSize: 9,
        color: "#94a3b8",
    },
    statusText: {
        fontSize: 9,
        fontWeight: "600",
        color: "#0f766e",
    },
    branchWrapper: {
        alignItems: "center",
        width: "100%",
    },
    verticalStem: {
        width: 2,
        height: 16,
        backgroundColor: "#cbd5e1",
    },
    childrenRowContainer: {
        alignItems: "center",
        paddingTop: 16,
        position: "relative",
    },
    horizontalBar: {
        position: "absolute",
        top: 0,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: "#cbd5e1",
    },
    childrenRow: {
        flexDirection: "row",
        gap: 12,
        justifyContent: "center",
    },
    childBranch: {
        alignItems: "center",
        position: "relative",
    },
    verticalDropLine: {
        position: "absolute",
        top: -16,
        width: 2,
        height: 16,
        backgroundColor: "#cbd5e1",
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: spacing.xs,
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    footerText: {
        fontSize: 10,
        color: "#64748b",
        flex: 1,
    },
});
