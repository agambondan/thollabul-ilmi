"use client";

import { useLocale } from "@/context/Locale";
import { BsX } from "react-icons/bs";

/**
 * Tombol tutup untuk panel yang muncul inline (Tafsir, Mufrodat, Ayat Terkait,
 * Sanad, Takhrij).
 *
 * Sebelumnya panel-panel itu hanya bisa ditutup dengan mengulang langkah yang
 * membukanya - membuka kembali menu titik-tiga, atau menekan lagi tab yang sama.
 * Tidak ada penanda visual bahwa panelnya bisa ditutup sama sekali.
 *
 * Dibuat satu komponen supaya semua panel memakai penempatan, ukuran, dan
 * warna yang sama; itu yang membuatnya langsung dikenali sebagai "tutup"
 * di mana pun muncul.
 */
const PanelCloseButton = ({ onClose, className = "" }) => {
    const { t } = useLocale();
    const label = t("common.close") ?? "Tutup";

    return (
        <button
            type='button'
            onClick={onClose}
            title={label}
            aria-label={label}
            className={`shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-lg leading-none text-gray-400 hover:text-gray-600 hover:bg-black/5 dark:hover:text-gray-200 dark:hover:bg-white/10 transition-colors ${className}`}
        >
            <BsX />
        </button>
    );
};

export default PanelCloseButton;
