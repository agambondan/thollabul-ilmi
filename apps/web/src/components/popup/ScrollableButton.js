"use client";

import { useEffect, useState } from "react";

const ScrollableComponent = ({ children }) => {
    const [showFixedComponent, setShowFixedComponent] = useState(false);

    useEffect(() => {
        let timeoutId;

        const handleScroll = () => {
            setShowFixedComponent(true);
            clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                setShowFixedComponent(false);
            }, 2000);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <>
            {showFixedComponent && (
                <div className='w-full fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-t border-emerald-100 dark:border-slate-700 shadow-lg px-6 py-3'>
                    {children !== undefined ? children : <></>}
                </div>
            )}
        </>
    );
};

export default ScrollableComponent;
