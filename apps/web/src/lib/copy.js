export const CopyImageToClipboard = (canvas) => {
    return new Promise((resolve, reject) => {
        try {
            if (navigator.clipboard && navigator.clipboard.write) {
                canvas.toBlob(async (blob) => {
                    try {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);
                        resolve();
                    } catch (err) {
                        console.error("Error copying image to clipboard:", err);
                        reject(err);
                    }
                });
            } else {
                // Clipboard API not supported — silent no-op
                console.warn("Clipboard write API not supported");
                resolve();
            }
        } catch (error) {
            console.error("Error copying image to clipboard:", error);
            reject(error);
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
