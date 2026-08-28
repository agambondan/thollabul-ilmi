'use client';

import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { useState } from 'react';
import { BsCheckCircle, BsChevronLeft, BsChevronRight, BsPlayFill, BsLockFill, BsBook } from 'react-icons/bs';
import Link from 'next/link';
import { pushRecentBelajar } from '@/lib/recent';

const MODULES = [
    {
        id: 'wudhu',
        title: 'Tata Cara Wudhu',
        steps: [
            { title: 'Niat', body: 'Niat di dalam hati ketika membasuh wajah, tidak harus diucapkan.' },
            { title: 'Membasuh Wajah', body: 'Siramkan air ke seluruh wajah dari dahi sampai dagu dan dari telinga kanan ke telinga kiri.' },
            { title: 'Membasuh Tangan', body: 'Mulai dari tangan kanan sampai siku, gosok sela-sela jari, lalu tangan kiri.' },
            { title: 'Mengusap Kepala', body: 'Usap seluruh kepala dengan air dari depan ke belakang dan sebaliknya sekali saja.' },
            { title: 'Membasuh Kaki', body: 'Siramkan air ke seluruh kaki kanan dan kiri sampai mata kaki, termasuk sela-sela.' },
        ],
    },
    {
        id: 'sholat',
        title: 'Tata Cara Sholat',
        steps: [
            { title: 'Takbiratul Ihram', body: 'Berdiri tegak, angkat kedua tangan sejajar telinga, baca "Allahu Akbar".' },
            { title: 'Membaca Al-Fatihah', body: 'Surat wajib dalam tiap rakaat. Setiap rakaat dibaca setelah takbir intiqal.' },
            { title: 'Ruku', body: 'Bungkukkan badan, tangan di lutut, punggung rata. Baca "Subhana Rabbiyal Adzim" 3x.' },
            { title: 'Sujud', body: 'Turunkan badan hingga dahi, kedua telapak tangan, kedua lutut, dan kedua kaki menyentuh lantai. Baca "Subhana Rabbiyal A\'la" 3x.' },
            { title: 'Tasyahud & Salam', body: 'Duduk iftirash kemudian tahiyat akhir, diakhiri salam ke kanan dan ke kiri.' },
        ],
    },
    {
        id: 'adzans',
        title: 'Mengenal Adzan & Iqomah',
        steps: [
            { title: 'Pengertian Adzan', body: 'Panggilan untuk menunaikan sholat fardhu, terdiri dari 7 kalimat (Subuh 5 kalimat).' },
            { title: 'Syarat Muadzin', body: 'Muslim, baligh, berakal, memahami rukun adzan.' },
            { title: 'Lafaz Adzan', body: 'Allahu Akbar (4x), Syahadat (2x), Hayya \'alas sholah (2x), Hayya \'alal falah (2x), dst.' },
            { title: 'Iqomah', body: 'Serupa adzan, namun ditambah "Qod qomatish sholah" dan dibaca lebih cepat.' },
        ],
    },
];

export default function LessonsPage() {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);
    const [activeStepIdx, setActiveStepIdx] = useState(0);
    const [completed, setCompleted] = useState({});

    const activeModule = MODULES.find((m) => m.id === activeModuleId);
    const step = activeModule.steps[activeStepIdx];

    const totalSteps = activeModule.steps.length;
    const moduleProgress = Math.round(
        ((Object.keys(completed).filter((k) => k.startsWith(activeModuleId)).length) / totalSteps) * 100
    );

    const handleSelectModule = (id) => {
        setActiveModuleId(id);
        setActiveStepIdx(0);
    };

    const next = () => {
        if (activeStepIdx < totalSteps - 1) {
            setActiveStepIdx(activeStepIdx + 1);
        } else {
            const key = `${activeModuleId}_${totalSteps}`;
            setCompleted({ ...completed, [key]: true });
            pushRecentBelajar({ href: `/dashboard/belajar/lessons`, title: activeModule.title, meta: 'Selesai' });
        }
    };

    const prev = () => {
        if (activeStepIdx > 0) setActiveStepIdx(activeStepIdx - 1);
    };

    const isStepDone = activeStepIdx < totalSteps - 1 
        ? completed[`${activeModuleId}_${activeStepIdx + 1}`]
        : completed[`${activeModuleId}_${totalSteps}`];

    return (
        <div className={isWide ? 'px-4 py-6' : 'px-4 py-6 max-w-md mx-auto'}>
            <Link href='/dashboard/belajar' className='inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-3'>
                <BsChevronLeft /> <span className='ml-1'>Kembali ke Belajar</span>
            </Link>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                {t('belajar.lessons')}
            </h1>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                {/* Module List */}
                <div className='sm:col-span-1 space-y-2'>
                    {MODULES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => handleSelectModule(m.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                activeModuleId === m.id
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-200'
                            }`}
                        >
                            <p className='text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                                {activeModuleId === m.id ? <BsPlayFill className='text-emerald-500' /> : <BsBook className='text-gray-400' />}
                                {m.title}
                            </p>
                            <p className='text-xs text-gray-500 mt-1'>{m.steps.length} langkah</p>
                        </button>
                    ))}
                </div>

                {/* Active Step */}
                <div className='sm:col-span-2'>
                    <div className='mb-4 flex items-center justify-between'>
                        <span className='text-xs font-bold text-emerald-600 uppercase tracking-wider'>
                            {activeModule.title} — {activeStepIdx + 1} / {totalSteps}
                        </span>
                        <span className='text-xs text-gray-500'>{moduleProgress}% selesai</span>
                    </div>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm'>
                        <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3'>
                            {step.title}
                        </h2>
                        <p className='text-sm text-gray-600 dark:text-gray-300 leading-relaxed'>
                            {step.body}
                        </p>
                    </div>
                    <div className='flex items-center justify-between mt-4'>
                        <button 
                            onClick={prev} 
                            disabled={activeStepIdx === 0}
                            className='px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-30 flex items-center gap-1'
                        >
                            <BsChevronLeft /> Kembali
                        </button>
                        <button
                            onClick={next}
                            className='px-5 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 flex items-center gap-2'
                        >
                            {isStepDone && <BsCheckCircle className='text-emerald-200' />}
                            {activeStepIdx === totalSteps - 1 ? 'Selesai' : 'Lanjut'}
                            <BsChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
