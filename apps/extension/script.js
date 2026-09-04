// Thullaabul 'Ilmi Board - New Tab Extension
// Fitur: Jadwal sholat + Countdown, Rotasi background masjid, Checklist harian (local + server sync), Auth web sync.

const ALADHAN_BASE = "https://api.aladhan.com/v1";
const WEB_API_BASE = "https://thollabul.jangkauin.site";
const DEFAULT_LOC = { lat: -6.2088, lng: 106.8456, name: "Jakarta (Default)" };

const BG_IMAGES = [
    "backgrounds/NightMosque.svg",
    "backgrounds/SunriseMasjid.svg",
    "backgrounds/QuranCosmic.svg",
    "backgrounds/Haram1.jpg",
    "backgrounds/Haram3.jpg",
    "backgrounds/Haram4.jpg",
    "backgrounds/Masjid2.jpg",
    "backgrounds/Masjid3.jpg",
    "backgrounds/Masjid4.jpg",
    "backgrounds/Nabawi1.jpg",
    "backgrounds/Nabawi2.jpg",
    "backgrounds/Nabawi3.jpg",
    "backgrounds/Nabawi6.jpg",
];

const QUOTES = [
    {
        text: "Menuntut ilmu itu wajib atas setiap muslim.",
        source: "HR. Ibnu Majah no. 224",
    },
    {
        text: "Seseorang yang berjalan dalam menuntut ilmu, maka Allah akan memudahkan jalannya ke surga.",
        source: "HR. Muslim no. 2699",
    },
    {
        text: "Sesungguhnya bersama kesulitan ada kemudahan.",
        source: "QS. Al-Insyirah: 6",
    },
    {
        text: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.",
        source: "QS. Ar-Ra'd: 28",
    },
    {
        text: "Bacalah dengan menyebut nama Tuhanmu yang menciptakan.",
        source: "QS. Al-Alaq: 1",
    },
    {
        text: "Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam.",
        source: "HR. Bukhari & Muslim",
    },
];

const PRAYER_NAMES = {
    fajr: "Subuh",
    dhuhr: "Dzuhur",
    asr: "Ashar",
    maghrib: "Maghrib",
    isha: "Isya",
};

let currentPrayerTimes = null;

// --- Storage helpers (chrome.storage with localStorage fallback) ---
const isChromeStorage = typeof chrome !== "undefined" && chrome.storage?.local;
const store = {
    get: async (key, fallback = null) => {
        if (isChromeStorage) {
            return new Promise((resolve) => {
                chrome.storage.local.get(["til_board_" + key], (res) => {
                    const v = res["til_board_" + key];
                    resolve(v !== undefined ? v : fallback);
                });
            });
        }
        try {
            const v = localStorage.getItem("til_board_" + key);
            return v ? JSON.parse(v) : fallback;
        } catch {
            return fallback;
        }
    },
    set: (key, value) => {
        if (isChromeStorage) {
            chrome.storage.local.set({ ["til_board_" + key]: value });
            return;
        }
        try {
            localStorage.setItem("til_board_" + key, JSON.stringify(value));
        } catch (e) {
            console.error("Storage failed", e);
        }
    },
    remove: (key) => {
        if (isChromeStorage) {
            chrome.storage.local.remove(["til_board_" + key]);
            return;
        }
        try {
            localStorage.removeItem("til_board_" + key);
        } catch {}
    },
};

// --- Background Rotation ---
function setupBackground() {
    const hour = new Date().getHours();
    const idx = hour % BG_IMAGES.length;
    const bgUrl = BG_IMAGES[idx];
    const el = document.getElementById("bg-cover");
    if (el) {
        el.style.backgroundImage = `url("${bgUrl}")`;
    }
}
setupBackground();

// --- Clock & Countdown ---
function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    document.getElementById("clock").textContent = `${hh}:${mm}:${ss}`;

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    document.getElementById("gregorian-date").textContent =
        now.toLocaleDateString("id-ID", options);

    updateCountdown(now);
}
setInterval(tickClock, 1000);
tickClock();

function updateCountdown(now) {
    if (!currentPrayerTimes) return;
    const el = document.getElementById("prayer-countdown");
    const todayStr = now.toDateString();

    // Bersihkan highlight lama
    document
        .querySelectorAll(".prayer-item")
        .forEach((node) => node.classList.remove("active-next"));

    let nextPrayer = null;
    let minDiff = Infinity;

    for (const [key, timeStr] of Object.entries(currentPrayerTimes)) {
        const [h, m] = timeStr.split(":").map(Number);
        const pDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            h,
            m,
            0,
        );
        const diff = pDate - now;
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = { key, date: pDate, label: PRAYER_NAMES[key] || key };
        }
    }

    // Jika semua waktu sholat hari ini lewat, target Subuh besok
    if (!nextPrayer && currentPrayerTimes.fajr) {
        const [h, m] = currentPrayerTimes.fajr.split(":").map(Number);
        const tomorrowFajr = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            h,
            m,
            0,
        );
        minDiff = tomorrowFajr - now;
        nextPrayer = {
            key: "fajr",
            date: tomorrowFajr,
            label: "Subuh (Besok)",
        };
    }

    if (nextPrayer) {
        const targetItem = document.querySelector(
            `.prayer-item[data-prayer="${nextPrayer.key}"]`,
        );
        if (targetItem) targetItem.classList.add("active-next");

        const totalSecs = Math.floor(minDiff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        el.textContent = `Menuju ${nextPrayer.label}: -${hours}j ${mins}m ${secs}d`;
    }
}

// --- Hijri date via Aladhan ---
async function loadHijri() {
    const cache = await store.get("hijri");
    if (cache && Date.now() - cache.ts < 1000 * 60 * 60 * 12) {
        renderHijri(cache.data);
        return;
    }
    try {
        const res = await fetch(
            `${ALADHAN_BASE}/gToH?date=${new Date().toLocaleDateString("en-GB")}`,
        );
        const json = await res.json();
        const h = json.data?.hijri;
        if (h) {
            const data = {
                day: h.day,
                month: h.month?.id || h.month?.en,
                year: h.year,
            };
            store.set("hijri", { ts: Date.now(), data });
            renderHijri(data);
        }
    } catch (e) {
        document.getElementById("hijri-date").textContent =
            "Gagal memuat tanggal Hijriah";
    }
}

function renderHijri(h) {
    document.getElementById("hijri-date").textContent =
        `${h.day} ${h.month} ${h.year} H`;
}
loadHijri();

// --- Prayer times ---
async function loadPrayerTimes(lat, lng) {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const url = `${ALADHAN_BASE}/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=11`;

    try {
        const res = await fetch(url);
        const json = await res.json();
        const t = json.data?.timings;
        if (!t) throw new Error("no timings");

        currentPrayerTimes = {
            fajr: (t.Fajr || "").split(" ")[0],
            dhuhr: (t.Dhuhr || "").split(" ")[0],
            asr: (t.Asr || "").split(" ")[0],
            maghrib: (t.Maghrib || "").split(" ")[0],
            isha: (t.Isha || "").split(" ")[0],
        };

        for (const [k, v] of Object.entries(currentPrayerTimes)) {
            document.getElementById("time-" + k).textContent = v || "--:--";
        }
        updateCountdown(new Date());
    } catch (e) {
        console.error("Prayer times failed", e);
        ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((k) => {
            document.getElementById("time-" + k).textContent = "ERR";
        });
    }
}

async function loadLocation() {
    const saved = (await store.get("location", DEFAULT_LOC)) || DEFAULT_LOC;
    document.getElementById("location-name").textContent =
        "📍 " + (saved.name || `${saved.lat}, ${saved.lng}`);
    loadPrayerTimes(saved.lat, saved.lng);
}

document.getElementById("btn-detect-loc").addEventListener("click", () => {
    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung browser.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const loc = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                name: "Lokasi Saat Ini",
            };
            await store.set("location", loc);
            loadLocation();
        },
        (err) => alert("Gagal deteksi lokasi: " + err.message),
    );
});

loadLocation();

// --- Daily Quote ---
function loadQuote() {
    const today = new Date().toDateString();
    const seed = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const idx = seed % QUOTES.length;
    const q = QUOTES[idx];
    document.getElementById("quote-text").textContent = `"${q.text}"`;
    document.getElementById("quote-source").textContent = q.source;
    currentQuote = q;
    return q;
}
let currentQuote = null;
loadQuote();

// ================== SHOLAT TRACKER ==================

const TRACKER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

async function loadTracker() {
    const dateKey = getTodayKey();
    const session = await store.get("session");
    let trackerData = (await store.get("tracker_" + dateKey)) || {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
    };

    // Jika ada sesi login, sync ke server /api/v1/sholat/today
    if (session?.token) {
        try {
            const res = await fetch(`${WEB_API_BASE}/api/v1/sholat/today`, {
                headers: { Authorization: `Bearer ${session.token}` },
            });
            if (res.ok) {
                const json = await res.json();
                const serverData = json.data || json;
                if (serverData && typeof serverData === "object") {
                    TRACKER_KEYS.forEach((k) => {
                        if (serverData[k] !== undefined)
                            trackerData[k] = Boolean(serverData[k]);
                    });
                    await store.set("tracker_" + dateKey, trackerData);
                }
            }
        } catch {}
    }

    renderTracker(trackerData);
}

function renderTracker(data) {
    let doneCount = 0;
    TRACKER_KEYS.forEach((k) => {
        const chk = document.getElementById("chk-" + k);
        if (chk) {
            chk.checked = Boolean(data[k]);
            if (chk.checked) doneCount++;
        }
    });
    document.getElementById("tracker-counter").textContent =
        `${doneCount} / 5 Selesai`;
}

// Handler check event
TRACKER_KEYS.forEach((k) => {
    const chk = document.getElementById("chk-" + k);
    if (!chk) return;
    chk.addEventListener("change", async () => {
        const dateKey = getTodayKey();
        const trackerData = (await store.get("tracker_" + dateKey)) || {};
        trackerData[k] = chk.checked;
        await store.set("tracker_" + dateKey, trackerData);
        renderTracker(trackerData);

        // Sync ke server jika login
        const session = await store.get("session");
        if (session?.token) {
            try {
                await fetch(`${WEB_API_BASE}/api/v1/sholat/today`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.token}`,
                    },
                    body: JSON.stringify({ prayer: k, status: chk.checked }),
                });
            } catch {}
        }
    });
});

loadTracker();

// ================== AUTH ==================

function showLoggedIn(user) {
    document.getElementById("btn-login-modal").classList.add("hidden");
    document.getElementById("user-profile").classList.remove("hidden");
    const name = user?.name || user?.email || user?.username || "Pengguna";
    document.getElementById("user-greeting").textContent = `Halo, ${name}`;
}

function showLoggedOut() {
    document.getElementById("btn-login-modal").classList.remove("hidden");
    document.getElementById("user-profile").classList.add("hidden");
}

async function fetchMe(token) {
    try {
        const res = await fetch(`${WEB_API_BASE}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function refreshAuthUI() {
    const session = await store.get("session");
    if (session?.token) {
        const me = await fetchMe(session.token);
        if (me) {
            await store.set("user", me);
            showLoggedIn(me);
            loadTracker(); // Sync tracker with authenticated server state
            return;
        }
        const refreshed = await tryRefreshToken(session);
        if (refreshed) {
            const newSession = await store.get("session");
            const me2 = await fetchMe(newSession.token);
            if (me2) {
                showLoggedIn(me2);
                loadTracker();
                return;
            }
        }
        await store.remove("session");
        await store.remove("user");
        showLoggedOut();
    } else {
        showLoggedOut();
    }
}

async function tryRefreshToken() {
    try {
        const res = await fetch(`${WEB_API_BASE}/api/v1/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return false;
        const data = await res.json();
        const newToken = data.token ?? data.access_token;
        if (newToken) {
            await store.set("session", { token: newToken, ts: Date.now() });
            return true;
        }
    } catch {}
    return false;
}

// Manual login
document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errEl = document.getElementById("login-error");
    const btn = document.getElementById("btn-submit-login");

    errEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Memproses...";

    try {
        const res = await fetch(`${WEB_API_BASE}/api/v1/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login gagal");

        const token = data.token ?? data.access_token;
        if (!token) throw new Error("Token tidak diterima dari server.");

        await store.set("session", { token, ts: Date.now() });
        if (data.user) await store.set("user", data.user);

        showLoggedIn(data.user);
        loadTracker();
        closeModal();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
    } finally {
        btn.disabled = false;
        btn.textContent = "Masuk";
    }
});

// Logout
document.getElementById("btn-logout").addEventListener("click", async () => {
    const session = await store.get("session");
    if (session?.token) {
        try {
            await fetch(`${WEB_API_BASE}/api/v1/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: { Authorization: `Bearer ${session.token}` },
            });
        } catch {}
    }
    await store.remove("session");
    await store.remove("user");
    showLoggedOut();
});

// Modal control
const modal = document.getElementById("login-modal");
document
    .getElementById("btn-login-modal")
    .addEventListener("click", () => modal.classList.remove("hidden"));
document
    .getElementById("btn-close-modal")
    .addEventListener("click", closeModal);
function closeModal() {
    modal.classList.add("hidden");
    document.getElementById("password").value = "";
    document.getElementById("login-error").classList.add("hidden");
}

// Cookie auto-sync
document
    .getElementById("btn-sync-cookie")
    .addEventListener("click", async () => {
        const btn = document.getElementById("btn-sync-cookie");
        const errEl = document.getElementById("login-error");
        errEl.classList.add("hidden");
        btn.disabled = true;
        btn.textContent = "Mengecek sesi di web...";

        try {
            const res = await fetch(`${WEB_API_BASE}/api/v1/auth/refresh`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                throw new Error(
                    "Tidak ada sesi aktif di web. Silakan login di web dulu, lalu coba lagi.",
                );
            }
            const data = await res.json();
            const token = data.token ?? data.access_token;
            if (!token) throw new Error("Server tidak mengembalikan token.");

            await store.set("session", { token, ts: Date.now() });
            const me = await fetchMe(token);
            if (me) await store.set("user", me);
            showLoggedIn(me);
            loadTracker();
            closeModal();
        } catch (err) {
            errEl.textContent = err.message;
            errEl.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = "🔄 Sinkron Otomatis dari Web";
        }
    });

// Bootstrap
refreshAuthUI();

// ================== SHARE QUOTE AS IMAGE ==================

async function renderQuoteToBlob() {
    const W = 1080;
    const H = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Pick random background image (sesuai background halaman)
    const hour = new Date().getHours();
    const allBgs = BG_IMAGES;
    const bgPath = allBgs[hour % allBgs.length];
    const bgImg = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = bgPath;
    });

    // Draw background image (cover)
    const bgRatio = bgImg.width / bgImg.height;
    const canvasRatio = W / H;
    let bgW = W;
    let bgH = H;
    let bgX = 0;
    let bgY = 0;
    if (bgRatio > canvasRatio) {
        bgH = H;
        bgW = H * bgRatio;
        bgX = (W - bgW) / 2;
    } else {
        bgW = W;
        bgH = W / bgRatio;
        bgY = (H - bgH) / 2;
    }
    ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);

    // Dark overlay untuk readability
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(2, 44, 34, 0.65)");
    grad.addColorStop(1, "rgba(2, 44, 34, 0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Frame border
    ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Header: Bismillah
    ctx.fillStyle = "#FBBF24";
    ctx.font = "italic 36px serif";
    ctx.textAlign = "center";
    ctx.fillText("Thullaabul 'Ilmi", W / 2, 130);

    // Quote text
    ctx.fillStyle = "#FFFFFF";
    const quote = currentQuote?.text || "";
    ctx.font = "italic 600px serif".replace("600", "44");
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const maxLineWidth = W - 200;
    const words = quote.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
        const candidate = line ? line + " " + word : word;
        if (ctx.measureText(candidate).width > maxLineWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);

    const lineHeight = 60;
    const startY = H / 2 - (lines.length * lineHeight) / 2;
    lines.forEach((l, i) => {
        ctx.fillText('"' + l + '"', W / 2, startY + i * lineHeight);
    });

    // Quote source
    ctx.font = "italic 28px serif";
    ctx.fillStyle = "#6EE7B7";
    ctx.fillText(
        `— ${currentQuote?.source || ""}`,
        W / 2,
        startY + lines.length * lineHeight + 30,
    );

    // Footer: URL
    ctx.font = "500 22px sans-serif".replace("500", "");
    ctx.fillStyle = "rgba(167, 243, 208, 0.85)";
    ctx.fillText("thollabul.jangkauin.site", W / 2, H - 80);

    return new Promise((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/png"),
    );
}

async function copyQuoteImageToClipboard() {
    const btn = document.getElementById("btn-copy-quote-img");
    const status = document.getElementById("quote-copied-status");
    if (!btn) return;

    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = "⏳ Merender...";
    status.classList.add("hidden");

    try {
        const blob = await renderQuoteToBlob();
        if (!blob) throw new Error("Gagal render gambar.");

        if (
            navigator.clipboard &&
            navigator.clipboard.write &&
            typeof ClipboardItem !== "undefined"
        ) {
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            status.textContent = "✅ Tersalin ke clipboard!";
        } else {
            // Fallback: download file
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "quote-thullaabul-ilmi.png";
            a.click();
            URL.revokeObjectURL(url);
            status.textContent = "📁 Clipboard tidak didukung, file diunduh.";
        }
        status.classList.remove("hidden");
        setTimeout(() => status.classList.add("hidden"), 3000);
    } catch (err) {
        status.textContent = "❌ " + err.message;
        status.classList.remove("hidden");
        setTimeout(() => status.classList.add("hidden"), 4000);
    } finally {
        btn.disabled = false;
        btn.textContent = orig;
    }
}

document
    .getElementById("btn-copy-quote-img")
    ?.addEventListener("click", copyQuoteImageToClipboard);
