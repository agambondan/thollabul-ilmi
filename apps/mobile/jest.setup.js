const mockAsyncStorageStore = new Map();
jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn((key, value) => {
        mockAsyncStorageStore.set(key, value);
        return Promise.resolve();
    }),
    getItem: jest.fn((key) => Promise.resolve(mockAsyncStorageStore.get(key) ?? null)),
    removeItem: jest.fn((key) => {
        mockAsyncStorageStore.delete(key);
        return Promise.resolve();
    }),
    clear: jest.fn(() => {
        mockAsyncStorageStore.clear();
        return Promise.resolve();
    }),
}));

jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    setItemAsync: jest.fn(() => Promise.resolve()),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("react-native-gesture-handler", () => {
    const RealComponent = jest.requireActual("react-native");
    return {
        ...RealComponent,
        GestureHandlerRootView: RealComponent.View,
        Swipeable: RealComponent.View,
        PanGestureHandler: RealComponent.View,
        State: {},
        Directions: {},
    };
});

jest.mock("react-native-webview", () => {
    const React = require("react");
    const { View } = require("react-native");
    return {
        WebView: React.forwardRef((props, ref) => {
            React.useImperativeHandle(ref, () => ({
                postMessage: jest.fn(),
                injectJavaScript: jest.fn(),
                reload: jest.fn(),
            }));
            return React.createElement(View, { testID: "mock-webview", ...props });
        }),
    };
});

jest.mock("expo-web-browser", () => ({
    openAuthSessionAsync: jest.fn(() =>
        Promise.resolve({ type: "success", url: "thullaabulilmi://auth/google/callback?token=test-token&refresh_token=test-refresh&name=Test+User&email=test%40test.com" }),
    ),
}));

jest.mock("react-native-maps", () => {
    const React = require("react");
    const { View } = require("react-native");
    const MockMapView = React.forwardRef((props, ref) => {
        React.useImperativeHandle(ref, () => ({
            animateToRegion: jest.fn(),
        }));
        return React.createElement(View, { testID: "mock-mapview", ...props });
    });
    const MockMarker = (props) => React.createElement(View, { testID: "mock-marker", ...props });
    const MockCallout = (props) => React.createElement(View, { testID: "mock-callout", ...props });
    return {
        __esModule: true,
        default: MockMapView,
        Marker: MockMarker,
        Callout: MockCallout,
    };
});
