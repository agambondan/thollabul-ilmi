"use client";

import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useState } from "react";
import { BsBookHalf, BsChevronDown, BsChevronUp } from "react-icons/bs";

const SECTIONS = [
    {
        id: "fatihah",
        title: "Al-Fatihah",
        count: "1×",
        note: "Dibaca sebagai pembuka",
        note_en: "Read as the opening",
        items: [
            {
                arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
                latin: "Bismillāhir raḥmānir raḥīm. Alḥamdu lillāhi rabbil 'ālamīn. Ar-raḥmānir raḥīm. Māliki yaumid dīn. Iyyāka na'budu wa iyyāka nasta'īn. Ihdinash shirāṭal mustaqīm. Shirāṭal ladzīna an'amta 'alaihim ghairil maghdūbi 'alaihim wa lad-dāllīn.",
                meaning:
                    "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang. Segala puji bagi Allah, Tuhan semesta alam. Yang Maha Pengasih lagi Maha Penyayang. Yang menguasai hari pembalasan. Hanya kepada Engkau kami menyembah dan hanya kepada Engkau kami memohon pertolongan. Tunjukilah kami jalan yang lurus — jalan orang-orang yang telah Engkau beri nikmat, bukan jalan mereka yang dimurkai dan bukan pula jalan mereka yang sesat.",
                meaning_en:
                    "In the name of Allah, the Most Compassionate, the Most Merciful. All praise is for Allah, Lord of all worlds, the Most Compassionate, the Most Merciful, Master of the Day of Judgment. You alone we worship and You alone we ask for help. Guide us to the straight path, the path of those You have blessed, not of those who incur anger nor of those who go astray.",
            },
        ],
    },
    {
        id: "ikhlas",
        title: "Al-Ikhlas",
        count: "3× / 7× / 11×",
        note: "Dibaca 3, 7, atau 11 kali",
        note_en: "Read 3, 7, or 11 times",
        items: [
            {
                arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
                latin: "Qul huwallāhu aḥad. Allāhuṣ ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahū kufuwan aḥad.",
                meaning:
                    "Katakanlah: Dialah Allah Yang Maha Esa. Allah tempat meminta segala sesuatu. Dia tidak beranak dan tidak diperanakkan. Dan tidak ada sesuatu yang setara dengan Dia.",
                meaning_en:
                    "Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, and there is none comparable to Him.",
            },
        ],
    },
    {
        id: "falaq",
        title: "Al-Falaq",
        count: "1×",
        note: "Mohon perlindungan dari kejahatan",
        note_en: "Seeking protection from evil",
        items: [
            {
                arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
                latin: "Qul a'ūdzu birabbil falaq. Min syarri mā khalaq. Wa min syarri ghāsiqin idzā waqab. Wa min syarrin naffātsāti fil 'uqad. Wa min syarri ḥāsidin idzā ḥasad.",
                meaning:
                    "Katakanlah: Aku berlindung kepada Tuhan yang menguasai subuh, dari kejahatan makhluk-Nya, dan dari kejahatan malam apabila telah gelap gulita, dan dari kejahatan wanita-wanita tukang sihir yang menghembus pada buhul-buhul, dan dari kejahatan orang yang dengki apabila ia dengki.",
                meaning_en:
                    "Say: I seek refuge in the Lord of daybreak from the evil of what He created, from the evil of darkness when it settles, from the evil of those who blow into knots, and from the evil of an envier when he envies.",
            },
        ],
    },
    {
        id: "nas",
        title: "An-Nas",
        count: "1×",
        note: "Mohon perlindungan dari bisikan setan",
        note_en: "Seeking protection from satanic whispers",
        items: [
            {
                arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
                latin: "Qul a'ūdzu birabbin nās. Malikin nās. Ilāhin nās. Min syarril waswāsil khannās. Alladzī yuwaswisu fī ṣudūrin nās. Minal jinnati wan nās.",
                meaning:
                    "Katakanlah: Aku berlindung kepada Tuhan manusia, Raja manusia, Sembahan manusia, dari kejahatan bisikan setan yang biasa bersembunyi, yang membisikkan kejahatan ke dalam dada manusia, dari golongan jin dan manusia.",
                meaning_en:
                    "Say: I seek refuge in the Lord of mankind, the King of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the hearts of mankind, from among jinn and mankind.",
            },
        ],
    },
    {
        id: "ayat-kursi",
        title: "Ayat Kursi",
        count: "1×",
        note: "Al-Baqarah: 255",
        note_en: "Al-Baqarah: 255",
        items: [
            {
                arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
                latin: "Allāhu lā ilāha illā huwal ḥayyul qayyūm. Lā ta'khuduhū sinatun wa lā naum. Lahū mā fis samāwāti wa mā fil arḍ. Man dzal ladzī yasyfa'u 'indahū illā bi idznih. Ya'lamu mā baina aidīhim wa mā khalfahum. Wa lā yuḥīṭūna bi syai'im min 'ilmihī illā bimā syā'. Wasi'a kursiyyuhus samāwāti wal arḍ. Wa lā ya'ūduhū ḥifẓuhumā. Wa huwal 'aliyyul 'aẓīm.",
                meaning:
                    "Allah, tidak ada Tuhan selain Dia, Yang Maha Hidup, Yang terus-menerus mengurus makhluk-Nya. Tidak mengantuk dan tidak tidur. Kepunyaan-Nya apa yang ada di langit dan apa yang ada di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa seizin-Nya. Dia mengetahui apa yang ada di hadapan mereka dan apa yang ada di belakang mereka. Mereka tidak mengetahui sesuatu pun dari ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Dia tidak merasa berat memelihara keduanya. Dialah Yang Mahatinggi, Mahabesar.",
                meaning_en:
                    "Allah, there is no deity except Him, the Ever-Living, the Sustainer. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and the earth. No one can intercede with Him except by His permission. He knows what is before them and what is behind them, while they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and preserving them does not burden Him. He is the Most High, the Most Great.",
            },
        ],
    },
    {
        id: "tahlil-kalimat",
        title: "Tahlil & Tasbih",
        count: "33×/33×/33×/100×",
        note: "Kalimat tayyibah yang utama",
        note_en: "Main phrases of remembrance",
        items: [
            {
                arabic: "سُبْحَانَ اللَّهِ",
                latin: "Subḥānallāh",
                meaning: "Maha Suci Allah — dibaca 33×",
                meaning_en: "Glory be to Allah, read 33 times",
            },
            {
                arabic: "اَلْحَمْدُ لِلَّهِ",
                latin: "Alḥamdulillāh",
                meaning: "Segala puji bagi Allah — dibaca 33×",
                meaning_en: "All praise is for Allah, read 33 times",
            },
            {
                arabic: "اللَّهُ أَكْبَرُ",
                latin: "Allāhu akbar",
                meaning: "Allah Maha Besar — dibaca 33×",
                meaning_en: "Allah is the Greatest, read 33 times",
            },
            {
                arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
                latin: "Lā ilāha illallāh waḥdahū lā syarīka lah, lahul mulku wa lahul ḥamdu wa huwa 'alā kulli syai'in qadīr.",
                meaning:
                    "Tidak ada Tuhan selain Allah, tiada sekutu bagi-Nya, bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Mahakuasa atas segala sesuatu — dibaca 100× (atau 10× setelah 33+33+33)",
                meaning_en:
                    "There is no deity except Allah alone, without partner. To Him belongs the dominion and praise, and He has power over all things. Read 100 times, or 10 times after 33+33+33.",
            },
        ],
    },
    {
        id: "sholawat",
        title: "Sholawat Nabi",
        title_en: "Blessings upon the Prophet",
        count: "10× / 33×",
        note: "Kirim sholawat untuk Nabi ﷺ",
        note_en: "Send blessings upon the Prophet ﷺ",
        items: [
            {
                arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
                latin: "Allāhumma ṣalli 'alā Muḥammadin wa 'alā āli Muḥammad, kamā ṣallaita 'alā Ibrāhīma wa 'alā āli Ibrāhīm. Innaka ḥamīdun majīd.",
                meaning:
                    "Ya Allah, limpahkanlah sholawat kepada Muhammad dan keluarga Muhammad, sebagaimana Engkau telah melimpahkan sholawat kepada Ibrahim dan keluarga Ibrahim. Sesungguhnya Engkau Maha Terpuji lagi Maha Mulia.",
                meaning_en:
                    "O Allah, send blessings upon Muhammad and the family of Muhammad as You sent blessings upon Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy and Glorious.",
            },
        ],
    },
    {
        id: "doa-tahlil",
        title: "Doa Tahlil",
        title_en: "Tahlil Supplication",
        count: "1×",
        note: "Doa penutup tahlilan untuk yang telah wafat",
        note_en: "Closing supplication for the deceased",
        items: [
            {
                arabic: "اَللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ",
                latin: "Allāhummaghfir lahu warḥamhu wa 'āfihi wa'fu 'anhu, wa akrim nuzulahu, wa wassi' mudkhalahu, waghsilhu bil mā'i wats tsalji wal barad, wa naqqihi minal khaṭāyā kamā yunaqqaṡ tsaubul abyadhu minad danas.",
                meaning:
                    "Ya Allah, ampunilah dia, rahmatilah dia, selamatkanlah dia, maafkanlah dia, muliakanlah tempat tinggalnya, luaskanlah kuburnya, cucilah dia dengan air, salju, dan embun, sucikanlah dia dari kesalahan sebagaimana kain putih dibersihkan dari kotoran.",
                meaning_en:
                    "O Allah, forgive him, have mercy on him, grant him safety, pardon him, honor his dwelling, widen his grave, wash him with water, snow, and hail, and cleanse him from sins as a white garment is cleansed from dirt.",
            },
        ],
    },
    {
        id: "penutup",
        title: "Penutup: Al-Fatihah",
        title_en: "Closing: Al-Fatihah",
        count: "1×",
        note: "Dibaca sebagai penutup, hadiah pahala untuk almarhum/almarhumah",
        note_en: "Read as the closing and dedicate the reward to the deceased",
        items: [
            {
                arabic: "اَلْفَاتِحَةُ...",
                latin: "Al-Fātiḥah...",
                meaning:
                    "Baca Al-Fatihah sekali sebagai penutup, dengan niat menghadiahkan pahalanya.",
                meaning_en:
                    "Read Al-Fatihah once as the closing, intending to dedicate its reward.",
            },
        ],
    },
];

export const TahlilContent = ({ quranBasePath = "/quran" }) => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [open, setOpen] = useState(new Set(["fatihah"]));
    const [showLatin, setShowLatin] = useState(true);
    const [showMeaning, setShowMeaning] = useState(true);

    const toggle = (id) => {
        setOpen((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const expandAll = () => setOpen(new Set(SECTIONS.map((s) => s.id)));
    const collapseAll = () => setOpen(new Set());

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-2xl"
            }
        >
            {/* Header */}
            <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                    <BsBookHalf className='text-xl text-emerald-700 dark:text-emerald-400' />
                </div>
                <div>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                        {t("tahlil.title")}
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {t("tahlil.subtitle")}
                    </p>
                </div>
            </div>

            {/* Display controls */}
            <div className='flex items-center gap-2 mb-5 flex-wrap'>
                <button
                    onClick={() => setShowLatin((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showLatin ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                >
                    Latin
                </button>
                <button
                    onClick={() => setShowMeaning((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showMeaning ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                >
                    {t("common.translation")}
                </button>
                <div className='ml-auto flex gap-2'>
                    <button
                        onClick={expandAll}
                        className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("common.expand_all")}
                    </button>
                    <button
                        onClick={collapseAll}
                        className='text-xs text-gray-400 dark:text-gray-500 hover:underline'
                    >
                        {t("common.collapse_all")}
                    </button>
                </div>
            </div>

            {/* Sections */}
            <div className='space-y-2'>
                {SECTIONS.map((sec, idx) => (
                    <div
                        key={sec.id}
                        className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                    >
                        <button
                            onClick={() => toggle(sec.id)}
                            className='w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left'
                        >
                            <span className='w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                                {idx + 1}
                            </span>
                            <div className='flex-1'>
                                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                    {getLocalizedField(sec, "title", lang)}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {sec.count} ·{" "}
                                    {getLocalizedField(sec, "note", lang)}
                                </p>
                            </div>
                            {open.has(sec.id) ? (
                                <BsChevronUp className='text-gray-400 flex-shrink-0' />
                            ) : (
                                <BsChevronDown className='text-gray-400 flex-shrink-0' />
                            )}
                        </button>

                        {open.has(sec.id) && (
                            <div className='border-t border-gray-100 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700/50'>
                                {sec.items.map((item, i) => (
                                    <div
                                        key={i}
                                        className='px-4 py-4 space-y-2'
                                    >
                                        <p
                                            dir='rtl'
                                            className='text-xl leading-loose font-arabic text-gray-900 dark:text-white text-right'
                                        >
                                            {item.arabic}
                                        </p>
                                        {showLatin && (
                                            <p className='text-sm text-emerald-700 dark:text-emerald-400 italic'>
                                                {item.latin}
                                            </p>
                                        )}
                                        {showMeaning && (
                                            <p className='text-sm text-gray-600 dark:text-gray-300'>
                                                {getLocalizedField(
                                                    item,
                                                    "meaning",
                                                    lang,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Note */}
            <div className='mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40'>
                <p className='text-xs text-amber-700 dark:text-amber-400'>
                    <strong>{t("common.notes")}:</strong>{" "}
                    {t("tahlil.note_text")}{" "}
                    <Link
                        href={
                            quranBasePath.startsWith("/dashboard/quran")
                                ? `${quranBasePath}/Yasin`
                                : `${quranBasePath}/surah/Yasin`
                        }
                        className='underline font-medium'
                    >
                        Al-Quran — Surah Yasin
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
};
