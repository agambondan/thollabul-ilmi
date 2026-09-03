import { cookies } from "next/headers";

const COOKIE_NAME = "lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

const normalize = (raw) => {
    const upper = String(raw ?? "").toUpperCase();
    return upper === "EN" ? "EN" : "ID";
};

export const POST = async (request) => {
    const body = await request.json().catch(() => ({}));
    const lang = normalize(body?.lang);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, lang, {
        path: "/",
        maxAge: ONE_YEAR,
        sameSite: "lax",
    });
    return Response.json({ lang });
};

export const GET = async () => {
    const cookieStore = await cookies();
    const value = cookieStore.get(COOKIE_NAME)?.value;
    return Response.json({ lang: normalize(value) });
};
