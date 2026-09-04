import classNames from "classnames";
import { RiArrowDropDownLine, RiArrowDropUpLine } from "react-icons/ri";

const SmallDropdown = ({
    flag,
    children,
    isSmallDropdownOpen,
    toggleSmallDropdown,
}) => {
    return (
        <div className='relative'>
            <button
                className='flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-emerald-100 hover:bg-emerald-800 hover:text-white transition-all'
                type='button'
                onClick={toggleSmallDropdown}
                aria-label='Pilih bahasa'
                aria-haspopup='menu'
                aria-expanded={isSmallDropdownOpen}
            >
                <span className='inline-flex rounded-sm overflow-hidden ring-1 ring-white/30 leading-none'>
                    {flag}
                </span>
                {isSmallDropdownOpen ? (
                    <RiArrowDropUpLine size={20} />
                ) : (
                    <RiArrowDropDownLine size={20} />
                )}
            </button>
            <ul
                className={classNames({
                    hidden: !isSmallDropdownOpen,
                    block: isSmallDropdownOpen,
                    "absolute right-0 z-50 mt-1 min-w-[10rem] list-none overflow-hidden rounded-xl": true,
                    "bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 shadow-xl": true,
                })}
            >
                {children}
            </ul>
        </div>
    );
};

export default SmallDropdown;
