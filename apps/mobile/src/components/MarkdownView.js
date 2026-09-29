import React, { memo, useMemo } from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import { radius, spacing } from "../theme";
import { safeOpenURL } from "../utils/safeOpenURL";

const HTML_TAG_REGEX = /<\/?[a-zA-Z][^>]*>/g;

const stripHtmlTags = (str = "") => str.replace(HTML_TAG_REGEX, "");

const LINK_PLACEHOLDER_PREFIX = ":::LINK_";
const LINK_PLACEHOLDER_SUFFIX = ":::";

const extractLinks = (text) => {
    const links = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let replaced = text;
    let offset = 0;

    while ((match = linkRegex.exec(text)) !== null) {
        const placeholder = `${LINK_PLACEHOLDER_PREFIX}${links.length}${LINK_PLACEHOLDER_SUFFIX}`;
        links.push({ text: match[1], url: match[2], full: match[0] });
        const matchStart = match.index + offset;
        const matchEnd = matchStart + match[0].length;
        replaced = replaced.slice(0, matchStart) + placeholder + replaced.slice(matchEnd);
        offset += placeholder.length - match[0].length;
    }

    return { text: replaced, links };
};

const parseInline = (text = "", isDark = false, onLinkPress = null) => {
    if (!text) return null;

    let cleaned = text
        .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b\b[^>]*>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em\b[^>]*>(.*?)<\/em>/gi, "*$1*")
        .replace(/<i\b[^>]*>(.*?)<\/i>/gi, "*$1*")
        .replace(/<code\b[^>]*>(.*?)<\/code>/gi, "`$1`")
        .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(HTML_TAG_REGEX, "");

    const { text: withPlaceholders, links } = extractLinks(cleaned);

    const tokens = [];
    const tokenRegex = /(\*\*\*([^*]+)\*\*\*|___([^_]+)___|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/;

    let remaining = withPlaceholders;
    while (remaining.length > 0) {
        const match = remaining.match(tokenRegex);
        if (!match) {
            tokens.push({ type: "text", content: remaining });
            break;
        }

        const matchIndex = match.index;
        if (matchIndex > 0) {
            tokens.push({ type: "text", content: remaining.slice(0, matchIndex) });
        }

        const fullMatch = match[0];
        if (match[2] || match[3]) {
            tokens.push({ type: "boldItalic", content: match[2] || match[3] });
        } else if (match[4] || match[5]) {
            tokens.push({ type: "bold", content: match[4] || match[5] });
        } else if (match[6] || match[7]) {
            tokens.push({ type: "italic", content: match[6] || match[7] });
        } else if (match[8]) {
            tokens.push({ type: "code", content: match[8] });
        }

        remaining = remaining.slice(matchIndex + fullMatch.length);
    }

    const restoredTokens = [];
    const contentTokenTypes = new Set(["text", "boldItalic", "bold", "italic", "code"]);
    for (const token of tokens) {
        if (contentTokenTypes.has(token.type) && token.content) {
            const placeholderRegex = new RegExp(`${LINK_PLACEHOLDER_PREFIX}(\\d+)${LINK_PLACEHOLDER_SUFFIX}`, "g");
            let match;
            let lastIndex = 0;
            let hasMatch = false;
            while ((match = placeholderRegex.exec(token.content)) !== null) {
                hasMatch = true;
                if (match.index > lastIndex) {
                    restoredTokens.push({ type: token.type, content: token.content.slice(lastIndex, match.index) });
                }
                const linkIdx = parseInt(match[1], 10);
                const link = links[linkIdx];
                if (link) {
                    restoredTokens.push({ type: "link", text: link.text, url: link.url });
                }
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < token.content.length) {
                restoredTokens.push({ type: token.type, content: token.content.slice(lastIndex) });
            }
        } else {
            restoredTokens.push(token);
        }
    }

    const keyIdxRef = { current: 0 };
    return restoredTokens.map((token) => {
        switch (token.type) {
            case "text":
                return <Text key={`txt-${keyIdxRef.current++}`}>{token.content}</Text>;
            case "boldItalic":
                return (
                    <Text
                        key={`bi-${keyIdxRef.current++}`}
                        style={[styles.boldItalic, isDark && styles.boldItalicDark]}
                    >
                        {token.content}
                    </Text>
                );
            case "bold":
                return (
                    <Text
                        key={`b-${keyIdxRef.current++}`}
                        style={[styles.bold, isDark && styles.boldDark]}
                    >
                        {token.content}
                    </Text>
                );
            case "italic":
                return (
                    <Text
                        key={`i-${keyIdxRef.current++}`}
                        style={[styles.italic, isDark && styles.italicDark]}
                    >
                        {token.content}
                    </Text>
                );
            case "code":
                return (
                    <Text
                        key={`code-${keyIdxRef.current++}`}
                        style={[styles.inlineCode, isDark && styles.inlineCodeDark]}
                    >
                        {token.content}
                    </Text>
                );
            case "link":
                return (
                    <Text
                        accessibilityRole="link"
                        key={`link-${keyIdxRef.current++}`}
                        onPress={() => {
                            if (onLinkPress) {
                                onLinkPress(token.url);
                            } else {
                                safeOpenURL(token.url);
                            }
                        }}
                        style={[styles.link, isDark && styles.linkDark]}
                    >
                        {token.text}
                    </Text>
                );
            default:
                return <Text key={`txt-${keyIdxRef.current++}`}>{token.content}</Text>;
        }
    });
};

export const parseMarkdownBlocks = (raw = "") => {
    if (!raw) return [];

    let cleaned = String(raw).trim()
        .replace(/<h1\b[^>]*>(.*?)<\/h1>/gi, "# $1\n")
        .replace(/<h2\b[^>]*>(.*?)<\/h2>/gi, "## $1\n")
        .replace(/<h3\b[^>]*>(.*?)<\/h3>/gi, "### $1\n")
        .replace(/<h4\b[^>]*>(.*?)<\/h4>/gi, "#### $1\n")
        .replace(/<blockquote\b[^>]*>(.*?)<\/blockquote>/gi, "> $1\n")
        .replace(/<hr\s*\/?>/gi, "---\n")
        .replace(/<p\b[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<\/?(?:article|div|main|section)\b[^>]*>/gi, "");

    const lines = cleaned.split("\n");
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            i++;
            continue;
        }

        if (trimmed.startsWith("```")) {
            const lang = trimmed.slice(3).trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            if (i < lines.length) i++;
            blocks.push({
                type: "code",
                lang,
                code: codeLines.join("\n"),
            });
            continue;
        }

        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
            blocks.push({ type: "hr" });
            i++;
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = stripHtmlTags(headingMatch[2].trim());
            blocks.push({
                type: "heading",
                level,
                text,
            });
            i++;
            continue;
        }

        if (trimmed.startsWith(">")) {
            const quoteLines = [trimmed.replace(/^>\s*/, "")];
            i++;
            while (
                i < lines.length &&
                lines[i].trim() !== "" &&
                !lines[i].trim().startsWith("#") &&
                !lines[i].trim().startsWith("```") &&
                !/^(\*{3,}|-{3,}|_{3,})$/.test(lines[i].trim()) &&
                !/^[-*+]\s+/.test(lines[i].trim()) &&
                !/^\d+\.\s+/.test(lines[i].trim())
            ) {
                quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
                i++;
            }
            blocks.push({
                type: "blockquote",
                text: quoteLines.join(" "),
            });
            continue;
        }

        const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (ulMatch) {
            const listItems = [ulMatch[1].trim()];
            i++;
            while (i < lines.length) {
                const nextTrimmed = lines[i].trim();
                const nextMatch = nextTrimmed.match(/^[-*+]\s+(.+)$/);
                if (!nextMatch) break;
                listItems.push(nextMatch[1].trim());
                i++;
            }
            blocks.push({
                type: "ul",
                items: listItems,
            });
            continue;
        }

        const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (olMatch) {
            const listItems = [{ num: olMatch[1], text: olMatch[2].trim() }];
            i++;
            while (i < lines.length) {
                const nextTrimmed = lines[i].trim();
                const nextMatch = nextTrimmed.match(/^(\d+)\.\s+(.+)$/);
                if (!nextMatch) break;
                listItems.push({ num: nextMatch[1], text: nextMatch[2].trim() });
                i++;
            }
            blocks.push({
                type: "ol",
                items: listItems,
            });
            continue;
        }

        const paraLines = [line];
        i++;
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !lines[i].trim().startsWith("#") &&
            !lines[i].trim().startsWith(">") &&
            !lines[i].trim().startsWith("```") &&
            !/^(\*{3,}|-{3,}|_{3,})$/.test(lines[i].trim()) &&
            !/^[-*+]\s+/.test(lines[i].trim()) &&
            !/^\d+\.\s+/.test(lines[i].trim())
        ) {
            paraLines.push(lines[i]);
            i++;
        }
        blocks.push({
            type: "p",
            text: paraLines.join(" "),
        });
    }

    return blocks;
};

export const MarkdownView = memo(function MarkdownView({
    content = "",
    isDark = false,
    onLinkPress = null,
    style,
    testID = "markdown-view",
}) {
    const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

    return (
        <View style={[styles.root, style]} testID={testID}>
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case "heading": {
                        const headingStyle = [
                            styles.heading,
                            block.level === 1 && styles.h1,
                            block.level === 2 && styles.h2,
                            block.level === 3 && styles.h3,
                            block.level === 4 && styles.h4,
                            isDark && styles.headingDark,
                            block.level === 2 && isDark && styles.h2Dark,
                        ];
                        return (
                            <View
                                key={`h-${idx}`}
                                style={styles.headingContainer}
                            >
                                <Text
                                    accessibilityRole='header'
                                    style={headingStyle}
                                >
                                    {parseInline(block.text, isDark, onLinkPress)}
                                </Text>
                            </View>
                        );
                    }
                    case "blockquote": {
                        return (
                            <View
                                key={`bq-${idx}`}
                                style={[
                                    styles.blockquote,
                                    isDark && styles.blockquoteDark,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.blockquoteText,
                                        isDark && styles.blockquoteTextDark,
                                    ]}
                                >
                                    {parseInline(block.text, isDark, onLinkPress)}
                                </Text>
                            </View>
                        );
                    }
                    case "ul": {
                        return (
                            <View key={`ul-${idx}`} style={styles.listContainer}>
                                {block.items.map((item, itemIdx) => (
                                    <View
                                        key={`uli-${itemIdx}`}
                                        style={styles.listItemRow}
                                    >
                                        <Text
                                            style={[
                                                styles.bullet,
                                                isDark && styles.bulletDark,
                                            ]}
                                        >
                                            •
                                        </Text>
                                        <Text
                                            style={[
                                                styles.listItemText,
                                                isDark && styles.listItemTextDark,
                                            ]}
                                        >
                                            {parseInline(item, isDark, onLinkPress)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        );
                    }
                    case "ol": {
                        return (
                            <View key={`ol-${idx}`} style={styles.listContainer}>
                                {block.items.map((item, itemIdx) => (
                                    <View
                                        key={`oli-${itemIdx}`}
                                        style={styles.listItemRow}
                                    >
                                        <Text
                                            style={[
                                                styles.orderNumber,
                                                isDark && styles.orderNumberDark,
                                            ]}
                                        >
                                            {item.num}.
                                        </Text>
                                        <Text
                                            style={[
                                                styles.listItemText,
                                                isDark && styles.listItemTextDark,
                                            ]}
                                        >
                                            {parseInline(item.text, isDark, onLinkPress)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        );
                    }
                    case "code": {
                        return (
                            <View
                                key={`codeblock-${idx}`}
                                style={[
                                    styles.codeBlock,
                                    isDark && styles.codeBlockDark,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.codeBlockText,
                                        isDark && styles.codeBlockTextDark,
                                    ]}
                                >
                                    {block.code}
                                </Text>
                            </View>
                        );
                    }
                    case "hr": {
                        return (
                            <View
                                key={`hr-${idx}`}
                                style={[styles.hr, isDark && styles.hrDark]}
                            />
                        );
                    }
                    case "p":
                    default: {
                        return (
                            <Text
                                key={`p-${idx}`}
                                style={[styles.p, isDark && styles.pDark]}
                            >
                                {parseInline(block.text, isDark, onLinkPress)}
                            </Text>
                        );
                    }
                }
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    root: {
        width: "100%",
    },
    headingContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    heading: {
        color: "#064e3b",
        fontWeight: "800",
    },
    headingDark: {
        color: "#f8fafc",
    },
    h1: {
        fontSize: 22,
        lineHeight: 28,
    },
    h2: {
        borderBottomColor: "rgba(148, 163, 184, 0.25)",
        borderBottomWidth: 1,
        fontSize: 18,
        lineHeight: 24,
        paddingBottom: 4,
    },
    h2Dark: {
        borderBottomColor: "rgba(148, 163, 184, 0.2)",
    },
    h3: {
        fontSize: 15,
        lineHeight: 21,
    },
    h4: {
        fontSize: 14,
        lineHeight: 20,
    },
    p: {
        color: "#374151",
        fontSize: 14,
        lineHeight: 22,
        marginVertical: 4,
    },
    pDark: {
        color: "#cbd5e1",
    },
    bold: {
        fontWeight: "700",
    },
    boldDark: {
        color: "#f8fafc",
        fontWeight: "700",
    },
    italic: {
        fontStyle: "italic",
    },
    italicDark: {
        fontStyle: "italic",
    },
    boldItalic: {
        fontStyle: "italic",
        fontWeight: "700",
    },
    boldItalicDark: {
        color: "#f8fafc",
        fontStyle: "italic",
        fontWeight: "700",
    },
    inlineCode: {
        backgroundColor: "rgba(15, 23, 42, 0.06)",
        borderColor: "rgba(148, 163, 184, 0.25)",
        borderRadius: 4,
        borderWidth: 0.5,
        color: "#0f172a",
        fontFamily: "monospace",
        fontSize: 12.5,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    inlineCodeDark: {
        backgroundColor: "rgba(148, 163, 184, 0.15)",
        borderColor: "rgba(148, 163, 184, 0.2)",
        color: "#f1f5f9",
    },
    link: {
        color: "#047857",
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    linkDark: {
        color: "#34d399",
    },
    blockquote: {
        backgroundColor: "rgba(16, 185, 129, 0.08)",
        borderLeftColor: "#10b981",
        borderLeftWidth: 3.5,
        borderRadius: radius.sm,
        marginVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    blockquoteDark: {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderLeftColor: "#34d399",
    },
    blockquoteText: {
        color: "#334155",
        fontSize: 13.5,
        fontStyle: "italic",
        lineHeight: 21,
    },
    blockquoteTextDark: {
        color: "#cbd5e1",
    },
    listContainer: {
        marginVertical: 4,
        paddingLeft: spacing.xs,
    },
    listItemRow: {
        alignItems: "flex-start",
        flexDirection: "row",
        marginVertical: 2,
    },
    bullet: {
        color: "#10b981",
        fontSize: 14,
        fontWeight: "900",
        marginRight: spacing.xs,
        marginTop: 1,
    },
    bulletDark: {
        color: "#34d399",
    },
    orderNumber: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "700",
        marginRight: spacing.xs,
        marginTop: 2,
        minWidth: 16,
    },
    orderNumberDark: {
        color: "#34d399",
    },
    listItemText: {
        color: "#374151",
        flex: 1,
        fontSize: 14,
        lineHeight: 21,
    },
    listItemTextDark: {
        color: "#cbd5e1",
    },
    codeBlock: {
        backgroundColor: "#0f172a",
        borderColor: "rgba(148, 163, 184, 0.2)",
        borderRadius: radius.md,
        borderWidth: 1,
        marginVertical: spacing.sm,
        padding: spacing.md,
    },
    codeBlockDark: {
        backgroundColor: "#090d16",
        borderColor: "rgba(148, 163, 184, 0.2)",
    },
    codeBlockText: {
        color: "#f8fafc",
        fontFamily: "monospace",
        fontSize: 12.5,
        lineHeight: 18,
    },
    codeBlockTextDark: {
        color: "#e2e8f0",
    },
    hr: {
        backgroundColor: "rgba(148, 163, 184, 0.25)",
        height: 1,
        marginVertical: spacing.md,
        width: "100%",
    },
    hrDark: {
        backgroundColor: "rgba(148, 163, 184, 0.2)",
    },
});
