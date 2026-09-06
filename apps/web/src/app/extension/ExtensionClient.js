"use client";

import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { BsCheckCircleFill, BsDownload } from "react-icons/bs";
import { FaChrome, FaEdge } from "react-icons/fa";
import { SiBrave } from "react-icons/si";

export default function ExtensionClient() {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();

    return (
        <div className={isWide ? "w-full py-8 px-4 sm:px-6" : "max-w-4xl mx-auto py-8 px-4 sm:px-6"}>
            {/* Header Banner */}
            <div className='text-center mb-12'>
                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-4'>
                    ✨ Browser Extension
                </span>
                <h1 className='text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4'>
                    Thullaabul &apos;Ilmi Board
                </h1>
                <p className='text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
                    Ubah New Tab browser kamu menjadi dashboard Muslim pribadi
                    yang tenang: jadwal sholat akurat, countdown, hadits harian,
                    checklist ibadah, dan sinkronisasi akun web.
                </p>

                <div className='mt-8 flex flex-wrap justify-center gap-4'>
                    <a
                        href='/extension.zip'
                        download='thullaabul-ilmi-board-extension.zip'
                        className='inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-base shadow-sm transition'
                    >
                        <BsDownload className='text-xl' />
                        Unduh Extension (.ZIP)
                    </a>
                </div>
            </div>

            {/* Features Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
                <div className='p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 shadow-sm'>
                    <div className='text-2xl mb-3'>🕌</div>
                    <h3 className='text-lg font-bold text-gray-950 dark:text-white mb-2'>
                        Jadwal & Countdown Sholat
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                        Waktu sholat 5 waktu otomatis sesuai koordinat lokasi
                        kamu disertai hitung mundur realtime ke waktu sholat
                        berikutnya.
                    </p>
                </div>

                <div className='p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 shadow-sm'>
                    <div className='text-2xl mb-3'>✅</div>
                    <h3 className='text-lg font-bold text-gray-950 dark:text-white mb-2'>
                        Checklist Sholat Harian
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                        Centang sholat 5 waktu langsung dari tab baru dan
                        otomatis tersinkron ke Sholat Tracker akun web kamu.
                    </p>
                </div>

                <div className='p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 shadow-sm'>
                    <div className='text-2xl mb-3'>🖼️</div>
                    <h3 className='text-lg font-bold text-gray-950 dark:text-white mb-2'>
                        Rotasi Wallpaper Masjid & Quote
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                        Wallpaper Masjidil Haram, Nabawi, serta ilustrasi
                        artistik berganti otomatis tiap jam lengkap dengan
                        kutipan hadits dan tombol salin gambar ke clipboard.
                    </p>
                </div>

                <div className='p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 shadow-sm'>
                    <div className='text-2xl mb-3'>🔄</div>
                    <h3 className='text-lg font-bold text-gray-950 dark:text-white mb-2'>
                        Sinkronisasi Sekali Klik
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                        Cukup klik tombol &quot;Sinkronkan Akun&quot; di
                        extension untuk otomatis menghubungkan profil akun web
                        kamu tanpa repot.
                    </p>
                </div>
            </div>

            {/* How to Install Steps */}
            <div className='p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50'>
                <h2 className='text-xl font-bold text-emerald-950 dark:text-emerald-300 mb-6 flex items-center gap-2'>
                    <span>Cara Pasang di Browser</span>
                    <span className='inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400'>
                        <FaChrome /> <SiBrave /> <FaEdge />
                    </span>
                </h2>

                <ol className='space-y-4 text-sm text-gray-700 dark:text-gray-300'>
                    <li className='flex items-start gap-3'>
                        <span className='flex-shrink-0 w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center mt-0.5'>
                            1
                        </span>
                        <div>
                            <strong>Unduh dan Ekstrak:</strong> Klik tombol
                            unduh di atas, lalu ekstrak file{" "}
                            <code className='px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'>
                                extension.zip
                            </code>{" "}
                            ke folder laptop kamu.
                        </div>
                    </li>

                    <li className='flex items-start gap-3'>
                        <span className='flex-shrink-0 w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center mt-0.5'>
                            2
                        </span>
                        <div>
                            <strong>Buka Halaman Ekstensi Browser:</strong>
                            <ul className='mt-1.5 ml-2 space-y-1 text-xs text-gray-600 dark:text-gray-400 font-mono'>
                                <li>
                                    • Chrome: <code>chrome://extensions</code>
                                </li>
                                <li>
                                    • Brave: <code>brave://extensions</code>
                                </li>
                                <li>
                                    • Edge: <code>edge://extensions</code>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <li className='flex items-start gap-3'>
                        <span className='flex-shrink-0 w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center mt-0.5'>
                            3
                        </span>
                        <div>
                            <strong>Aktifkan Developer Mode:</strong> Centang
                            atau geser tombol <strong>Developer mode</strong> di
                            pojok kanan atas layar ekstensi.
                        </div>
                    </li>

                    <li className='flex items-start gap-3'>
                        <span className='flex-shrink-0 w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center mt-0.5'>
                            4
                        </span>
                        <div>
                            <strong>Load Unpacked:</strong> Klik tombol{" "}
                            <strong>Load unpacked</strong> (Muat belum dikemas),
                            lalu pilih folder hasil ekstrak tadi.
                        </div>
                    </li>

                    <li className='flex items-start gap-3'>
                        <span className='flex-shrink-0 w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center mt-0.5'>
                            5
                        </span>
                        <div>
                            <strong>Selesai!</strong> Buka Tab Baru di browser
                            kamu dan nikmati dashboard Thullaabul &apos;Ilmi.
                        </div>
                    </li>
                </ol>
            </div>
        </div>
    );
}
