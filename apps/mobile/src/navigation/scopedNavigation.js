export const createScopedNavigation = (navigation, tab, getActiveTab) => ({
    ...navigation,
    clearBack: () => {
        if (getActiveTab() === tab) navigation.clearBack();
    },
    setBack: (handler) => {
        if (getActiveTab() === tab) navigation.setBack(handler);
    },
    setHeader: (config) => {
        if (getActiveTab() === tab) navigation.setHeader(config);
    },
});
