const API_INTERNAL_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    "http://localhost:29900";

const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
    "content-encoding",
]);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const buildTargetUrl = async (request, params) => {
    const resolvedParams = await params;
    const path = Array.isArray(resolvedParams?.path)
        ? resolvedParams.path.map(encodeURIComponent).join("/")
        : "";
    return new URL(
        `/api/v1/${path}${request.nextUrl.search}`,
        API_INTERNAL_URL,
    );
};

const buildForwardHeaders = (request) => {
    const headers = new Headers(request.headers);
    HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
    headers.set("x-forwarded-host", request.headers.get("host") || "");
    headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
    return headers;
};

const buildResponseHeaders = (upstreamHeaders) => {
    const headers = new Headers(upstreamHeaders);
    HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
    return headers;
};

// Forwarding request.body as a stream (with `duplex: "half"`) makes undici
// throw "expected non-null body source" under the dev server, and would do the
// same for any bodyless POST/DELETE such as /auth/logout. Buffering is
// predictable across runtimes; request sizes here are already capped by
// BODY_LIMIT_BYTES upstream, so holding one in memory is bounded.
const buildUpstreamInit = async (request) => {
    const init = {
        method: request.method,
        headers: buildForwardHeaders(request),
        cache: "no-store",
    };
    if (request.method === "GET" || request.method === "HEAD") return init;

    const buffered = await request.arrayBuffer();
    if (buffered.byteLength > 0) init.body = buffered;
    return init;
};

const proxy = async (request, context) => {
    const targetUrl = await buildTargetUrl(request, context.params);
    const upstream = await fetch(targetUrl, await buildUpstreamInit(request));

    return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: buildResponseHeaders(upstream.headers),
    });
};

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
