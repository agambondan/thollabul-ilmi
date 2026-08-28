import classNames from "classnames";
import { useLocale } from "@/context/Locale";

const HadithTab = ({ tabs, onClickTab, activeTab, children }) => {
    const { t } = useLocale();

    return (
        <div className='w-full'>
            <ul
                className='flex flex-nowrap gap-2 justify-center px-4 overflow-x-auto scroll-x-fade'
                role='tablist'
            >
                {tabs.map((tab) => {
                    const labelKey = `hadith.tab_${tab.label.toLowerCase()}`;
                    const displayLabel = t(labelKey) || tab.label;

                    return (
                        <li key={tab.href} className='shrink-0'>
                            <button
                                onClick={() => onClickTab(tab.href)}
                                className={classNames(
                                    "whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all",
                                    {
                                        "bg-emerald-700 dark:bg-emerald-700 text-white shadow-sm":
                                            activeTab === tab.href,
                                        "bg-parchment-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600":
                                            activeTab !== tab.href,
                                    },
                                )}
                                role='tab'
                                aria-selected={activeTab === tab.href}
                            >
                                {displayLabel}
                            </button>
                        </li>
                    );
                })}
                {children}
            </ul>
        </div>
    );
};

export default HadithTab;
