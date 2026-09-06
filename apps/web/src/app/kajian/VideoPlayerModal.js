"use client";

import { useEffect, useState } from "react";
import ModalShell from "@/components/ModalShell";
import { BsYoutube } from "react-icons/bs";

const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    );
    return m ? m[1] : null;
};

export default function VideoPlayerModal({ kajian, onClose }) {
    const videoId = getYouTubeId(kajian?.url);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!kajian || !videoId) {
        return (
            <ModalShell onClose={onClose} label="Video player">
                <div className='bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full'>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                        Video tidak dapat diputar.
                    </p>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell
            onClose={onClose}
            label={kajian.title || "Video player"}
            panelClassName='w-full max-w-4xl'
        >
            <div className='bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl'>
                <div className='relative aspect-video bg-black'>
                    {mounted && (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                            title={kajian.title}
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                            allowFullScreen
                            className='absolute inset-0 w-full h-full'
                        />
                    )}
                </div>
                <div className='flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-slate-700'>
                    <div className='min-w-0 flex-1'>
                        <p className='font-semibold text-sm text-gray-900 dark:text-gray-100 truncate'>
                            {kajian.title}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                            {kajian.speaker}
                            {kajian.duration ? ` · ${Math.floor(kajian.duration / 60)}m` : ""}
                        </p>
                    </div>
                    <a
                        href={kajian.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex-shrink-0'
                    >
                        <BsYoutube className='text-base' />
                        YouTube
                    </a>
                </div>
            </div>
        </ModalShell>
    );
}