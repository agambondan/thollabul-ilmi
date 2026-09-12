"use client";

import DetailPagerNav from "@/components/DetailPagerNav";
import { useLocale } from "@/context/Locale";

export default function HadithNumberPager({ basePath, slug, number, total }) {
    const { t } = useLocale();

    const prevNumber = number > 1 ? number - 1 : null;
    const nextNumber = total && number < total ? number + 1 : null;
    if (!prevNumber && !nextNumber) return null;

    const numberLabel = t("hadith.hadith_number_title") || "Nomor Hadis";

    return (
        <DetailPagerNav
            prevChrome={t("common.prev")}
            nextChrome={t("common.next")}
            prev={
                prevNumber
                    ? {
                          href: `${basePath}/${slug}/${prevNumber}`,
                          label: `${numberLabel} ${prevNumber}`,
                      }
                    : null
            }
            next={
                nextNumber
                    ? {
                          href: `${basePath}/${slug}/${nextNumber}`,
                          label: `${numberLabel} ${nextNumber}`,
                      }
                    : null
            }
        />
    );
}
