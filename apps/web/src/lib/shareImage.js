const ARABIC_PATTERN =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const FRAME_ALPHA = 0.92;
const MIN_SCALE = 0.45;
const SCALE_STEP = 0.94;

export const isArabicText = (value) => ARABIC_PATTERN.test(value || "");

/**
 * Pecah satu baris logis menjadi blok dengan peran (arabic / latin / meta).
 * Dua baris terakhir yang pendek dianggap meta (sitasi + via URL).
 */
export const classifyShareLines = (text) => {
    const lines = (text || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    return lines.map((value, index) => {
        if (isArabicText(value)) return { value, role: "arabic" };
        const isTail = index >= lines.length - 2 && value.length <= 140;
        return { value, role: isTail ? "meta" : "latin" };
    });
};

const breakLongWord = (context, word, maxWidth) => {
    const chunks = [];
    let current = "";

    for (const char of word) {
        const candidate = current + char;
        if (current && context.measureText(candidate).width > maxWidth) {
            chunks.push(current);
            current = char;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);

    return chunks;
};

/**
 * Word wrap sesuai font yang sedang aktif di context.
 * Urutan kata dijaga logis, jadi bidi engine yang mengatur arah tampilan.
 */
export const wrapShareLine = (context, line, maxWidth) => {
    const words = line.split(/\s+/).filter(Boolean);
    if (!words.length) return [];

    const rows = [];
    let current = "";

    const pushWord = (word) => {
        if (!current) {
            if (context.measureText(word).width > maxWidth) {
                const chunks = breakLongWord(context, word, maxWidth);
                rows.push(...chunks.slice(0, -1));
                current = chunks[chunks.length - 1] || "";
            } else {
                current = word;
            }
            return;
        }

        const candidate = `${current} ${word}`;
        if (context.measureText(candidate).width <= maxWidth) {
            current = candidate;
            return;
        }

        rows.push(current);
        current = "";
        pushWord(word);
    };

    words.forEach(pushWord);
    if (current) rows.push(current);

    return rows;
};

const buildFonts = (scale, width, hasKitab) => {
    const arabicFamily = hasKitab ? "Kitab, serif" : "serif";
    const latinFamily =
        "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
    const size = (ratio) => Math.max(11, Math.round(width * ratio * scale));

    const arabicSize = size(0.042);
    const latinSize = size(0.0265);
    const metaSize = size(0.021);

    return {
        arabic: {
            font: `${arabicSize}px ${arabicFamily}`,
            lineHeight: Math.round(arabicSize * 1.85),
            direction: "rtl",
            color: "#111827",
        },
        latin: {
            font: `${latinSize}px ${latinFamily}`,
            lineHeight: Math.round(latinSize * 1.5),
            direction: "ltr",
            color: "#111827",
        },
        meta: {
            font: `italic ${metaSize}px ${latinFamily}`,
            lineHeight: Math.round(metaSize * 1.5),
            direction: "ltr",
            color: "#4b5563",
        },
        blockGap: Math.round(latinSize * 0.7),
    };
};

/**
 * Susun semua baris menjadi row siap gambar, plus total tingginya.
 */
const buildLayout = (context, blocks, maxWidth, styles) => {
    const rows = [];
    let totalHeight = 0;

    blocks.forEach((block, index) => {
        const style = styles[block.role];
        context.font = style.font;
        context.direction = style.direction;

        const wrapped = wrapShareLine(context, block.value, maxWidth);
        const gapAfter = index === blocks.length - 1 ? 0 : styles.blockGap;

        wrapped.forEach((value, rowIndex) => {
            rows.push({
                value,
                font: style.font,
                direction: style.direction,
                color: style.color,
                lineHeight: style.lineHeight,
                gapAfter: rowIndex === wrapped.length - 1 ? gapAfter : 0,
            });
            totalHeight += style.lineHeight;
        });

        totalHeight += wrapped.length ? gapAfter : 0;
    });

    return { rows, totalHeight };
};

const clipRows = (rows, availableHeight) => {
    const kept = [];
    let used = 0;

    for (const row of rows) {
        if (used + row.lineHeight > availableHeight) break;
        kept.push(row);
        used += row.lineHeight + row.gapAfter;
    }

    if (kept.length && kept.length < rows.length) {
        const last = kept[kept.length - 1];
        kept[kept.length - 1] = { ...last, value: `${last.value} …` };
    }

    return kept;
};

/**
 * Gambar teks share ke atas background, dengan frame putih semi transparan.
 * Font Arab dideteksi dari isi baris (bukan dari urutan baris), ukuran font
 * mengecil otomatis sampai seluruh teks masuk ke dalam frame.
 */
export const renderShareImage = ({ image, text, hasKitab = false }) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const frameInset = Math.round(canvas.width * 0.03);
    const textPadding = Math.round(canvas.width * 0.045);

    context.globalAlpha = FRAME_ALPHA;
    context.fillStyle = "rgb(255, 255, 255)";
    context.fillRect(
        frameInset,
        frameInset,
        canvas.width - frameInset * 2,
        canvas.height - frameInset * 2,
    );
    context.globalAlpha = 1;

    const blocks = classifyShareLines(text);
    if (!blocks.length) return canvas;

    const maxWidth = canvas.width - (frameInset + textPadding) * 2;
    const availableHeight = canvas.height - (frameInset + textPadding) * 2;

    context.textAlign = "center";
    context.textBaseline = "middle";

    let scale = 1;
    let layout = buildLayout(
        context,
        blocks,
        maxWidth,
        buildFonts(scale, canvas.width, hasKitab),
    );

    while (layout.totalHeight > availableHeight && scale > MIN_SCALE) {
        scale = Math.max(MIN_SCALE, scale * SCALE_STEP);
        layout = buildLayout(
            context,
            blocks,
            maxWidth,
            buildFonts(scale, canvas.width, hasKitab),
        );
    }

    const rows =
        layout.totalHeight > availableHeight
            ? clipRows(layout.rows, availableHeight)
            : layout.rows;

    const usedHeight = rows.reduce(
        (sum, row) => sum + row.lineHeight + row.gapAfter,
        0,
    );

    let cursor =
        frameInset +
        textPadding +
        Math.max(0, (availableHeight - usedHeight) / 2);
    const centerX = canvas.width / 2;

    rows.forEach((row) => {
        context.font = row.font;
        context.direction = row.direction;
        context.fillStyle = row.color;
        context.fillText(row.value, centerX, cursor + row.lineHeight / 2);
        cursor += row.lineHeight + row.gapAfter;
    });

    return canvas;
};
