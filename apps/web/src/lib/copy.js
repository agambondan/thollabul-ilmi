export const CopyImageToClipboard = (canvas) => {
    return new Promise((resolve, reject) => {
        try {
            if (
                navigator.clipboard &&
                navigator.clipboard.write &&
                window.ClipboardItem
            ) {
                canvas.toBlob(async (blob) => {
                    try {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);
                        resolve();
                    } catch (err) {
                        console.error("Error copying image to clipboard:", err);
                        reject(err);
                    }
                }, "image/png");
            } else {
                const link = document.createElement("a");
                link.download = "share-image.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
                resolve();
            }
        } catch (error) {
            console.error("Error copying image to clipboard:", error);
            try {
                const link = document.createElement("a");
                link.download = "share-image.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
                resolve();
            } catch {
                reject(error);
            }
        }
    });
};

export const shareCanvasWithText = (canvas, { title, text, url, filename = "share.png" } = {}) => {
    return new Promise((resolve, reject) => {
        const afterBlob = async (blob) => {
            if (!blob) {
                reject(new Error("Blob kosong"));
                return;
            }
            const file = new File([blob], filename, { type: "image/png" });
            const canFileShare =
                typeof navigator !== "undefined" &&
                navigator.canShare &&
                navigator.canShare({ files: [file] }) &&
                navigator.share;
            if (!canFileShare) {
                reject(new Error("UNSUPPORTED"));
                return;
            }
            try {
                await navigator.share({
                    files: [file],
                    title: title || "Thullaabul 'Ilmi",
                    text: text || "",
                    url: url || undefined,
                });
                resolve();
            } catch (err) {
                if (err && err.name === "AbortError") resolve();
                else reject(err);
            }
        };
        if (typeof canvas.toBlob === "function") {
            canvas.toBlob(afterBlob, "image/png");
        } else {
            try {
                const dataUrl = canvas.toDataURL("image/png");
                fetch(dataUrl).then((r) => r.blob()).then(afterBlob).catch(reject);
            } catch (err) {
                reject(err);
            }
        }
    });
};

export const CopyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const el = document.createElement("textarea");
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
        }
    } catch (error) {
        console.error("Error copying to clipboard:", error);
    }
};
