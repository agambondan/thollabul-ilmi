/**
 * Blog content helpers: lightweight markdown-to-html compiler,
 * heading extraction for TOC, reading statistics, and safe HTML sanitization.
 */

const BLOG_ALLOWED_TAGS = new Set([
    "h1",
    "h2",
    "h3",
    "h4",
    "p",
    "span",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "strike",
    "del",
    "br",
    "hr",
    "blockquote",
    "code",
    "pre",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
]);

const BLOG_ALLOWED_ATTRS = new Set([
    "href",
    "src",
    "alt",
    "title",
    "id",
    "class",
    "target",
    "rel",
    "width",
    "height",
]);

export const sanitizeBlogHtml = (html) => {
    if (!html) return "";

    // Strip dangerous tags completely
    const stripped = String(html)
        .replace(
            /<\s*(script|style|iframe|object|embed|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi,
            "",
        )
        .replace(
            /<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi,
            "",
        );

    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
        return stripped
            .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
            .replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>]*/gi, "")
            .replace(/<a\s+(?![^>]*\btarget=)([^>]*href="[^"]*"[^>]*)>/gi, '<a target="_blank" rel="noopener noreferrer" $1>');
    }

    const doc = new DOMParser().parseFromString(
        `<div id="blog-root">${stripped}</div>`,
        "text/html",
    );
    const root = doc.getElementById("blog-root");
    if (!root) return stripped;

    const walk = (node) => {
        for (const child of Array.from(node.children)) {
            const tag = child.tagName.toLowerCase();
            if (!BLOG_ALLOWED_TAGS.has(tag)) {
                child.replaceWith(...Array.from(child.childNodes));
                continue;
            }
            for (const attr of Array.from(child.attributes)) {
                const attrName = attr.name.toLowerCase();
                if (!BLOG_ALLOWED_ATTRS.has(attrName)) {
                    child.removeAttribute(attr.name);
                    continue;
                }
                // Disallow javascript: links
                if (
                    (attrName === "href" || attrName === "src") &&
                    attr.value.trim().toLowerCase().startsWith("javascript:")
                ) {
                    child.removeAttribute(attr.name);
                }
            }
            if (tag === "a") {
                child.setAttribute("target", "_blank");
                child.setAttribute("rel", "noopener noreferrer");
            }
            walk(child);
        }
    };

    walk(root);
    return root.innerHTML;
};

export const slugifyHeading = (text) =>
    String(text ?? "")
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

/**
 * Basic markdown to HTML renderer (zero-dependency).
 * If the input already contains HTML tags (e.g. <p>, <h2>), it treats it as HTML.
 */
export const renderBlogContent = (raw) => {
    if (!raw) return "";

    const trimmed = String(raw).trim();
    // Detect if content is primarily HTML already
    if (/^\s*<[a-z][\s\S]*>/i.test(trimmed)) {
        return sanitizeBlogHtml(injectHeadingIds(trimmed));
    }

    // Markdown conversion
    const lines = trimmed.split("\n");
    const output = [];
    let inCodeBlock = false;
    let inList = false;
    let listType = "ul";

    const escapeHtml = (str) =>
        str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const formatInline = (text) => {
        return text
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\*([^*]+)\*/g, "<em>$1</em>")
            .replace(
                /!\[([^\]]*)\]\(([^)]+)\)/g,
                '<img src="$2" alt="$1" loading="lazy" />',
            )
            .replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
            );
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code block toggle
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                output.push("</code></pre>");
                inCodeBlock = false;
            } else {
                if (inList) {
                    output.push(`</${listType}>`);
                    inList = false;
                }
                const lang = line.trim().slice(3).trim();
                output.push(
                    `<pre><code class="${lang ? `language-${lang}` : ""}">`,
                );
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            output.push(escapeHtml(line) + "\n");
            continue;
        }

        const trimmedLine = line.trim();

        // Horizontal rule
        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmedLine)) {
            if (inList) {
                output.push(`</${listType}>`);
                inList = false;
            }
            output.push("<hr />");
            continue;
        }

        // Headings
        const headingMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            if (inList) {
                output.push(`</${listType}>`);
                inList = false;
            }
            const level = headingMatch[1].length;
            const headingText = headingMatch[2].trim();
            const id = slugifyHeading(headingText);
            output.push(
                `<h${level} id="${id}">${formatInline(headingText)}</h${level}>`,
            );
            continue;
        }

        // Blockquotes
        if (trimmedLine.startsWith(">")) {
            if (inList) {
                output.push(`</${listType}>`);
                inList = false;
            }
            const quoteContent = trimmedLine.replace(/^>\s*/, "");
            output.push(`<blockquote>${formatInline(quoteContent)}</blockquote>`);
            continue;
        }

        // Unordered lists
        const ulMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
        if (ulMatch) {
            if (!inList || listType !== "ul") {
                if (inList) output.push(`</${listType}>`);
                output.push("<ul>");
                inList = true;
                listType = "ul";
            }
            output.push(`<li>${formatInline(ulMatch[1])}</li>`);
            continue;
        }

        // Ordered lists
        const olMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            if (!inList || listType !== "ol") {
                if (inList) output.push(`</${listType}>`);
                output.push("<ol>");
                inList = true;
                listType = "ol";
            }
            output.push(`<li>${formatInline(olMatch[1])}</li>`);
            continue;
        }

        // Empty lines / paragraph breaks
        if (!trimmedLine) {
            if (inList) {
                output.push(`</${listType}>`);
                inList = false;
            }
            continue;
        }

        // Paragraph
        if (inList) {
            output.push(`</${listType}>`);
            inList = false;
        }
        output.push(`<p>${formatInline(trimmedLine)}</p>`);
    }

    if (inCodeBlock) output.push("</code></pre>");
    if (inList) output.push(`</${listType}>`);

    return sanitizeBlogHtml(output.join("\n"));
};

/**
 * Ensure all <h2> and <h3> in HTML have an `id` attribute for TOC linking.
 */
export const injectHeadingIds = (html) => {
    if (!html) return "";
    return html.replace(
        /<(h[23])(\s+[^>]*)?>(.*?)<\/\1>/gi,
        (match, tag, attrs = "", content) => {
            if (attrs && /id\s*=/i.test(attrs)) {
                return match;
            }
            const cleanText = content.replace(/<[^>]*>/g, "").trim();
            const id = slugifyHeading(cleanText);
            return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
        },
    );
};

/**
 * Extract TOC items from rendered HTML or raw text.
 */
export const extractHeadings = (htmlOrMarkdown) => {
    if (!htmlOrMarkdown) return [];

    const headings = [];
    const hRegex = /<(h[23])(?:\s+[^>]*?id="([^"]*)")?[^>]*>(.*?)<\/\1>/gi;
    let match;

    while ((match = hRegex.exec(htmlOrMarkdown)) !== null) {
        const level = parseInt(match[1].charAt(1), 10);
        const text = match[3].replace(/<[^>]*>/g, "").trim();
        const id = match[2] || slugifyHeading(text);
        if (text) {
            headings.push({ id, text, level });
        }
    }

    // Fallback: if no HTML headings found, look for markdown headings
    if (headings.length === 0) {
        const mdRegex = /^(#{2,3})\s+(.+)$/gm;
        while ((match = mdRegex.exec(htmlOrMarkdown)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = slugifyHeading(text);
            if (text) {
                headings.push({ id, text, level });
            }
        }
    }

    return headings;
};

/**
 * Calculate word count and estimated reading time.
 */
export const calculateReadStats = (textOrHtml) => {
    if (!textOrHtml) return { words: 0, minutes: 0 };
    const clean = String(textOrHtml)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const words = clean ? clean.split(" ").length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
};
