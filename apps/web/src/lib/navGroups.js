import {
    BsArrowRepeat,
    BsAward,
    BsBook,
    BsBookHalf,
    BsCalculator,
    BsCalendar3,
    BsCurrencyDollar,
    BsGlobe,
    BsJournalCheck,
    BsJournalPlus,
    BsNewspaper,
    BsPeopleFill,
    BsSearch,
    BsTrophyFill,
} from "react-icons/bs";
import { FaBrain, FaQuran } from "react-icons/fa";
import { GiOpenBook } from "react-icons/gi";
import { ImBook } from "react-icons/im";
import {
    MdAccessTime,
    MdCalendarMonth,
    MdExplore,
    MdFlag,
    MdFormatListBulleted,
    MdMenuBook,
    MdMosque,
    MdOutlineAutoStories,
    MdOutlineDirectionsWalk,
    MdOutlinePlayLesson,
    MdRefresh,
    MdSelfImprovement,
    MdStar,
    MdTimeline,
} from "react-icons/md";

export function getNavGroups(basePath = "") {
    const isDashboard = basePath === "/dashboard";
    const prefix = isDashboard ? "/dashboard" : "";

    return [
        {
            titleKey: "sidebar.main_reading",
            links: [
                {
                    labelKey: "link.quran",
                    href: `${prefix}/quran`,
                    icon: <FaQuran />,
                },
                {
                    labelKey: "link.hadith",
                    href: `${prefix}/hadith`,
                    icon: <ImBook />,
                },
                {
                    labelKey: "link.perawi",
                    href: `${prefix}/perawi`,
                    icon: <ImBook />,
                },
                {
                    labelKey: "link.khatam",
                    href: `${prefix}/khatam`,
                    icon: <BsBookHalf />,
                },
            ],
        },
        {
            titleKey: isDashboard ? "sidebar.worship_tracker" : "nav.worship",
            links: [
                ...(isDashboard
                    ? [
                          {
                              labelKey: "link.sholat_tracker",
                              href: "/dashboard/sholat-tracker",
                              icon: <MdMosque />,
                          },
                      ]
                    : []),
                {
                    labelKey: "link.prayer_guide",
                    href: `${prefix}/panduan-sholat`,
                    icon: <MdMenuBook />,
                },
                ...(isDashboard
                    ? [
                          {
                              labelKey: "link.recitation",
                              href: "/dashboard/tilawah",
                              icon: <BsJournalCheck />,
                          },
                          {
                              labelKey: "link.memorization",
                              href: "/dashboard/hafalan",
                              icon: <BsBook />,
                          },
                          {
                              labelKey: "link.review",
                              href: "/dashboard/muroja-ah",
                              icon: <MdRefresh />,
                          },
                      ]
                    : []),
                {
                    labelKey: "link.tasbih",
                    href: `${prefix}/tasbih`,
                    icon: <BsArrowRepeat />,
                },
                ...(isDashboard
                    ? [
                          {
                              labelKey: "link.deeds",
                              href: "/dashboard/amalan",
                              icon: <MdFormatListBulleted />,
                          },
                          {
                              labelKey: "link.muhasabah",
                              href: "/dashboard/muhasabah",
                              icon: <MdSelfImprovement />,
                          },
                          {
                              labelKey: "link.goals",
                              href: "/dashboard/goals",
                              icon: <MdFlag />,
                          },
                      ]
                    : [
                          {
                              labelKey: "link.prayer_schedule",
                              href: "/jadwal-sholat",
                              icon: <MdAccessTime />,
                          },
                          {
                              labelKey: "link.kiblat",
                              href: "/kiblat",
                              icon: <MdExplore />,
                          },
                          {
                              labelKey: "link.zakat",
                              href: "/zakat",
                              icon: <BsCurrencyDollar />,
                          },
                          {
                              labelKey: "link.imsakiyah",
                              href: "/imsakiyah",
                              icon: <BsCalendar3 />,
                          },
                      ]),
            ],
        },
        {
            titleKey: "sidebar.islamic_content",
            links: [
                {
                    labelKey: "link.tafsir",
                    href: `${prefix}/tafsir`,
                    icon: <MdOutlineAutoStories />,
                },
                {
                    labelKey: "link.asbabun_nuzul",
                    href: `${prefix}/asbabun-nuzul`,
                    icon: <MdOutlineAutoStories />,
                },
                {
                    labelKey: "link.asmaul_husna",
                    href: `${prefix}/asmaul-husna`,
                    icon: <MdStar />,
                },
                {
                    labelKey: "link.doa",
                    href: `${prefix}/doa`,
                    icon: <MdSelfImprovement />,
                },
                {
                    labelKey: "link.dhikr",
                    href: `${prefix}/dzikir`,
                    icon: <GiOpenBook />,
                },
                {
                    labelKey: "link.wird",
                    href: `${prefix}/wirid`,
                    icon: <GiOpenBook />,
                },
                {
                    labelKey: "link.wirid_custom",
                    href: `${prefix}/wirid-custom`,
                    icon: <BsJournalPlus />,
                },
                {
                    labelKey: "link.belajar",
                    href: `${prefix}/belajar`,
                    icon: <MdOutlinePlayLesson />,
                },
                {
                    labelKey: "link.komunitas",
                    href: `${prefix}/komunitas`,
                    icon: <BsGlobe />,
                },
                {
                    labelKey: "link.kajian",
                    href: `${prefix}/kajian`,
                    icon: <MdOutlinePlayLesson />,
                },
                {
                    labelKey: "link.sirah_short",
                    href: `${prefix}/siroh`,
                    icon: <MdMenuBook />,
                },
                {
                    labelKey: "link.brief_fiqh",
                    href: `${prefix}/fiqh`,
                    icon: <MdMenuBook />,
                },
                {
                    labelKey: "link.islamic_history",
                    href: `${prefix}/sejarah`,
                    icon: <MdTimeline />,
                },
                {
                    labelKey: "link.tokoh",
                    href: `${prefix}/tokoh`,
                    icon: <BsPeopleFill />,
                },
                {
                    labelKey: "link.peta",
                    href: `${prefix}/peta`,
                    icon: <MdExplore />,
                },
                {
                    labelKey: "link.manasik",
                    href: `${prefix}/manasik`,
                    icon: <MdOutlineDirectionsWalk />,
                },
                {
                    labelKey: "link.library",
                    href: `${prefix}/library`,
                    icon: <BsBook />,
                },
                {
                    labelKey: "link.blog",
                    href: `${prefix}/blog`,
                    icon: <BsNewspaper />,
                },
                {
                    labelKey: "link.feed",
                    href: `${prefix}/feed`,
                    icon: <BsGlobe />,
                },
            ],
        },
        {
            titleKey: "sidebar.tools",
            links: [
                ...(isDashboard
                    ? [
                          {
                              labelKey: "link.prayer_schedule",
                              href: "/dashboard/jadwal-sholat",
                              icon: <MdAccessTime />,
                          },
                      ]
                    : []),
                {
                    labelKey: "link.hijri_calendar",
                    href: `${prefix}/hijri`,
                    icon: <MdCalendarMonth />,
                },
                {
                    labelKey: "link.arabic_dict",
                    href: `${prefix}/kamus`,
                    icon: <BsBook />,
                },
                ...(isDashboard
                    ? [
                          {
                              labelKey: "link.kiblat",
                              href: "/dashboard/kiblat",
                              icon: <MdExplore />,
                          },
                          {
                              labelKey: "link.faraidh",
                              href: "/dashboard/faraidh",
                              icon: <BsCalculator />,
                          },
                          {
                              labelKey: "link.zakat",
                              href: "/dashboard/zakat",
                              icon: <BsCurrencyDollar />,
                          },
                      ]
                    : [
                          {
                              labelKey: "link.faraidh",
                              href: "/faraidh",
                              icon: <BsCalculator />,
                          },
                      ]),
                {
                    labelKey: "link.search",
                    href: `${prefix}/search`,
                    icon: <BsSearch />,
                },
                {
                    labelKey: "link.quiz",
                    href: `${prefix}/quiz`,
                    icon: <FaBrain />,
                },
                ...(isDashboard
                    ? [
                          {
                              labelKey: "link.leaderboard",
                              href: "/dashboard/leaderboard",
                              icon: <BsTrophyFill />,
                          },
                          {
                              labelKey: "link.achievements",
                              href: "/dashboard/achievements",
                              icon: <BsAward />,
                          },
                          {
                              labelKey: "link.imsakiyah",
                              href: "/dashboard/imsakiyah",
                              icon: <BsCalendar3 />,
                          },
                      ]
                    : []),
            ],
        },
    ];
}
