jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
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
