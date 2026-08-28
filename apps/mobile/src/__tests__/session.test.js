let AsyncStorage, SecureStore, saveSession, readSession, clearSession;

beforeEach(() => {
    jest.resetModules();
    jest.doMock("expo-secure-store", () => ({
        getItemAsync: jest.fn(),
        setItemAsync: jest.fn(),
        deleteItemAsync: jest.fn(),
        isAvailableAsync: jest.fn(),
    }));
    jest.doMock("@react-native-async-storage/async-storage", () => ({
        setItem: jest.fn(() => Promise.resolve()),
        getItem: jest.fn(() => Promise.resolve(null)),
        removeItem: jest.fn(() => Promise.resolve()),
        clear: jest.fn(() => Promise.resolve()),
    }));
    jest.clearAllMocks();
    AsyncStorage = require("@react-native-async-storage/async-storage");
    SecureStore = require("expo-secure-store");
    const mod = require("../storage/session");
    saveSession = mod.saveSession;
    readSession = mod.readSession;
    clearSession = mod.clearSession;
});

describe("saveSession", () => {
    test("stores to SecureStore when available", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(true);
        await saveSession({ token: "abc" });
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
            "tholabul-session",
            '{"token":"abc"}',
        );
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    test("falls back to AsyncStorage when SecureStore unavailable", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(false);
        await saveSession({ token: "abc" });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "tholabul:local-session",
            '{"token":"abc"}',
        );
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
});

describe("readSession", () => {
    test("reads from SecureStore when available", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(true);
        SecureStore.getItemAsync.mockResolvedValue('{"token":"xyz"}');
        const result = await readSession();
        expect(result).toEqual({ token: "xyz" });
    });

    test("reads from AsyncStorage fallback", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(false);
        AsyncStorage.getItem.mockResolvedValue('{"token":"xyz"}');
        const result = await readSession();
        expect(result).toEqual({ token: "xyz" });
    });

    test("falls back to AsyncStorage on error", async () => {
        SecureStore.isAvailableAsync.mockRejectedValue(new Error("fail"));
        AsyncStorage.getItem.mockResolvedValue('{"fallback":true}');
        const result = await readSession();
        expect(result).toEqual({ fallback: true });
    });
});

describe("clearSession", () => {
    test("clears both stores when SecureStore available", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(true);
        await clearSession();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
            "tholabul-session",
        );
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
            "tholabul:local-session",
        );
    });

    test("only clears AsyncStorage when SecureStore unavailable", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(false);
        await clearSession();
        expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
            "tholabul:local-session",
        );
    });
});
