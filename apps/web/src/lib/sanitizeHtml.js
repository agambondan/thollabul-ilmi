/**
 * Whitelist sanitizer for the small amount of HTML that reaches the DOM from
 * the API: tajweed markup on ayat (`<tajweed class="...">`) and the rich-text
 * body of notes. Content is authored through the admin panel, so a compromised
 * admin account would otherwise be a stored-XSS path straight into every
 * reader.
 *
 * Deliberately narrow — it allows the tags these two features actually use and
 * drops everything else, rather than trying to be a general-purpose cleaner.
 */
const ALLOWED_TAGS = new Set([
    "tajweed",
    "span",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "br",
    "p",
    "sup",
    "sub",
    "small",
    "ul",
    "ol",
    "li",
    "blockquote",
]);

const ALLOWED_ATTRS = new Set(["class", "dir", "lang"]);

const stripDangerous = (html) =>
    String(html)
        // whole elements whose content is executable or fetches remotely
        .replace(
            /<\s*(script|style|iframe|object|embed|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi,
            "",
        )
        .replace(
            /<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi,
            "",
        );

/**
 * Runs on the server (regex pass only) and in the browser (regex pass plus a
 * DOM walk). The server pass is intentionally conservative: it is a fallback
 * for SSR, and the browser re-sanitizes the same string before it is shown.
 */
export const sanitizeHtml = (html) => {
    if (!html) return "";
    const rough = stripDangerous(html);

    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
        // No DOM available: additionally drop every inline event handler and
        // javascript: URL, then hand back the reduced string.
        return rough
            .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
            .replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>]*/gi, "");
    }

    const doc = new DOMParser().parseFromString(
        `<div id="root">${rough}</div>`,
        "text/html",
    );
    const root = doc.getElementById("root");

    const walk = (node) => {
        for (const child of Array.from(node.children)) {
            const tag = child.tagName.toLowerCase();
            if (!ALLOWED_TAGS.has(tag)) {
                // Keep the text, drop the element.
                child.replaceWith(...Array.from(child.childNodes));
                continue;
            }
            for (const attr of Array.from(child.attributes)) {
                if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
                    child.removeAttribute(attr.name);
                }
            }
            walk(child);
        }
    };

    walk(root);
    return root.innerHTML;
};
