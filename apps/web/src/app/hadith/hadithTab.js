import classNames from "classnames";

const HadithTab = ({ tabs, onClickTab, activeTab, children }) => {
    return (
        <div className='w-full'>
            <ul
                className='flex flex-wrap gap-2 justify-center px-4'
                role='tablist'
            >
                {tabs.map((tab) => (
                    <li key={tab.href}>
                        <button
                            onClick={() => onClickTab(tab.href)}
                            className={classNames(
                                "px-5 py-2 rounded-full text-sm font-medium transition-all",
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
                            {tab.label}
                        </button>
                    </li>
                ))}
                {children}
            </ul>
        </div>
    );
};

export default HadithTab;
