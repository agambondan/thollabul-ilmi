import classNames from "classnames";
import { useLocale } from "@/context/Locale";
import Link from "next/link";

const HadithTab = ({ tabs, basePath, activeTab, children }) => {
    const { t } = useLocale();

    return (
        <div className='w-full'>
            <div
                className='flex flex-nowrap gap-2 justify-center px-4 overflow-x-auto scroll-x-fade'
                role='tablist'
            >
                {tabs.map((tab) => {
                    const labelKey = `hadith.tab_${tab.label.toLowerCase()}`;
                    const displayLabel = t(labelKey) || tab.label;
                    const tabId = tab.href.replace("#", "");
                    const href = `${basePath}?tab=${tabId}`;
                    const isActive = activeTab === tab.href;

                    return (
                        <Link
                            key={tab.href}
                            href={href}
                            scroll={false}
                            role='tab'
                            aria-selected={isActive}
                            className={classNames(
                                "shrink-0 whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all",
                                {
                                    "bg-emerald-700 dark:bg-emerald-700 text-white shadow-sm":
                                        isActive,
                                    "bg-parchment-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600":
                                        !isActive,
                                },
                            )}
                        >
                            {displayLabel}
                        </Link>
                    );
                })}
                {children}
            </div>
        </div>
    );
};

export default HadithTab;
