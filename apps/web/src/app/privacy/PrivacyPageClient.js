"use client";

import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import Link from "next/link";
import {
    BsShieldCheck,
    BsGeoAlt,
    BsBell,
    BsDatabase,
    BsLock,
    BsEnvelope,
} from "react-icons/bs";

export default function PrivacyPageClient() {
    const { lang } = useLocale();
    const { isWide } = useLayoutMode();
    const isEn = lang === "EN";

    return (
        <div
            className={
                isWide ? "w-full px-4 py-8" : "max-w-3xl mx-auto px-4 py-8"
            }
        >
            <div className='mb-8'>
                <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium mb-3'>
                    <BsShieldCheck size={14} />
                    <span>
                        {isEn ? "Privacy & Data Protection" : "Privasi & Perlindungan Data"}
                    </span>
                </div>
                <h1 className='text-3xl font-extrabold text-emerald-950 dark:text-white mb-2'>
                    {isEn ? "Privacy Policy" : "Kebijakan Privasi"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {isEn
                        ? "Last updated: October 2026. Applies to Thullaabul 'Ilmi web & mobile applications."
                        : "Terakhir diperbarui: Oktober 2026. Berlaku untuk aplikasi web & mobile Thullaabul 'Ilmi."}
                </p>
            </div>

            <div className='prose prose-emerald dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed'>
                <section className='bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5'>
                    <h2 className='text-base font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mb-2'>
                        <BsLock size={16} />
                        {isEn ? "1. Commitment & Core Principle" : "1. Komitmen & Prinsip Utama"}
                    </h2>
                    <p>
                        {isEn
                            ? "Thullaabul 'Ilmi is committed to protecting your privacy. We believe religious knowledge and daily worship tools should respect your personal dignity and privacy. We do not sell your personal data, nor do we build advertising profiles."
                            : "Thullaabul 'Ilmi berkomitmen penuh untuk melindungi privasi Anda. Kami meyakini bahwa sarana menuntut ilmu agama dan beribadah harus menjaga kehormatan serta kerahasiaan data penggunanya. Kami tidak menjual data Anda kepada pihak mana pun dan tidak membangun profil periklanan."}
                    </p>
                </section>

                <section className='border border-gray-100 dark:border-slate-800 rounded-2xl p-5'>
                    <h2 className='text-base font-bold text-emerald-900 dark:text-white flex items-center gap-2 mb-2'>
                        <BsGeoAlt size={16} />
                        {isEn ? "2. Location Data (Coarse & Fine)" : "2. Data Lokasi (Kira-kira & Presisi)"}
                    </h2>
                    <p className='mb-2'>
                        {isEn
                            ? "Our mobile application requests location permissions (ACCESS_COARSE_LOCATION and ACCESS_FINE_LOCATION) solely for:"
                            : "Aplikasi mobile kami meminta izin akses lokasi hanya untuk keperluan:"}
                    </p>
                    <ul className='list-disc pl-5 space-y-1 mb-3'>
                        <li>
                            {isEn
                                ? "Calculating accurate prayer times based on astronomical coordinates."
                                : "Menghitung jadwal shalat yang akurat sesuai koordinat astronomis setempat."}
                        </li>
                        <li>
                            {isEn
                                ? "Determining Qibla compass bearing from your current position towards the Kaaba."
                                : "Menentukan arah kiblat menggunakan kompas dari posisi Anda ke Ka'bah."}
                        </li>
                        <li>
                            {isEn
                                ? "Locating nearby registered mosques (upon user request)."
                                : "Menemukan masjid terdekat yang terdaftar (berdasarkan permintaan Anda)."}
                        </li>
                    </ul>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {isEn
                            ? "Location coordinates are processed on your device or via ephemeral lookup. They are never continuously tracked in the background nor used for advertising."
                            : "Koordinat lokasi diproses langsung di perangkat atau dikirim sesaat untuk pencarian jadwal. Lokasi Anda tidak pernah dilacak secara terus-menerus di latar belakang untuk periklanan."}
                    </p>
                </section>

                <section className='border border-gray-100 dark:border-slate-800 rounded-2xl p-5'>
                    <h2 className='text-base font-bold text-emerald-900 dark:text-white flex items-center gap-2 mb-2'>
                        <BsBell size={16} />
                        {isEn ? "3. Notifications & Alarms" : "3. Notifikasi & Pengingat Waktu"}
                    </h2>
                    <p className='mb-2'>
                        {isEn
                            ? "Permissions for POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, and RECEIVE_BOOT_COMPLETED are used exclusively for:"
                            : "Izin notifikasi dan alarm presisi (POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED) digunakan semata-mata untuk:"}
                    </p>
                    <ul className='list-disc pl-5 space-y-1'>
                        <li>
                            {isEn
                                ? "Delivering timely prayer call (Adzan) alarms according to your custom settings."
                                : "Membunyikan adzan/pengingat waktu shalat tepat pada waktunya sesuai setelan Anda."}
                        </li>
                        <li>
                            {isEn
                                ? "Morning and evening Dhikr reminders and study streak notifications."
                                : "Pengingat dzikir pagi/petang dan target belajar harian."}
                        </li>
                        <li>
                            {isEn
                                ? "Restoring scheduled alarms after device restarts."
                                : "Menjadwalkan ulang alarm setelah perangkat dinyalakan kembali."}
                        </li>
                    </ul>
                </section>

                <section className='border border-gray-100 dark:border-slate-800 rounded-2xl p-5'>
                    <h2 className='text-base font-bold text-emerald-900 dark:text-white flex items-center gap-2 mb-2'>
                        <BsDatabase size={16} />
                        {isEn ? "4. Local & Offline Storage" : "4. Penyimpanan Offline & Akun"}
                    </h2>
                    <p>
                        {isEn
                            ? "Content packs (Quran, Hadith, Tafsir, audio cache) and your learning notes are stored locally on your device using SQLite and secure device storage. When logged in, bookmarks and learning goals synchronize securely with our API via encrypted HTTPS connections."
                            : "Paket konten (Al-Qur'an, Hadits, Tafsir, cache audio) serta catatan Anda tersimpan secara lokal di perangkat menggunakan SQLite. Saat Anda login, bookmark dan target hafalan disinkronkan secara aman ke server melalui enkripsi HTTPS."}
                    </p>
                </section>

                <section className='border border-gray-100 dark:border-slate-800 rounded-2xl p-5'>
                    <h2 className='text-base font-bold text-emerald-900 dark:text-white flex items-center gap-2 mb-2'>
                        <BsShieldCheck size={16} />
                        {isEn ? "5. Crash Diagnostics & Analytics" : "5. Diagnostik Crash & Analitik"}
                    </h2>
                    <p>
                        {isEn
                            ? "To ensure application stability and resolve bugs quickly, we use Sentry for anonymous error reporting. No sensitive religious notes, personal passwords, or private conversations are included in error traces."
                            : "Untuk menjaga stabilitas aplikasi dan memperbaiki kendala teknis, kami menggunakan Sentry untuk laporan crash anonim. Tidak ada catatan pribadi, kata sandi, maupun data ibadah sensitif yang disertakan dalam laporan teknis tersebut."}
                    </p>
                </section>

                <section className='border border-gray-100 dark:border-slate-800 rounded-2xl p-5'>
                    <h2 className='text-base font-bold text-emerald-900 dark:text-white flex items-center gap-2 mb-2'>
                        <BsEnvelope size={16} />
                        {isEn ? "6. User Rights & Account Deletion" : "6. Hak Pengguna & Penghapusan Akun"}
                    </h2>
                    <p className='mb-3'>
                        {isEn
                            ? "You may request full deletion of your account and associated data at any time directly through the app (Profile -> Security -> Delete Account) or by contacting our team."
                            : "Anda dapat meminta penghapusan akun beserta seluruh riwayat data terkait kapan saja melalui aplikasi (Profil -> Keamanan -> Hapus Akun) atau dengan menghubungi tim kami."}
                    </p>
                    <div className='flex items-center gap-4 text-xs font-semibold'>
                        <Link
                            href='/contact'
                            className='text-emerald-700 dark:text-emerald-400 hover:underline'
                        >
                            {isEn ? "Contact Support" : "Hubungi Kami"} &rarr;
                        </Link>
                        <a
                            href='mailto:halo@thollabulilmi.site'
                            className='text-emerald-700 dark:text-emerald-400 hover:underline'
                        >
                            halo@thollabulilmi.site
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
