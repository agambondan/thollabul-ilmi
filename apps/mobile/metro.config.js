const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
    const config = await getDefaultConfig(__dirname);

    config.transformer = {
        ...config.transformer,
        unstable_transformProfile: "hermes-stable",
        inlineRequires: true,
    };

    return config;
})();