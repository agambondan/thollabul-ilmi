const normalizeTabRequest = (tab, params = null) => {
    if (tab === "qibla") {
        return {
            params: { ...(params ?? {}), view: "qibla" },
            tab: "ibadah",
        };
    }

    return { params, tab };
};

const defaultRouteId = (tab, suffix = "") => `${Date.now()}:${tab}:${suffix}`;

const createInternalRoute = (
    tab,
    params,
    { returnTab = null, returnTo = null } = {},
    makeId = defaultRouteId,
) => ({
    id: makeId(tab, params?.view ?? "view"),
    params,
    returnTab,
    returnTo,
    view: params.view,
});

const cloneState = (state) => ({
    activeTab: state.activeTab ?? "home",
    deepLinkTarget: state.deepLinkTarget ?? null,
    internalRoutes: { ...(state.internalRoutes ?? {}) },
    returnRoutes: { ...(state.returnRoutes ?? {}) },
});

const openReturnRouteState = (state, returnRoute, makeId = defaultRouteId) => {
    if (!returnRoute?.tab) return { handled: false, state: cloneState(state) };

    const current = cloneState(state);
    const requestedParams = {
        ...(returnRoute.params ?? {}),
        ...(returnRoute.view ? { view: returnRoute.view } : {}),
    };
    const { params, tab } = normalizeTabRequest(
        returnRoute.tab,
        requestedParams,
    );

    const next = cloneState({
        ...current,
        activeTab: tab,
        deepLinkTarget: params
            ? {
                  id: makeId(tab, JSON.stringify(params)),
                  params,
                  tab,
              }
            : null,
    });
    delete next.returnRoutes[tab];

    if (params?.view) {
        next.internalRoutes[tab] = createInternalRoute(
            tab,
            params,
            {
                returnTab: returnRoute.returnTab ?? null,
                returnTo: returnRoute.returnTo ?? null,
            },
            makeId,
        );
    } else {
        delete next.internalRoutes[tab];
    }

    return { handled: true, state: next };
};

const openTabState = (
    state,
    requestedTab,
    requestedParams = null,
    makeId = defaultRouteId,
) => {
    const current = cloneState(state);
    const { params, tab } = normalizeTabRequest(requestedTab, requestedParams);
    const returnTab =
        current.activeTab && current.activeTab !== tab
            ? current.activeTab
            : null;
    const next = cloneState({
        ...current,
        activeTab: tab,
        deepLinkTarget: params
            ? {
                  id: makeId(tab, JSON.stringify(params)),
                  params,
                  tab,
              }
            : null,
    });

    if (params?.returnTo && !params?.view) {
        next.returnRoutes[tab] = params.returnTo;
    } else {
        delete next.returnRoutes[tab];
    }

    if (params?.view) {
        next.internalRoutes[tab] = createInternalRoute(
            tab,
            params,
            {
                returnTab,
                returnTo: params.returnTo ?? null,
            },
            makeId,
        );
    }

    return { handled: true, state: next };
};

const openInternalViewState = (
    state,
    requestedTab,
    view,
    params = {},
    makeId = defaultRouteId,
) => {
    const current = cloneState(state);
    const normalized = normalizeTabRequest(requestedTab, { ...params, view });
    const tab = normalized.tab;
    const hasExplicitReturnTab = Object.prototype.hasOwnProperty.call(
        normalized.params,
        "returnTab",
    );
    const returnTab = hasExplicitReturnTab
        ? normalized.params.returnTab
        : current.activeTab && current.activeTab !== tab
          ? current.activeTab
          : null;

    const next = cloneState({
        ...current,
        activeTab: tab,
    });
    next.internalRoutes[tab] = createInternalRoute(
        tab,
        normalized.params,
        {
            returnTab,
            returnTo: normalized.params.returnTo ?? null,
        },
        makeId,
    );

    return { handled: true, state: next };
};

const closeInternalViewState = (
    state,
    tab = state.activeTab,
    makeId = defaultRouteId,
) => {
    const current = cloneState(state);
    const route = current.internalRoutes[tab];
    const next = cloneState(current);
    delete next.internalRoutes[tab];

    if (route?.returnTo) {
        return openReturnRouteState(next, route.returnTo, makeId);
    }

    if (route?.returnTab && route.returnTab !== tab) {
        next.activeTab = route.returnTab;
    }

    return { handled: Boolean(route), state: next };
};

const closeInternalViewThenOpenTabState = (
    state,
    tabToClose,
    requestedTab,
    requestedParams = null,
    makeId = defaultRouteId,
) => {
    const closed = closeInternalViewState(state, tabToClose, makeId);
    return openTabState(closed.state, requestedTab, requestedParams, makeId);
};

const hardwareBackState = (state, makeId = defaultRouteId) => {
    const current = cloneState(state);
    const tab = current.activeTab;

    if (current.internalRoutes[tab]) {
        return closeInternalViewState(current, tab, makeId);
    }

    if (current.returnRoutes[tab]) {
        const returnRoute = current.returnRoutes[tab];
        const next = cloneState(current);
        delete next.returnRoutes[tab];
        return openReturnRouteState(next, returnRoute, makeId);
    }

    if (tab !== "home") {
        return {
            handled: true,
            state: {
                ...current,
                activeTab: "home",
            },
        };
    }

    return { handled: false, state: current };
};

module.exports = {
    closeInternalViewState,
    closeInternalViewThenOpenTabState,
    hardwareBackState,
    normalizeTabRequest,
    openInternalViewState,
    openReturnRouteState,
    openTabState,
};
