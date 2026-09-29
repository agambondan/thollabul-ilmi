import { Platform } from "react-native";

let isInitialized = false;
let customReporter = null;
let sentryClient = null;
const breadcrumbs = [];
const MAX_BREADCRUMBS = 50;

function getSentry() {
    if (sentryClient) return sentryClient;
    try {
        sentryClient = require("@sentry/react-native");
        return sentryClient;
    } catch {
        return null;
    }
}

export function initCrashReporting(options = {}) {
    const {
        dsn = process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment = process.env.NODE_ENV || "development",
        tracesSampleRate = 0.2,
        reporter = null,
        enableInDev = false,
    } = options;

    if (reporter) {
        customReporter = reporter;
        isInitialized = true;
        return true;
    }

    if (!dsn) {
        isInitialized = false;
        return false;
    }

    const Sentry = getSentry();
    if (Sentry && typeof Sentry.init === "function") {
        try {
            Sentry.init({
                dsn,
                environment,
                tracesSampleRate,
                enableInExpoDevelopment: enableInDev,
                debug: false,
            });
            isInitialized = true;
            return true;
        } catch {
            isInitialized = false;
            return false;
        }
    }

    isInitialized = true;
    return true;
}

export function addBreadcrumb(crumb) {
    if (!crumb) return;
    const entry = {
        category: crumb.category || "ui",
        message: crumb.message || String(crumb),
        timestamp: Date.now(),
        data: crumb.data || {},
        platform: Platform.OS,
    };
    breadcrumbs.push(entry);
    if (breadcrumbs.length > MAX_BREADCRUMBS) {
        breadcrumbs.shift();
    }

    const Sentry = getSentry();
    if (Sentry && typeof Sentry.addBreadcrumb === "function") {
        try {
            Sentry.addBreadcrumb({
                category: entry.category,
                message: entry.message,
                data: entry.data,
            });
        } catch {}
    }
}

export function getBreadcrumbs() {
    return [...breadcrumbs];
}

export function clearBreadcrumbs() {
    breadcrumbs.length = 0;
}

export function setUser(user) {
    const Sentry = getSentry();
    if (Sentry && typeof Sentry.setUser === "function") {
        try {
            Sentry.setUser(user ? { id: user.id, email: user.email, username: user.name } : null);
        } catch {}
    }
}

export function captureException(error, context = {}) {
    if (!error) return null;

    const errorEvent = {
        name: error.name || "Error",
        message: error.message || String(error),
        stack: error.stack || "",
        context,
        breadcrumbs: getBreadcrumbs(),
        timestamp: Date.now(),
        platform: Platform.OS,
    };

    const Sentry = getSentry();
    if (Sentry && typeof Sentry.captureException === "function") {
        try {
            Sentry.captureException(error, { extra: context });
        } catch {}
    }

    if (customReporter && typeof customReporter.captureException === "function") {
        try {
            customReporter.captureException(error, context);
        } catch {}
    }

    return errorEvent;
}

export function captureMessage(message, level = "info") {
    if (!message) return null;
    const event = {
        message,
        level,
        breadcrumbs: getBreadcrumbs(),
        timestamp: Date.now(),
        platform: Platform.OS,
    };

    const Sentry = getSentry();
    if (Sentry && typeof Sentry.captureMessage === "function") {
        try {
            Sentry.captureMessage(message, level);
        } catch {}
    }

    if (customReporter && typeof customReporter.captureMessage === "function") {
        try {
            customReporter.captureMessage(message, level);
        } catch {}
    }
    return event;
}

export function isCrashReportingActive() {
    return isInitialized;
}
