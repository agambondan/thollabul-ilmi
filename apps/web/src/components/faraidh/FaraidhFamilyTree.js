"use client";

const fmtNumber = (n, lang = "id") =>
    new Intl.NumberFormat(lang === "EN" ? "en-US" : "id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(n) ? n : 0);

const fmtFrac = (f) => (f ? `${f.num}/${f.den}` : "—");

const heirRowLabel = (key, lang = "id") => {
    return HEIR_METADATA[key]?.label || key;
};

const HEIR_METADATA = {
    kakek: { label: "Kakek (dari Ayah)", arabic: "الْجَدّ", tier: "ushul", side: "paternal" },
    nenek_ayah: { label: "Nenek (dari Ayah)", arabic: "الْجَدَّةُ مِنْ قِبَلِ الْأَبِ", tier: "ushul", side: "paternal" },
    nenek_ibu: { label: "Nenek (dari Ibu)", arabic: "الْجَدَّةُ مِنْ قِبَلِ الْأُمِّ", tier: "ushul", side: "maternal" },
    ayah: { label: "Ayah Kandung", arabic: "الْأَب", tier: "ushul", side: "paternal" },
    ibu: { label: "Ibu Kandung", arabic: "الْأُمّ", tier: "ushul", side: "maternal" },

    suami: { label: "Suami", arabic: "الزَّوْج", tier: "spouse", side: "spouse" },
    istri: { label: "Istri", arabic: "الزَّوْجَة", tier: "spouse", side: "spouse" },

    saudara_seibu: { label: "Saudara Seibu (L)", arabic: "الْأَخُ لِأُمّ", tier: "collateral_same", side: "maternal" },
    saudari_seibu: { label: "Saudara Seibu (P)", arabic: "الْأُخْتُ لِأُمّ", tier: "collateral_same", side: "maternal" },
    saudara_kandung: { label: "Saudara Kandung (L)", arabic: "الْأَخُ الشَّقِيق", tier: "collateral_same", side: "paternal" },
    saudari_kandung: { label: "Saudara Kandung (P)", arabic: "الْأُخْتُ الشَّقِيقَة", tier: "collateral_same", side: "paternal" },
    saudara_seayah: { label: "Saudara Seayah (L)", arabic: "الْأَخُ لِأَب", tier: "collateral_same", side: "paternal" },
    saudari_seayah: { label: "Saudara Seayah (P)", arabic: "الْأُخْتُ لِأَب", tier: "collateral_same", side: "paternal" },

    anak_laki: { label: "Anak Laki-laki", arabic: "الِابْن", tier: "furu", side: "descendant" },
    anak_perempuan: { label: "Anak Perempuan", arabic: "الْبِنْت", tier: "furu", side: "descendant" },
    cucu_laki: { label: "Cucu Laki-laki", arabic: "ابْنُ الِابْن", tier: "furu", side: "descendant" },
    cucu_perempuan: { label: "Cucu Perempuan", arabic: "بِنْتُ الِابْن", tier: "furu", side: "descendant" },

    paman_kandung: { label: "Paman Kandung", arabic: "الْعَمُّ الشَّقِيق", tier: "hawasyi", side: "paternal" },
    paman_seayah: { label: "Paman Seayah", arabic: "الْعَمُّ لِأَب", tier: "hawasyi", side: "paternal" },
    anak_paman_kandung: { label: "Anak Laki Paman Kdg", arabic: "ابْنُ الْعَمِّ الشَّقِيق", tier: "hawasyi", side: "paternal" },
    anak_paman_seayah: { label: "Anak Laki Paman Seayah", arabic: "ابْنُ الْعَمِّ لِأَب", tier: "hawasyi", side: "paternal" },
};

function HeirNode({ heirKey, heirCount, resultRow, lang = "id" }) {
    const meta = HEIR_METADATA[heirKey] || {
        label: heirRowLabel(heirKey, lang),
        arabic: "",
    };
    const isPresent = Boolean(heirCount && heirCount > 0);
    const isEligible = Boolean(resultRow && resultRow.share > 0);
    const isMahjub = isPresent && !isEligible;

    return (
        <div
            className={`flex flex-col items-center justify-between rounded-xl border p-2.5 transition-all text-center min-w-[130px] max-w-[170px] flex-1 ${
                isEligible
                    ? resultRow.isAshabah
                        ? "border-amber-300 bg-amber-50/80 dark:border-amber-700/60 dark:bg-amber-950/40 shadow-xs ring-1 ring-amber-400/40"
                        : "border-emerald-300 bg-emerald-50/80 dark:border-emerald-700/60 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-400/40"
                    : isMahjub
                      ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20 opacity-75"
                      : "border-gray-200/60 bg-gray-50/40 dark:border-slate-700/40 dark:bg-slate-800/20 opacity-40 grayscale"
            }`}
        >
            {meta.arabic ? (
                <span
                    className='text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    {meta.arabic}
                </span>
            ) : null}
            <span className='text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight'>
                {meta.label}
                {isPresent && heirCount > 1 ? ` (${heirCount})` : ""}
            </span>

            {isEligible ? (
                <div className='mt-2 flex flex-col items-center gap-1 w-full'>
                    <div className='flex items-center gap-1 flex-wrap justify-center'>
                        <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                                resultRow.isAshabah
                                    ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"
                                    : "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                            }`}
                        >
                            {resultRow.isAshabah ? "Ashabah (Sisa)" : fmtFrac(resultRow.fraction)}
                        </span>
                        <span className='text-[10px] font-bold text-gray-600 dark:text-gray-300'>
                            {(resultRow.share * 100).toFixed(1)}%
                        </span>
                    </div>
                    <span className='text-xs font-bold text-emerald-700 dark:text-emerald-300'>
                        {fmtNumber(resultRow.amount, lang)}
                    </span>
                </div>
            ) : isMahjub ? (
                <span className='mt-2 inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'>
                    Mahjub (Terhalang)
                </span>
            ) : (
                <span className='mt-2 text-[10px] text-gray-400 dark:text-gray-500'>
                    Tidak ada
                </span>
            )}
        </div>
    );
}

export default function FaraidhFamilyTree({ result, heirs, lang = "id" }) {
    if (!result || !heirs) return null;

    const rowMap = (result.rows || []).reduce((acc, row) => {
        acc[row.key] = row;
        return acc;
    }, {});

    const ushulKeys = ["kakek", "nenek_ayah", "nenek_ibu", "ayah", "ibu"];
    const spouseKeys = ["suami", "istri"];
    const siblingKeys = [
        "saudara_seibu",
        "saudari_seibu",
        "saudara_kandung",
        "saudari_kandung",
        "saudara_seayah",
        "saudari_seayah",
    ];
    const furuKeys = ["anak_laki", "anak_perempuan", "cucu_laki", "cucu_perempuan"];
    const hawasyiKeys = [
        "paman_kandung",
        "paman_seayah",
        "anak_paman_kandung",
        "anak_paman_seayah",
    ];

    const hasAnyUshul = ushulKeys.some((k) => heirs[k] > 0);
    const hasAnySpouse = spouseKeys.some((k) => heirs[k] > 0);
    const hasAnySibling = siblingKeys.some((k) => heirs[k] > 0);
    const hasAnyFuru = furuKeys.some((k) => heirs[k] > 0);
    const hasAnyHawasyi = hawasyiKeys.some((k) => heirs[k] > 0);

    return (
        <div className='mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-slate-800'>
                <div>
                    <h3 className='text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5'>
                        <span>🌳</span> Diagram Pohon Silsilah Waris
                    </h3>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Visualisasi pembagian hak tirkah antar generasi (Ushul, Pasangan/Saudara, Furu', Hawasyi).
                    </p>
                </div>
                <div className='flex items-center gap-2 text-[11px]'>
                    <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
                        <span className='h-2 w-2 rounded-full bg-emerald-600' /> Ashabul Furudh
                    </span>
                    <span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'>
                        <span className='h-2 w-2 rounded-full bg-amber-600' /> Ashabah
                    </span>
                    <span className='inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'>
                        <span className='h-2 w-2 rounded-full bg-rose-500' /> Mahjub
                    </span>
                </div>
            </div>

            <div className='flex flex-col gap-5 relative'>
                {/* Tingkat 1: Ushul / Leluhur */}
                <div className='flex flex-col items-center gap-2'>
                    <span className='rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                        1. Ushul (Leluhur / Generasi Atas)
                    </span>
                    <div className='flex flex-wrap justify-center gap-2 w-full max-w-3xl'>
                        {ushulKeys.map((key) => (
                            <HeirNode
                                key={key}
                                heirKey={key}
                                heirCount={heirs[key]}
                                resultRow={rowMap[key]}
                                lang={lang}
                            />
                        ))}
                    </div>
                </div>

                {/* Vertical Divider / Connection Line */}
                <div className='flex justify-center -my-2'>
                    <div className='h-5 w-0.5 bg-emerald-300 dark:bg-slate-600' />
                </div>

                {/* Tingkat 2: Generasi Mayyit & Pasangan / Saudara */}
                <div className='flex flex-col items-center gap-2'>
                    <span className='rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                        2. Pokok (Al-Mayyit, Pasangan & Saudara)
                    </span>
                    <div className='flex flex-wrap justify-center items-center gap-3 w-full max-w-4xl'>
                        {/* Saudara */}
                        <div className='flex flex-wrap gap-2 justify-center flex-1'>
                            {siblingKeys.map((key) => (
                                <HeirNode
                                    key={key}
                                    heirKey={key}
                                    heirCount={heirs[key]}
                                    resultRow={rowMap[key]}
                                    lang={lang}
                                />
                            ))}
                        </div>

                        {/* Mayyit Center Card */}
                        <div className='rounded-xl border-2 border-emerald-600 bg-emerald-700 p-3 text-center text-white shadow-md min-w-[130px] max-w-[150px] shrink-0'>
                            <span
                                className='text-xs font-semibold block'
                                style={{ fontFamily: "Amiri, serif" }}
                            >
                                الْمَيِّت / الْمَيِّتَة
                            </span>
                            <span className='text-sm font-black block mt-0.5'>
                                AL-MAYYIT
                            </span>
                            <span className='text-[10px] text-emerald-100 block mt-1'>
                                (Pewaris)
                            </span>
                        </div>

                        {/* Pasangan (Suami / Istri) */}
                        <div className='flex flex-wrap gap-2 justify-center flex-1'>
                            {spouseKeys.map((key) => (
                                <HeirNode
                                    key={key}
                                    heirKey={key}
                                    heirCount={heirs[key]}
                                    resultRow={rowMap[key]}
                                    lang={lang}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vertical Divider / Connection Line */}
                <div className='flex justify-center -my-2'>
                    <div className='h-5 w-0.5 bg-emerald-300 dark:bg-slate-600' />
                </div>

                {/* Tingkat 3: Furu' / Keturunan */}
                <div className='flex flex-col items-center gap-2'>
                    <span className='rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                        3. Furu' (Keturunan / Anak & Cucu)
                    </span>
                    <div className='flex flex-wrap justify-center gap-2 w-full max-w-3xl'>
                        {furuKeys.map((key) => (
                            <HeirNode
                                key={key}
                                heirKey={key}
                                heirCount={heirs[key]}
                                resultRow={rowMap[key]}
                                lang={lang}
                            />
                        ))}
                    </div>
                </div>

                {/* Vertical Divider / Connection Line */}
                <div className='flex justify-center -my-2'>
                    <div className='h-5 w-0.5 bg-emerald-300 dark:bg-slate-600' />
                </div>

                {/* Tingkat 4: Hawasyi / Kerabat Paman */}
                <div className='flex flex-col items-center gap-2'>
                    <span className='rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                        4. Hawasyi (Paman & Sepupu Jalur Ayah)
                    </span>
                    <div className='flex flex-wrap justify-center gap-2 w-full max-w-3xl'>
                        {hawasyiKeys.map((key) => (
                            <HeirNode
                                key={key}
                                heirKey={key}
                                heirCount={heirs[key]}
                                resultRow={rowMap[key]}
                                lang={lang}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
