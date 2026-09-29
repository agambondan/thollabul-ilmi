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

const TabActivityDispatchContext = createContext(() => {});
const TabActivityStateContext = createContext(0);

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
        <TabActivityDispatchContext.Provider value={notifyTabActivity}>
            <TabActivityStateContext.Provider value={activityTick}>
                <TabActivityContext.Provider value={value}>
                    {children}
                </TabActivityContext.Provider>
            </TabActivityStateContext.Provider>
        </TabActivityDispatchContext.Provider>
    );
}

export const useTabActivity = () => useContext(TabActivityContext);
export const useNotifyTabActivity = () => useContext(TabActivityDispatchContext);
export const useTabActivityTick = () => useContext(TabActivityStateContext);

