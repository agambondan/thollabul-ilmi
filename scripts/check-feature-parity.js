#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "docs/features/feature-manifest.json");
const appRoot = path.join(repoRoot, "apps/web/src/app");
const mobileFeaturesPath = path.join(
    repoRoot,
    "apps/mobile/src/data/mobileFeatures.js",
);

const requiredFields = [
    "key",
    "title",
    "publicWebRoute",
    "dashboardWebRoute",
    "mobileRoute",
    "authRequired",
    "ctaLabel",
    "searchable",
    "status",
];
const requiredUtilityFields = [
    "key",
    "title",
    "route",
    "surface",
    "purpose",
    "status",
];

const validStatuses = new Set([
    "active",
    "mobile-only",
    "web-only",
    "planned",
    "deprecated",
]);
const validUtilitySurfaces = new Set([
    "public",
    "dashboard",
    "admin",
    "auth",
    "dev",
    "system",
]);
const knownTabs = new Set([
    "home",
    "quran",
    "hadith",
    "ibadah",
    "belajar",
    "profile",
]);
const knownIbadahViews = new Set(["prayer", "qibla", "settings", "khatam"]);
const knownInternalViews = new Set(["global-search", "feature-directory"]);
const knownProfileViews = new Set(["settings", "achievements"]);
const ignoredMobileKeys = new Set([
    "bacaan",
    "ilmu",
    "alat",
    "personal",
    "kelas-modul",
    "kajian-artikel",
    "siroh-sejarah",
    "fiqh-panduan",
    "referensi",
    "evaluasi",
    "personal-ringkas",
]);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const normalizeRoute = (route) => {
    if (route == null) return null;
    if (typeof route !== "string") return route;
    if (route === "/") return route;
    return route.replace(/\/+$/, "");
};

const routeToPagePath = (route) => {
    const normalized = normalizeRoute(route);
    if (
        !normalized ||
        typeof normalized !== "string" ||
        !normalized.startsWith("/")
    )
        return null;
    const segments = normalized.split("/").filter(Boolean);
    return path.join(appRoot, ...segments, "page.js");
};

const routeToFileCandidates = (route) => {
    const normalized = normalizeRoute(route);
    if (
        !normalized ||
        typeof normalized !== "string" ||
        !normalized.startsWith("/")
    )
        return [];
    const segments = normalized.split("/").filter(Boolean);
    const pagePath = routeToPagePath(normalized);
    const routeHandlerPath = path.join(appRoot, ...segments, "route.js");

    const metadataFileMap = {
        "/apple-icon": "apple-icon.js",
        "/icon": "icon.js",
        "/manifest.webmanifest": "manifest.js",
        "/robots.txt": "robots.js",
        "/sitemap.xml": "sitemap.js",
    };

    const candidates = [pagePath, routeHandlerPath];
    if (metadataFileMap[normalized]) {
        candidates.push(path.join(appRoot, metadataFileMap[normalized]));
    }
    return candidates.filter(Boolean);
};

const routeExists = (route) => {
    return routeToFileCandidates(route).some((candidate) =>
        fs.existsSync(candidate),
    );
};

const routeDiagnosticPath = (route) => {
    const candidates = routeToFileCandidates(route);
    if (!candidates.length) return "<invalid route>";
    return candidates
        .map((candidate) => path.relative(repoRoot, candidate))
        .join(" or ");
};

const listPageRoutes = (dir, prefix = "") => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let routes = [];

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            routes = routes.concat(
                listPageRoutes(entryPath, `${prefix}/${entry.name}`),
            );
        } else if (entry.name === "page.js") {
            routes.push(prefix || "/");
        }
    }

    return routes.map(normalizeRoute).sort();
};

const parseMobileFeatureKeys = () => {
    const source = fs.readFileSync(mobileFeaturesPath, "utf8");
    const keys = new Set();
    const regex = /key:\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(source))) {
        if (!ignoredMobileKeys.has(match[1])) {
            keys.add(match[1]);
        }
    }

    return keys;
};

const mobileRouteExists = (mobileRoute, mobileFeatureKeys) => {
    if (mobileRoute == null) return true;
    if (typeof mobileRoute !== "string") return false;
    const [kind, value] = mobileRoute.split(":");
    if (!kind || !value) return false;

    if (kind === "feature") return mobileFeatureKeys.has(value);
    if (kind === "tab") return knownTabs.has(value);
    if (kind === "ibadah") return knownIbadahViews.has(value);
    if (kind === "internal") return knownInternalViews.has(value);
    if (kind === "profile") return knownProfileViews.has(value);
    return false;
};

const isChildRouteOfManifestRoute = (route, manifestRoutes) => {
    for (const manifestRoute of manifestRoutes) {
        if (!manifestRoute || manifestRoute === "/") continue;
        if (route.startsWith(`${manifestRoute}/`)) return true;
    }
    return false;
};

const publicRouteNeedsManifest = (route, manifestRoutes) => {
    if (!route || route === "/" || route === "/_not-found") return false;
    if (route.includes("[")) return false;
    if (route.startsWith("/admin")) return false;
    if (route.startsWith("/dashboard")) return false;
    if (isChildRouteOfManifestRoute(route, manifestRoutes)) return false;
    return route.split("/").filter(Boolean).length <= 2;
};

const dashboardRouteNeedsManifest = (route, manifestRoutes) => {
    if (!route || route === "/dashboard") return false;
    if (manifestRoutes.has(route)) return false;
    if (isChildRouteOfManifestRoute(route, manifestRoutes)) return false;
    return true;
};

const main = () => {
    const manifest = readJson(manifestPath);
    const features = manifest.features ?? [];
    const utilityRoutes = Array.isArray(manifest.utilityRoutes)
        ? manifest.utilityRoutes
        : [];
    const mobileFeatureKeys = parseMobileFeatureKeys();
    const allWebRoutes = listPageRoutes(appRoot);
    const errors = [];
    const warnings = [];
    const manifestKeys = new Set();
    const manifestAliasKeys = new Set();
    const manifestRoutes = new Set();
    const utilityKeys = new Set();
    const utilityRouteSet = new Set();

    if (!Array.isArray(features) || features.length === 0) {
        errors.push("Manifest must contain a non-empty features array.");
    }

    if (!Array.isArray(utilityRoutes)) {
        errors.push("Manifest utilityRoutes must be an array.");
    }

    for (const utility of utilityRoutes) {
        for (const field of requiredUtilityFields) {
            if (!(field in utility)) {
                errors.push(
                    `${utility.key ?? "<unknown utility>"}: missing required utility field ${field}.`,
                );
            }
        }

        if (utilityKeys.has(utility.key)) {
            errors.push(`${utility.key}: duplicate utility route key.`);
        }
        utilityKeys.add(utility.key);

        if (!validUtilitySurfaces.has(utility.surface)) {
            errors.push(
                `${utility.key}: invalid utility surface ${utility.surface}.`,
            );
        }

        if (!validStatuses.has(utility.status)) {
            errors.push(
                `${utility.key}: invalid utility status ${utility.status}.`,
            );
        }

        const route = normalizeRoute(utility.route);
        if (!route || typeof route !== "string" || !route.startsWith("/")) {
            errors.push(`${utility.key}: route must start with "/".`);
            continue;
        }

        if (utilityRouteSet.has(route)) {
            errors.push(`${utility.key}: duplicate utility route ${route}.`);
        }
        utilityRouteSet.add(route);
        manifestRoutes.add(route);

        if (!routeExists(route)) {
            errors.push(
                `${utility.key}: utility route ${route} does not resolve to ${routeDiagnosticPath(route)}.`,
            );
        }
    }

    for (const feature of features) {
        for (const field of requiredFields) {
            if (!(field in feature)) {
                errors.push(
                    `${feature.key ?? "<unknown>"}: missing required field ${field}.`,
                );
            }
        }

        if (manifestKeys.has(feature.key)) {
            errors.push(`${feature.key}: duplicate feature key.`);
        }
        manifestKeys.add(feature.key);

        for (const alias of feature.aliases ?? []) {
            manifestAliasKeys.add(alias);
        }

        if (!validStatuses.has(feature.status)) {
            errors.push(`${feature.key}: invalid status ${feature.status}.`);
        }

        if (typeof feature.authRequired !== "boolean") {
            errors.push(`${feature.key}: authRequired must be boolean.`);
        }

        if (typeof feature.searchable !== "boolean") {
            errors.push(`${feature.key}: searchable must be boolean.`);
        }

        for (const routeField of ["publicWebRoute", "dashboardWebRoute"]) {
            const route = normalizeRoute(feature[routeField]);
            if (route) {
                manifestRoutes.add(route);
                if (!route.startsWith("/")) {
                    errors.push(
                        `${feature.key}: ${routeField} must start with "/".`,
                    );
                } else if (!routeExists(route)) {
                    errors.push(
                        `${feature.key}: ${routeField} ${route} does not resolve to ${routeDiagnosticPath(route)}.`,
                    );
                }
            }
        }

        if (
            feature.status === "active" &&
            feature.publicWebRoute &&
            !feature.dashboardWebRoute
        ) {
            errors.push(
                `${feature.key}: active feature with publicWebRoute must declare a dashboardWebRoute wrapper.`,
            );
        }

        if (!mobileRouteExists(feature.mobileRoute, mobileFeatureKeys)) {
            errors.push(
                `${feature.key}: mobileRoute ${feature.mobileRoute} is not known in mobile features/navigation.`,
            );
        }
    }

    for (const mobileKey of mobileFeatureKeys) {
        if (!manifestKeys.has(mobileKey) && !manifestAliasKeys.has(mobileKey)) {
            errors.push(
                `Mobile feature key ${mobileKey} is missing from docs/features/feature-manifest.json.`,
            );
        }
    }

    for (const route of allWebRoutes.filter((candidate) =>
        publicRouteNeedsManifest(candidate, manifestRoutes),
    )) {
        if (!manifestRoutes.has(route)) {
            warnings.push(
                `Public route ${route} is not mapped directly in the feature manifest.`,
            );
        }
    }

    for (const route of allWebRoutes.filter((candidate) =>
        candidate.startsWith("/dashboard"),
    )) {
        if (dashboardRouteNeedsManifest(route, manifestRoutes)) {
            errors.push(
                `Dashboard route ${route} must be mapped in feature-manifest.json or live under a manifest-tracked dashboard feature route.`,
            );
        }
    }

    if (warnings.length) {
        console.warn("Feature parity warnings:");
        for (const warning of warnings) console.warn(`- ${warning}`);
    }

    if (errors.length) {
        console.error("Feature parity check failed:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    console.log("Feature parity check passed.");
    console.log(`- manifest features: ${features.length}`);
    console.log(`- manifest utility routes: ${utilityRoutes.length}`);
    console.log(`- mobile feature keys: ${mobileFeatureKeys.size}`);
    console.log(`- web app routes scanned: ${allWebRoutes.length}`);
    console.log(
        `- dashboard page routes scanned: ${allWebRoutes.filter((route) => route.startsWith("/dashboard")).length}`,
    );
};

main();
