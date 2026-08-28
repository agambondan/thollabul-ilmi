export default function SettingRow({ label, children }) {
    return (
        <div className='flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0'>
            <span className='text-sm text-gray-700 dark:text-gray-300 font-medium'>
                {label}
            </span>
            <div className='flex items-center'>
                {children}
            </div>
        </div>
    );
}
