module.exports = {
    preset: "jest-expo",
    setupFiles: ["./jest.setup.js"],
    moduleNameMapper: {
        "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    },
};
