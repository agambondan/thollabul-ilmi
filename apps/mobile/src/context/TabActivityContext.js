import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from "react";

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

    return (
        <TabActivityDispatchContext.Provider value={notifyTabActivity}>
            <TabActivityStateContext.Provider value={activityTick}>
                {children}
            </TabActivityStateContext.Provider>
        </TabActivityDispatchContext.Provider>
    );
}

export const useNotifyTabActivity = () => useContext(TabActivityDispatchContext);
export const useTabActivityTick = () => useContext(TabActivityStateContext);

export const useTabActivity = () => {
    const notifyTabActivity = useNotifyTabActivity();
    const activityTick = useTabActivityTick();
    return { activityTick, notifyTabActivity };
};

