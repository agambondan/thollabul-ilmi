export const getSafeNextPath = (nextPath, fallback = "/") => {
    if (!nextPath || typeof nextPath !== "string") return fallback;
    if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return fallback;
    return nextPath;
};

export const getCurrentPath = (pathname, searchParams) => {
    const path = pathname || "/";
    const query = searchParams?.toString?.() ?? "";
    return query ? `${path}?${query}` : path;
};

export const buildLoginHref = (nextPath) =>
    `/auth/login?next=${encodeURIComponent(getSafeNextPath(nextPath))}`;

export const buildRegisterHref = (nextPath) =>
    `/auth/register?next=${encodeURIComponent(getSafeNextPath(nextPath))}`;
