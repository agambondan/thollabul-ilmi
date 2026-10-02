export function parseExtractedText(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const lines = rawText.split(/\r?\n/);
    const blocks = [];

    let currentParagraph = [];
    let currentList = [];
    let currentArabic = [];
    let currentQuote = [];

    const isArabicLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        const arabicMatch = trimmed.match(
            /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
        );
        return Boolean(
            arabicMatch &&
                arabicMatch.length > trimmed.replace(/\s+/g, "").length * 0.35,
        );
    };

    const isHeadingLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length > 120) return false;

        const isAllUpper =
            trimmed === trimmed.toUpperCase() &&
            trimmed.length >= 3 &&
            /[A-Z]/.test(trimmed) &&
            !trimmed.endsWith(".");

        const isExplicitHeading =
            /^(BAB|FASAL|PASAL|BAGIAN|KITAB|PELAJARAN|MUKADIMAH|PENDAHULUAN|PENUTUP|DOSA\s+(?:KE-?\d+|KESATU|KEDUA|KETIGA|KEEMPAT|KELIMA|KEENAM|KETUJUH|KEDELAPAN|KESEMBILAN|KESEPULUH|[A-Z]+))\b/i.test(
                trimmed,
            );

        const isNumberedHeading =
            /^(?:(?:[0-9]+|[IVXLCDM]+)\.|\([0-9]+\))\s+[A-Z\s]{4,80}$/.test(
                trimmed,
            );

        return isAllUpper || isExplicitHeading || isNumberedHeading;
    };

    const isListLine = (line) => {
        const trimmed = line.trim();
        return /^(\d+\.|\([0-9]+\)|[a-z]\.|\([a-z]\)|[-*•])\s+(.+)$/i.test(
            trimmed,
        );
    };

    const isQuoteStart = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        return (
            /^["“«']/.test(trimmed) ||
            /^(?:Allah(?:\s+Ta'?ala)?\s+berfirman|Firman\s+Allah|Rasulullah\s+.*bersabda|Sabda\s+beliau|Dari\s+.*radhiyallahu\s+'anhu)\s*:\s*["“«']/i.test(
                trimmed,
            )
        );
    };

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            const raw = currentParagraph.join(" ");
            const cleaned = raw.replace(/\s+/g, " ").trim();
            if (cleaned) {
                const citationMatch = cleaned.match(
                    /\(((?:QS\.?|Surah|Surat|HR\.?|H\.R\.?|[A-Za-z\s\-]+)\s*[:\d\s,\-–—]+)\)\s*$/i,
                );
                blocks.push({
                    type: "paragraph",
                    text: cleaned,
                    citation: citationMatch ? citationMatch[1] : null,
                });
            }
            currentParagraph = [];
        }
    };

    const flushList = () => {
        if (currentList.length > 0) {
            blocks.push({
                type: "list",
                items: currentList,
            });
            currentList = [];
        }
    };

    const flushArabic = () => {
        if (currentArabic.length > 0) {
            blocks.push({
                type: "arabic",
                text: currentArabic.join("\n"),
            });
            currentArabic = [];
        }
    };

    const flushQuote = () => {
        if (currentQuote.length > 0) {
            const text = currentQuote.join(" ").replace(/\s+/g, " ").trim();
            const citationMatch = text.match(
                /\(((?:QS\.?|Surah|Surat|HR\.?|H\.R\.?|[A-Za-z\s\-]+)\s*[:\d\s,\-–—]+)\)\s*$/i,
            );
            blocks.push({
                type: "quote",
                text,
                citation: citationMatch ? citationMatch[1] : null,
            });
            currentQuote = [];
        }
    };

    let inQuote = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            flushList();
            flushArabic();
            flushQuote();
            inQuote = false;
            continue;
        }

        if (isArabicLine(trimmed)) {
            flushParagraph();
            flushList();
            flushQuote();
            inQuote = false;
            currentArabic.push(trimmed);
            continue;
        } else if (currentArabic.length > 0) {
            flushArabic();
        }

        if (isHeadingLine(trimmed)) {
            flushParagraph();
            flushList();
            flushQuote();
            inQuote = false;

            const isH2 =
                /^(?:BAB\b|[A-Z\s]{4,80}$)/.test(trimmed) ||
                /^(?:[0-9]+|[IVXLCDM]+)\.\s+[A-Z\s]+$/.test(trimmed);

            blocks.push({
                type: "heading",
                level: isH2 ? 2 : 3,
                text: trimmed,
            });
            continue;
        }

        if (isListLine(trimmed)) {
            flushParagraph();
            flushQuote();
            inQuote = false;

            const listMatch = trimmed.match(
                /^(\d+\.|\([0-9]+\)|[a-z]\.|\([a-z]\)|[-*•])\s+(.+)$/i,
            );
            currentList.push({
                prefix: listMatch[1],
                text: listMatch[2],
            });
            continue;
        } else if (currentList.length > 0) {
            flushList();
        }

        if (isQuoteStart(trimmed) || inQuote) {
            flushParagraph();
            currentQuote.push(trimmed);
            const endsWithQuoteOrCitation =
                /["”»'](?:\s*\([^)]+\))?\.?$/.test(trimmed);
            if (endsWithQuoteOrCitation) {
                flushQuote();
                inQuote = false;
            } else {
                inQuote = true;
            }
            continue;
        }

        currentParagraph.push(trimmed);
    }

    flushParagraph();
    flushList();
    flushArabic();
    flushQuote();

    return blocks;
}

export function blocksToMarkdown(blocks, pageNumber = null, bookTitle = "") {
    if (!Array.isArray(blocks) || blocks.length === 0) return "";

    const lines = [];

    if (pageNumber) {
        lines.push(
            `<!-- Halaman ${pageNumber}${bookTitle ? ` - ${bookTitle}` : ""} -->`,
        );
        lines.push("");
    }

    for (const b of blocks) {
        if (b.type === "heading") {
            const prefix = b.level === 2 ? "##" : "###";
            lines.push(`${prefix} ${b.text}`);
            lines.push("");
        } else if (b.type === "arabic") {
            lines.push("```arabic");
            lines.push(b.text);
            lines.push("```");
            lines.push("");
        } else if (b.type === "quote") {
            lines.push(`> ${b.text}`);
            lines.push("");
        } else if (b.type === "list") {
            for (const item of b.items) {
                const isNum = /^\d+\./.test(item.prefix);
                lines.push(`${isNum ? item.prefix : "-"} ${item.text}`);
            }
            lines.push("");
        } else {
            lines.push(b.text);
            lines.push("");
        }
    }

    return lines.join("\n").trim();
}

export function formatExtractedTextAsMarkdown(
    rawText,
    pageNumber = null,
    bookTitle = "",
) {
    const blocks = parseExtractedText(rawText);
    return blocksToMarkdown(blocks, pageNumber, bookTitle);
}

export function downloadMarkdownFile(filename, markdownContent) {
    if (typeof window === "undefined") return;
    const blob = new Blob([markdownContent], {
        type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".md") ? filename : `${filename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
