import {
    Activity,
    Award,
    Bell,
    Book,
    Bookmark,
    BookOpen,
    BookOpenCheck,
    ChevronRight,
    Clock,
    Compass,
    FileText,
    Globe,
    Grid,
    Heart,
    HelpCircle,
    Home,
    Layers,
    Library,
    LogOut,
    Moon,
    Palette,
    RotateCcw,
    Search,
    Settings,
    Smile,
    Sun,
    Target,
    Trophy,
    User,
    Video,
} from "lucide-react";
import { useEffect, useState } from "react";

const i18n = {
    id: {
        home: "Beranda",
        quran: "Al-Qur'an",
        ibadah: "Ibadah",
        ilmu: "Ilmu",
        profil: "Profil",
        search: "Cari konten...",
        nextPrayer: "Waktu Ashar",
        tracker: "Tracker Sholat 5 Waktu",
        qibla: "Arah Kiblat",
        memorize: "Hafalan",
        journal: "Jurnal",
        quiz: "Kuis",
        lecture: "Kajian",
        tafsir: "Tafsir",
        hadith: "Hadith",
        others: "Lainnya",
        zakat: "Zakat",
        narrator: "Ensiklopedia Perawi",
        journalTitle: "Jurnal Muhasabah",
        journalDesc: "Bagaimana kondisi imanmu hari ini?",
        surah: "Surah",
        murojaah: "Murojaah",
        tasbih: "Penghitung Tasbih",
        dailyDeeds: "Amalan Harian",
        manasik: "Manasik",
        fiqh: "Fiqh Ringkas",
        siroh: "Siroh",
        sanad: "Jalur Sanad",
        tahajud: "Sholat Tahajud",
        dhuha: "Sholat Dhuha",
        charity: "Sedekah Harian",
        calTitle: "Kalender Puasa",
        calDesc: "Cek jadwal puasa sunnah & wajib",
        latestLec: "Kajian Terbaru",
        featArt: "Artikel Pilihan",
        points: "Total Poin",
        streak: "Streak Aktif",
        badges: "Pencapaian",
        leaderboard: "Papan Peringkat",
        target: "Target Belajar",
        logout: "Keluar Akun",
        resume: "Lanjutkan Belajar",
        loadMore: "Muat lebih banyak...",
        emptyState: "Belum ada data tercatat.",
        mufrodat: "Kosakata (Mufrodat)",
        asbab: "Asbabun Nuzul",
        noReading: "Belum ada riwayat bacaan.",
        guest: "Hamba Allah",
        emptyLecture: "Belum ada jadwal kajian terbaru.",
        emptyArticles: "Eksplorasi pustaka artikel kami.",
        emptyHadith: "Riwayat bacaan hadith kosong.",
        emptyNarrator: "Cari nama perawi untuk memulai.",
        emptySanad: "Jalur sanad akan tampil di sini.",
    },
    en: {
        home: "Home",
        quran: "Quran",
        ibadah: "Worship",
        ilmu: "Learn",
        profil: "Profile",
        search: "Search...",
        nextPrayer: "Next: Asr",
        tracker: "Daily Prayer Tracker",
        qibla: "Qibla",
        memorize: "Memory",
        journal: "Journal",
        quiz: "Quiz",
        lecture: "Lectures",
        tafsir: "Tafsir",
        hadith: "Hadith",
        others: "More",
        zakat: "Zakah",
        narrator: "Narrators",
        journalTitle: "Daily Reflection",
        journalDesc: "How is your faith today?",
        surah: "Surah",
        murojaah: "Review",
        tasbih: "Tasbih",
        dailyDeeds: "Daily Deeds",
        manasik: "Pilgrimage",
        fiqh: "Fiqh",
        siroh: "Seerah",
        sanad: "Sanad Chain",
        tahajud: "Tahajud",
        dhuha: "Duha",
        charity: "Charity",
        calTitle: "Fasting Calendar",
        calDesc: "Check sunnah & fard fasting",
        latestLec: "Latest Lectures",
        featArt: "Featured Articles",
        points: "Total Points",
        streak: "Active Streak",
        badges: "Achievements",
        leaderboard: "Leaderboard",
        target: "Study Goals",
        logout: "Sign Out",
        resume: "Resume Learning",
        loadMore: "Load more...",
        emptyState: "No data recorded yet.",
        mufrodat: "Vocabulary",
        asbab: "Context (Asbab)",
        noReading: "No reading history.",
        guest: "Guest User",
        emptyLecture: "No recent lectures available.",
        emptyArticles: "Explore our article library.",
        emptyHadith: "Hadith reading history is empty.",
        emptyNarrator: "Search for a narrator to begin.",
        emptySanad: "Sanad chain will appear here.",
    },
};

export default function App() {
    const [theme, setTheme] = useState("earth"); // Default ke Paper
    const [isDark, setIsDark] = useState(false);
    const [lang, setLang] = useState("id");
    const [activeTab, setActiveTab] = useState("home");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const t = (key) => i18n[lang][key] || key;

    // Unified Design Token System (Focused strictly on Earth/Paper and Clean/Teal)
    const getSys = (thm, d) => {
        const base = {
            font: "font-sans",
            pillCont: "flex overflow-x-auto gap-2 pb-2 hide-scrollbar mt-2",
            heroExtra: null,
        };

        switch (thm) {
            case "earth":
                return {
                    ...base,
                    frame: d
                        ? "bg-[#252825] border-[#1a1c1a]"
                        : "bg-[#f5f2eb] border-[#3c3a35]",
                    bg: d
                        ? "bg-[#252825] text-[#e6e2d6]"
                        : "bg-[#fefdf9] text-[#3c3a35]",
                    card: d
                        ? "bg-[#2c332c] border-[#3e453e] shadow-none"
                        : "bg-[#f5f2eb] border-[#e6e2d6] shadow-sm",
                    text: d ? "text-[#e6e2d6]" : "text-[#3c3a35]",
                    mut: d ? "text-[#8c8577]" : "text-[#8c8577]",
                    acc: d ? "text-[#e6e2d6]" : "text-[#5b6e5b]",
                    accBg: d
                        ? "bg-[#3e453e] text-[#e6e2d6] border border-[#e6e2d6]/10"
                        : "bg-[#5b6e5b] text-white",
                    font: "font-serif",
                    navBg: d
                        ? "bg-[#1a1c1a] border-[#2c332c]"
                        : "bg-[#2c332c] border-[#3c3a35]",
                    navAct: d
                        ? "bg-[#3e453e] text-[#e6e2d6]"
                        : "bg-[#5b6e5b] text-stone-100",
                    navDef: d ? "text-stone-500" : "text-stone-400",
                    navCont:
                        "absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] rounded-[1.5rem] shadow-xl border px-3 py-2 z-50 flex justify-between items-center",
                    pillAct: d
                        ? "bg-[#e6e2d6] text-[#2c332c]"
                        : "bg-[#5b6e5b] text-stone-100",
                    pillDef: d
                        ? "bg-transparent text-[#8c8577] border border-[#3e453e]"
                        : "bg-transparent text-[#8c8577] border border-[#e6e2d6]",
                    hero: d
                        ? "bg-[#2c332c] border border-[#3e453e] text-[#e6e2d6]"
                        : "bg-[#5b6e5b] text-[#fefdf9]",
                    iconBg: d
                        ? "bg-[#1a1c1a] border border-[#3e453e]"
                        : "bg-[#f0ece1] border border-[#e6e2d6]",
                };
            case "clean":
                return {
                    ...base,
                    frame: d
                        ? "bg-slate-950 border-slate-900"
                        : "bg-slate-50 border-gray-900",
                    bg: d
                        ? "bg-slate-950 text-slate-100"
                        : "bg-slate-50 text-gray-800",
                    card: d
                        ? "bg-slate-900 border-slate-800 shadow-none"
                        : "bg-white border-gray-100 shadow-sm",
                    text: d ? "text-white" : "text-gray-800",
                    mut: d ? "text-slate-400" : "text-gray-500",
                    acc: d ? "text-teal-400" : "text-teal-600",
                    accBg: d
                        ? "bg-teal-900/50 text-teal-400 border border-teal-800"
                        : "bg-teal-50 text-teal-700",
                    navBg: d
                        ? "bg-slate-900 border-slate-800"
                        : "bg-white border-gray-200",
                    navAct: d
                        ? "bg-teal-900/50 text-teal-400"
                        : "bg-teal-50 text-teal-600",
                    navDef: d ? "text-slate-500" : "text-gray-400",
                    navCont:
                        "absolute bottom-0 w-full border-t flex justify-between items-center px-4 py-2 z-50",
                    pillAct: d
                        ? "bg-teal-900/50 text-teal-400 border-none"
                        : "bg-teal-50 text-teal-700 border-none",
                    pillDef: d
                        ? "bg-slate-800 text-slate-400 border-none"
                        : "bg-gray-100 text-gray-500 border-none",
                    hero: d
                        ? "bg-gradient-to-r from-teal-900 to-slate-900 border border-teal-900/50 text-white"
                        : "bg-gradient-to-r from-teal-600 to-teal-800 text-white",
                    heroExtra: (
                        <div className='absolute -right-4 -top-4 opacity-10 pointer-events-none'>
                            <Moon size={80} />
                        </div>
                    ),
                    iconBg: d
                        ? "bg-slate-800 border border-slate-700"
                        : "bg-gray-50 border border-gray-100",
                };
            default:
                return base;
        }
    };

    const sys = getSys(theme, isDark);

    return (
        <div className='min-h-screen bg-gray-200 flex flex-col items-center justify-center p-4 font-sans selection:bg-teal-200'>
            {/* Top Controls */}
            <div className='w-full max-w-[400px] flex justify-between items-center mb-3'>
                <button
                    onClick={() => setLang(lang === "id" ? "en" : "id")}
                    className='bg-white px-3 py-1.5 rounded-full text-xs font-bold shadow flex items-center gap-1.5 text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform border border-gray-200'
                >
                    <Globe size={14} className='text-blue-500' />{" "}
                    {lang.toUpperCase()}
                </button>
                <button
                    onClick={() => setIsDark(!isDark)}
                    className='bg-white px-3 py-1.5 rounded-full text-xs font-bold shadow flex items-center gap-1.5 text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform border border-gray-200'
                >
                    {isDark ? (
                        <Sun size={14} className='text-amber-500' />
                    ) : (
                        <Moon size={14} className='text-indigo-500' />
                    )}
                    {isDark ? "Light" : "Dark"}
                </button>
            </div>

            {/* Theme Switcher */}
            <div className='mb-4 flex flex-col items-center bg-white p-2.5 rounded-2xl shadow-md gap-1 z-50 max-w-[400px] w-full border border-gray-300'>
                <div className='flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest w-full px-2 mb-1'>
                    <Palette size={14} /> Pilih Tema UI:
                </div>
                <div className='flex gap-2 justify-center w-full'>
                    <ThemeBtn
                        current={theme}
                        val='earth'
                        label='Paper (Organik)'
                        color='bg-[#5b6e5b] text-stone-100'
                        setTheme={setTheme}
                    />
                    <ThemeBtn
                        current={theme}
                        val='clean'
                        label='Teal (Modern)'
                        color='bg-teal-600 text-white'
                        setTheme={setTheme}
                    />
                </div>
            </div>

            {/* Phone Frame */}
            <div
                className={`w-full max-w-[400px] h-[800px] rounded-[2.5rem] shadow-2xl relative overflow-hidden border-[10px] flex flex-col transition-colors duration-500 ${sys.frame} ${sys.font}`}
            >
                <div className={`flex-col h-full ${sys.bg} flex`}>
                    {/* Main Content Area */}
                    <div className='flex-1 overflow-y-auto pb-24 hide-scrollbar relative z-10'>
                        {activeTab === "home" && <HomeTab sys={sys} t={t} />}
                        {activeTab === "quran" && <QuranTab sys={sys} t={t} />}
                        {activeTab === "ibadah" && (
                            <IbadahTab sys={sys} t={t} />
                        )}
                        {activeTab === "ilmu" && <IlmuTab sys={sys} t={t} />}
                        {activeTab === "profil" && (
                            <ProfilTab sys={sys} t={t} />
                        )}
                    </div>

                    {/* Universal Bottom Nav */}
                    <div className={`${sys.navCont} ${sys.navBg}`}>
                        <NavItem
                            sys={sys}
                            icon={<Home size={20} />}
                            label={t("home")}
                            active={activeTab === "home"}
                            onClick={() => setActiveTab("home")}
                        />
                        <NavItem
                            sys={sys}
                            icon={<BookOpen size={20} />}
                            label={t("quran")}
                            active={activeTab === "quran"}
                            onClick={() => setActiveTab("quran")}
                        />
                        <NavItem
                            sys={sys}
                            icon={<Heart size={20} />}
                            label={t("ibadah")}
                            active={activeTab === "ibadah"}
                            onClick={() => setActiveTab("ibadah")}
                        />
                        <NavItem
                            sys={sys}
                            icon={<Book size={20} />}
                            label={t("ilmu")}
                            active={activeTab === "ilmu"}
                            onClick={() => setActiveTab("ilmu")}
                        />
                        <NavItem
                            sys={sys}
                            icon={<User size={20} />}
                            label={t("profil")}
                            active={activeTab === "profil"}
                            onClick={() => setActiveTab("profil")}
                        />
                    </div>
                </div>
            </div>
            <style
                dangerouslySetInnerHTML={{
                    __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`,
                }}
            />
        </div>
    );
}

const ThemeBtn = ({ current, val, label, color, setTheme }) => (
    <button
        onClick={() => setTheme(val)}
        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border border-transparent ${current === val ? color + " shadow-sm scale-[1.02]" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"}`}
    >
        {label}
    </button>
);

const NavItem = ({ sys, icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex flex-col items-center gap-0.5 cursor-pointer p-1.5 transition-all ${active ? sys.navAct : sys.navDef} ${sys.navCont.includes("rounded-full") && active ? "rounded-full" : "rounded-xl"}`}
    >
        {icon}
        <span
            className={`text-[8px] font-bold mt-0.5 tracking-wider ${active ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}
        >
            {label}
        </span>
    </div>
);

// --- STRICT DATA CONSTRAINTS (No Fake/Local Data representing user content) ---
const mockSurahIndex = [
    { n: 1, s: "Al-Fatihah", a: "الفاتحة" },
    { n: 2, s: "Al-Baqarah", a: "البقرة" },
    { n: 3, s: "Ali 'Imran", a: "آل عمران" },
];
const emptySholatState = [
    { id: "S", done: false },
    { id: "D", done: false },
    { id: "A", done: false },
    { id: "M", done: false },
    { id: "I", done: false },
];
const staticBadges = [
    { id: 1, name: "Pejuang", icon: "🌅" },
    { id: 2, name: "Khatam", icon: "📖" },
    { id: 3, name: "Streak", icon: "🔥" },
    { id: 4, name: "Ahli", icon: "📚" },
];

const EmptyState = ({ sys, msg, icon: IconComponent }) => (
    <div
        className={`w-full flex flex-col items-center justify-center py-12 opacity-50 ${sys.mut}`}
    >
        {IconComponent ? (
            <IconComponent size={40} className='mb-4 opacity-50' />
        ) : (
            <Library size={40} className='mb-4 opacity-50' />
        )}
        <p className='text-[10px] font-bold uppercase tracking-widest text-center px-6 leading-relaxed'>
            {msg}
        </p>
    </div>
);

/* ==========================================================================
   UNIVERSAL TABS
   ========================================================================== */

const HomeTab = ({ sys, t }) => (
    <div className='flex flex-col gap-3 p-4'>
        {/* Header */}
        <div
            className={`flex justify-between items-center mt-4 mb-2 border-b pb-3 ${sys.card.split(" ")[1]}`}
        >
            <div className='flex items-center gap-3'>
                <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${sys.iconBg} ${sys.mut}`}
                >
                    <User size={16} />
                </div>
                <div>
                    <h1
                        className={`text-sm font-bold leading-tight ${sys.text}`}
                    >
                        {t("guest")}
                    </h1>
                    <p
                        className={`text-[9px] uppercase tracking-widest font-bold ${sys.mut}`}
                    >
                        Jakarta
                    </p>
                </div>
            </div>
            <div className={`flex gap-3 ${sys.mut}`}>
                <Search size={20} />
                <Bell size={20} />
            </div>
        </div>

        {/* Hero Card (Sholat) */}
        <div
            className={`rounded-3xl p-5 flex flex-col relative overflow-hidden ${sys.hero}`}
        >
            {sys.heroExtra}
            <div className='flex justify-between items-center relative z-10 mb-4'>
                <div>
                    <span className='text-[10px] font-bold tracking-widest uppercase opacity-80'>
                        {t("nextPrayer")}
                    </span>
                    <h2 className='text-4xl mt-1 font-bold'>15:14</h2>
                </div>
                <div className='text-right'>
                    <div className='bg-black/20 px-2.5 py-1 rounded text-xs mb-1 inline-flex items-center gap-1 font-mono'>
                        <Clock size={12} /> -01:20
                    </div>
                </div>
            </div>
            <div className='flex justify-between items-center border-t border-white/20 pt-3 relative z-10'>
                <span className='text-[9px] font-bold uppercase tracking-widest opacity-90'>
                    {t("tracker")}
                </span>
                <div className='flex gap-1.5'>
                    {emptySholatState.map((s) => (
                        <div
                            key={s.id}
                            className={`w-5 h-5 flex items-center justify-center text-[8px] font-bold rounded-sm border border-white/40 text-white/60`}
                        >
                            {s.id}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Super App 8-Grid Shortcut */}
        <div
            className={`grid grid-cols-4 gap-y-5 gap-x-2 p-4 rounded-3xl border ${sys.card}`}
        >
            <ShortcutIcon
                sys={sys}
                icon={<Compass size={20} />}
                label={t("qibla")}
            />
            <ShortcutIcon
                sys={sys}
                icon={<BookOpenCheck size={20} />}
                label={t("memorize")}
            />
            <ShortcutIcon
                sys={sys}
                icon={<Smile size={20} />}
                label={t("journal")}
            />
            <ShortcutIcon
                sys={sys}
                icon={<HelpCircle size={20} />}
                label={t("quiz")}
            />
            <ShortcutIcon
                sys={sys}
                icon={<Video size={20} />}
                label={t("lecture")}
            />
            <ShortcutIcon
                sys={sys}
                icon={<FileText size={20} />}
                label={t("tafsir")}
            />
            <ShortcutIcon
                sys={sys}
                icon={<Book size={20} />}
                label={t("hadith")}
            />
            <ShortcutIcon
                sys={sys}
                icon={<Grid size={20} />}
                label={t("others")}
            />
        </div>

        {/* Lanjutkan Belajar (Progressive Disclosure - Empty State) */}
        <div
            className={`rounded-3xl p-4 border flex gap-3 items-center cursor-pointer active:scale-95 transition-transform ${sys.card}`}
        >
            <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${sys.accBg}`}
            >
                <Bookmark size={20} />
            </div>
            <div className='flex-1'>
                <h3
                    className={`text-[10px] font-bold uppercase tracking-widest ${sys.acc}`}
                >
                    {t("resume")}
                </h3>
                <p className={`text-xs font-bold line-clamp-1 mt-1 ${sys.mut}`}>
                    {t("noReading")}
                </p>
            </div>
            <ChevronRight size={18} className={sys.mut} />
        </div>
    </div>
);

const ShortcutIcon = ({ sys, icon, label }) => (
    <div className='flex flex-col items-center gap-2 group cursor-pointer'>
        <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:-translate-y-1 ${sys.iconBg} ${sys.acc}`}
        >
            {icon}
        </div>
        <span
            className={`font-bold text-[8px] uppercase tracking-widest ${sys.text}`}
        >
            {label}
        </span>
    </div>
);

const QuranTab = ({ sys, t }) => {
    const [internalTab, setInternalTab] = useState("surah");
    return (
        <div className='flex flex-col h-full'>
            <div
                className={`px-4 pt-8 pb-2 sticky top-0 z-10 border-b ${sys.bg} ${sys.card.split(" ")[1]}`}
            >
                <h1 className={`text-2xl font-bold mb-4 ${sys.text}`}>
                    {t("quran")}
                </h1>
                <div
                    className={`rounded-xl flex items-center px-3 py-2.5 mb-2 border ${sys.card}`}
                >
                    <Search size={16} className={`${sys.mut} mr-2`} />
                    <input
                        type='text'
                        placeholder={t("search")}
                        className={`bg-transparent border-none outline-none w-full text-sm ${sys.text}`}
                    />
                </div>
                {/* Internal Tabs */}
                <div className={sys.pillCont}>
                    {[
                        "surah",
                        "memorize",
                        "murojaah",
                        "tafsir",
                        "mufrodat",
                    ].map((k) => (
                        <button
                            key={k}
                            onClick={() => setInternalTab(k)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${internalTab === k ? sys.pillAct : sys.pillDef}`}
                        >
                            {t(k)}
                        </button>
                    ))}
                </div>
            </div>

            <div className='flex-1 px-4 py-3 flex flex-col gap-3 relative z-0'>
                {internalTab === "surah" ? (
                    <>
                        {mockSurahIndex.map((i) => (
                            <div
                                key={i.n}
                                className={`p-4 border flex items-center justify-between rounded-2xl active:scale-[0.98] transition-transform cursor-pointer ${sys.card}`}
                            >
                                <div className='flex items-center gap-4'>
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${sys.iconBg} ${sys.acc}`}
                                    >
                                        <span className='font-bold text-xs'>
                                            {i.n}
                                        </span>
                                    </div>
                                    <div>
                                        <h3
                                            className={`font-bold text-sm ${sys.text}`}
                                        >
                                            {i.s}
                                        </h3>
                                        <p
                                            className={`text-[10px] mt-1 ${sys.mut}`}
                                        >
                                            Makkiyah
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={`text-2xl ${sys.text} opacity-90`}
                                    dir='rtl'
                                >
                                    {i.a}
                                </div>
                            </div>
                        ))}
                        {/* Performance Hint: Load More button instead of infinite scroll representation */}
                        <button
                            className={`w-full py-4 mt-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-dashed ${sys.card.split(" ")[1]} ${sys.mut} hover:bg-black/5 transition-colors`}
                        >
                            {t("loadMore")}
                        </button>
                    </>
                ) : (
                    <EmptyState sys={sys} msg={t("emptyState")} icon={Layers} />
                )}
            </div>
        </div>
    );
};

const IbadahTab = ({ sys, t }) => {
    const [count, setCount] = useState(0);
    const [internalTab, setInternalTab] = useState("tasbih");

    return (
        <div className='flex flex-col h-full px-4 pt-8'>
            <div className='w-full flex justify-between items-center mb-6'>
                <h1 className={`text-2xl font-bold ${sys.text}`}>
                    {t("ibadah")}
                </h1>
            </div>
            <div className={sys.pillCont + " mb-4"}>
                {["tasbih", "dailyDeeds", "manasik"].map((k) => (
                    <button
                        key={k}
                        onClick={() => setInternalTab(k)}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${internalTab === k ? sys.pillAct : sys.pillDef}`}
                    >
                        {t(k)}
                    </button>
                ))}
            </div>

            {internalTab === "tasbih" && (
                <div className='flex flex-col gap-4 w-full mb-4'>
                    <div
                        className={`w-full border rounded-3xl p-8 flex flex-col items-center shadow-sm relative overflow-hidden ${sys.card}`}
                    >
                        <h2 className={`text-3xl mb-6 ${sys.text}`} dir='rtl'>
                            سُبْحَانَ اللَّهِ
                        </h2>
                        <button
                            onClick={() => setCount((c) => c + 1)}
                            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform mb-6 border-[8px] border-white/10 ${sys.accBg}`}
                        >
                            <span className='text-4xl font-light text-white'>
                                {count}
                            </span>
                        </button>
                        <button
                            onClick={() => setCount(0)}
                            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${sys.mut}`}
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>

                    <div
                        className={`w-full rounded-3xl p-4 border ${sys.card}`}
                    >
                        <h3
                            className={`text-[10px] font-bold uppercase tracking-widest mb-3 border-b pb-3 ${sys.card.split(" ")[1]} ${sys.mut}`}
                        >
                            Riwayat Hari Ini
                        </h3>
                        {count > 0 ? (
                            <div className='flex justify-between items-center py-2'>
                                <span
                                    className={`text-xs font-bold ${sys.text}`}
                                >
                                    Subhanallah
                                </span>
                                <span
                                    className={`text-xs font-mono font-bold ${sys.acc}`}
                                >
                                    {count}x
                                </span>
                            </div>
                        ) : (
                            <p
                                className={`text-[10px] text-center py-4 ${sys.mut}`}
                            >
                                {t("emptyState")}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {internalTab === "dailyDeeds" && (
                <div
                    className={`w-full border rounded-3xl p-5 flex flex-col ${sys.card}`}
                >
                    <h3
                        className={`text-[10px] font-bold uppercase tracking-widest mb-4 border-b pb-3 ${sys.card.split(" ")[1]} ${sys.mut}`}
                    >
                        {t("dailyDeeds")} Checklist
                    </h3>
                    <div className='flex items-center gap-3 mb-4'>
                        <div
                            className={`w-5 h-5 rounded-md border ${sys.iconBg}`}
                        ></div>
                        <span className={`text-sm font-bold ${sys.text}`}>
                            {t("dhuha")}
                        </span>
                    </div>
                    <div className='flex items-center gap-3 mb-4'>
                        <div
                            className={`w-5 h-5 rounded-md border ${sys.iconBg}`}
                        ></div>
                        <span className={`text-sm font-bold ${sys.text}`}>
                            {t("tahajud")}
                        </span>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div
                            className={`w-5 h-5 rounded-md border ${sys.iconBg}`}
                        ></div>
                        <span className={`text-sm font-bold ${sys.text}`}>
                            {t("charity")}
                        </span>
                    </div>
                </div>
            )}

            {internalTab === "manasik" && (
                <EmptyState sys={sys} msg={t("emptyState")} icon={Compass} />
            )}
        </div>
    );
};

const IlmuTab = ({ sys, t }) => {
    const [internalTab, setInternalTab] = useState("lecture");
    return (
        <div className='flex flex-col h-full px-4 pt-8'>
            <h1 className={`text-2xl font-bold mb-4 ${sys.text}`}>
                {t("ilmu")}
            </h1>
            <div
                className={`rounded-xl flex items-center px-3 py-2.5 mb-3 border ${sys.card}`}
            >
                <Search size={16} className={`${sys.mut} mr-2`} />
                <input
                    type='text'
                    placeholder={t("search")}
                    className={`bg-transparent border-none outline-none w-full text-sm ${sys.text}`}
                />
            </div>

            <div className={sys.pillCont + " mb-3"}>
                {[
                    "lecture",
                    "hadith",
                    "narrator",
                    "sanad",
                    "fiqh",
                    "siroh",
                ].map((k) => (
                    <button
                        key={k}
                        onClick={() => setInternalTab(k)}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${internalTab === k ? sys.pillAct : sys.pillDef}`}
                    >
                        {t(k)}
                    </button>
                ))}
            </div>

            <div className='flex-1 overflow-y-auto pb-4 hide-scrollbar'>
                {internalTab === "lecture" && (
                    <EmptyState
                        sys={sys}
                        msg={t("emptyLecture")}
                        icon={Video}
                    />
                )}
                {internalTab === "hadith" && (
                    <EmptyState sys={sys} msg={t("emptyHadith")} icon={Book} />
                )}
                {internalTab === "narrator" && (
                    <EmptyState
                        sys={sys}
                        msg={t("emptyNarrator")}
                        icon={Search}
                    />
                )}
                {internalTab === "sanad" && (
                    <EmptyState
                        sys={sys}
                        msg={t("emptySanad")}
                        icon={Activity}
                    />
                )}
                {internalTab === "fiqh" && (
                    <EmptyState
                        sys={sys}
                        msg={t("emptyState")}
                        icon={Library}
                    />
                )}
                {internalTab === "siroh" && (
                    <EmptyState
                        sys={sys}
                        msg={t("emptyState")}
                        icon={Library}
                    />
                )}
            </div>
        </div>
    );
};

const ProfilTab = ({ sys, t }) => (
    <div className='flex flex-col h-full px-4 pt-8'>
        <div
            className={`flex items-center gap-4 mb-6 p-5 rounded-3xl border shadow-sm ${sys.card}`}
        >
            <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold ${sys.accBg}`}
            >
                <User size={28} />
            </div>
            <div className='flex-1'>
                <h1 className={`text-lg font-bold ${sys.text}`}>
                    {t("guest")}
                </h1>
                <p
                    className={`text-[10px] uppercase tracking-widest mt-1 ${sys.mut}`}
                >
                    ID: -
                </p>
            </div>
            <Settings
                size={24}
                className={`${sys.mut} cursor-pointer hover:scale-110 transition-transform`}
            />
        </div>

        <div className='flex gap-3 mb-6'>
            <div
                className={`flex-1 p-4 rounded-3xl border flex flex-col items-center ${sys.card}`}
            >
                <Award size={24} className={`${sys.mut} opacity-50 mb-2`} />
                <span className={`text-2xl font-bold ${sys.text}`}>0</span>
                <span
                    className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${sys.mut}`}
                >
                    {t("points")}
                </span>
            </div>
            <div
                className={`flex-1 p-4 rounded-3xl border flex flex-col items-center ${sys.card}`}
            >
                <Activity size={24} className={`${sys.mut} opacity-50 mb-2`} />
                <span className={`text-2xl font-bold ${sys.text}`}>0 Hr</span>
                <span
                    className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${sys.mut}`}
                >
                    {t("streak")}
                </span>
            </div>
        </div>

        <h2
            className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-1 ${sys.acc}`}
        >
            {t("badges")}
        </h2>
        <div
            className={`p-5 rounded-3xl border grid grid-cols-4 gap-2 mb-6 ${sys.card}`}
        >
            {staticBadges.map((b) => (
                <div
                    key={b.id}
                    className={`flex flex-col items-center gap-2 opacity-30 grayscale`}
                >
                    <div
                        className={`w-12 h-12 rounded-full border flex items-center justify-center text-xl shadow-inner ${sys.iconBg}`}
                    >
                        {b.icon}
                    </div>
                    <span
                        className={`text-[8px] font-bold text-center uppercase tracking-widest ${sys.text}`}
                    >
                        {b.name}
                    </span>
                </div>
            ))}
        </div>

        <div
            className={`rounded-3xl border overflow-hidden flex flex-col ${sys.card}`}
        >
            <div
                className={`p-4 border-b flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors ${sys.card.split(" ")[1]}`}
            >
                <div className='flex items-center gap-3'>
                    <Smile size={18} className={sys.acc} />
                    <span className={`text-sm font-bold ${sys.text}`}>
                        {t("journalTitle")}
                    </span>
                </div>
                <ChevronRight size={16} className={sys.mut} />
            </div>
            <div
                className={`p-4 border-b flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors ${sys.card.split(" ")[1]}`}
            >
                <div className='flex items-center gap-3'>
                    <Trophy size={18} className={sys.acc} />
                    <span className={`text-sm font-bold ${sys.text}`}>
                        {t("leaderboard")}
                    </span>
                </div>
                <ChevronRight size={16} className={sys.mut} />
            </div>
            <div
                className={`p-4 border-b flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors ${sys.card.split(" ")[1]}`}
            >
                <div className='flex items-center gap-3'>
                    <Target size={18} className={sys.acc} />
                    <span className={`text-sm font-bold ${sys.text}`}>
                        {t("target")}
                    </span>
                </div>
                <ChevronRight size={16} className={sys.mut} />
            </div>
            <div className='p-4 flex items-center gap-3 text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors'>
                <LogOut size={18} />
                <span className='text-sm font-bold'>{t("logout")}</span>
            </div>
        </div>
    </div>
);
