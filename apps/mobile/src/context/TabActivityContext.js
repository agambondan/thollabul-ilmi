import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

const TabActivityContext = createContext({
    activityTick: 0,
    notifyTabActivity: () => {},
});

export function TabActivityProvider({ children }) {
    const [activityTick, setActivityTick] = useState(0);
    const lastNotifyRef = useRef(0);

    const notifyTabActivity = useCallback(() => {
        const now = Date.now();
        if (now - lastNotifyRef.current < 250) return;
        lastNotifyRef.current = now;
        setActivityTick(now);
    }, []);

    const value = useMemo(
        () => ({ activityTick, notifyTabActivity }),
        [activityTick, notifyTabActivity],
    );

    return (
        <TabActivityContext.Provider value={value}>
            {children}
        </TabActivityContext.Provider>
    );
}

export const useTabActivity = () => useContext(TabActivityContext);
