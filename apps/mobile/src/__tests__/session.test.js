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

    test("throws when SecureStore unavailable instead of falling back to plaintext", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(false);
        await expect(saveSession({ token: "abc" })).rejects.toThrow("SecureStore tidak tersedia");
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
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

    test("returns null when SecureStore unavailable", async () => {
        SecureStore.isAvailableAsync.mockResolvedValue(false);
        const result = await readSession();
        expect(result).toBeNull();
    });

    test("returns null on SecureStore error", async () => {
        SecureStore.isAvailableAsync.mockRejectedValue(new Error("fail"));
        const result = await readSession();
        expect(result).toBeNull();
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
