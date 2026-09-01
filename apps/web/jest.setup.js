import "@testing-library/jest-dom";

// jsdom ships no matchMedia. Several components query it (theme preference,
// reduced motion, pointer capability), so provide a inert default rather than
// guarding every call site.
if (!window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}
