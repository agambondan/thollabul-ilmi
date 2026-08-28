# Web App Task: Tampilkan Derajat Hadits, Sanad & Autentikasi

## Context

API Service sudah menambahkan field-field autentikasi hadits ke model `Hadith`:

| Field         | Type             | Keterangan                                           |
| ------------- | ---------------- | ---------------------------------------------------- |
| `grade`       | `string \| null` | Derajat keshahihan: `shahih`, `hasan`, `dhaif`, dll. |
| `shahih_by`   | `string \| null` | Nama ulama yang menshahihkan                         |
| `dhaif_by`    | `string \| null` | Nama ulama yang mendhaifkan                          |
| `grade_notes` | `string \| null` | Catatan detail / penjelasan derajat                  |
| `sanad`       | `string \| null` | Rangkaian perawi (chain of narrators)                |

**Status data saat ini:**

- Bukhari (7.589 hadits) → `grade: "shahih"`, `shahih_by: "Al-Bukhari, Ulama Ahlul Hadits"`
- Muslim (7.563 hadits) → `grade: "shahih"`, `shahih_by: "Muslim bin Al-Hajjaj, Ulama Ahlul Hadits"`
- Muwatha' Malik (1.859 hadits) → `grade: "shahih"`, `shahih_by: "Imam Malik, Asy-Syafi'i, Ibn Abd Al-Barr"`
- Sunan lainnya → `grade: null`, `grade_notes` berisi penjelasan bahwa grading bervariasi per-hadits

**Catatan rebuild:** API Service Docker image perlu di-rebuild agar field baru muncul di response API.

---

## API Endpoints

```
GET /api/v1/hadiths/:id
GET /api/v1/hadiths/book/:slug?page=1&limit=20
GET /api/v1/hadiths/book/:slug/theme/:themeId
GET /api/v1/hadiths/book/:slug/theme/:themeId/chapter/:chapterId
```

**Contoh response hadith dengan grading:**

```json
{
    "id": 1,
    "number": 6312,
    "book": { "slug": "bukhari", "translation": { "idn": "Shahih Bukhari" } },
    "theme": { "translation": { "en": "Invocations" } },
    "chapter": { "translation": { "en": "Supplications at Morning" } },
    "translation": {
        "idn": "Telah menceritakan kepada kami...",
        "en": "Narrated...",
        "ar": "حَدَّثَنَا..."
    },
    "grade": "shahih",
    "shahih_by": "Al-Bukhari, Ulama Ahlul Hadits",
    "dhaif_by": null,
    "grade_notes": "Seluruh hadits dalam Shahih Al-Bukhari telah disepakati keshahihannya...",
    "sanad": null
}
```

---

## Nilai `grade` yang Mungkin

```ts
type HadithGrade =
    | "shahih"
    | "shahih_lighairihi"
    | "hasan"
    | "hasan_lighairihi"
    | "hasan_shahih"
    | "dhaif"
    | "dhaif_jiddan"
    | "munkar"
    | "maudhu"
    | "matruk"
    | "majhul"
    | null; // belum diverifikasi
```

---

## Komponen: GradeBadge

Tampilkan derajat sebagai badge berwarna di halaman list maupun detail hadith.

```tsx
const GRADE_CONFIG: Record<string, { label: string; color: string }> = {
    shahih: {
        label: "Shahih",
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    shahih_lighairihi: {
        label: "Shahih Lighairihi",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    hasan: {
        label: "Hasan",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    hasan_lighairihi: {
        label: "Hasan Lighairihi",
        color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    },
    hasan_shahih: {
        label: "Hasan Shahih",
        color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    dhaif: {
        label: "Dha'if",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    dhaif_jiddan: {
        label: "Dha'if Jiddan",
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    },
    munkar: {
        label: "Munkar",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    maudhu: {
        label: "Maudhu'",
        color: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300",
    },
    matruk: {
        label: "Matruk",
        color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    },
    majhul: {
        label: "Majhul",
        color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    },
};

function GradeBadge({ grade }: { grade: string | null }) {
    if (!grade) return null;
    const cfg = GRADE_CONFIG[grade];
    if (!cfg) return null;
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}
        >
            {cfg.label}
        </span>
    );
}
```

---

## Komponen: HadithAuthenticity (detail page)

Tampilkan seluruh info autentikasi dalam satu section di halaman detail hadith.

```tsx
function HadithAuthenticity({ hadith }: { hadith: Hadith }) {
    const hasAny =
        hadith.grade ||
        hadith.shahih_by ||
        hadith.dhaif_by ||
        hadith.grade_notes ||
        hadith.sanad;
    if (!hasAny) return null;

    return (
        <div className='mt-4 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden'>
            <div className='px-4 py-3 bg-neutral-50 dark:bg-neutral-800 flex items-center gap-2'>
                <span className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
                    Autentikasi Hadits
                </span>
                <GradeBadge grade={hadith.grade} />
            </div>

            <div className='px-4 py-3 space-y-3 text-sm'>
                {hadith.shahih_by && (
                    <div>
                        <span className='font-medium text-green-700 dark:text-green-400'>
                            Dishahihkan oleh:{" "}
                        </span>
                        <span className='text-neutral-700 dark:text-neutral-300'>
                            {hadith.shahih_by}
                        </span>
                    </div>
                )}
                {hadith.dhaif_by && (
                    <div>
                        <span className='font-medium text-red-700 dark:text-red-400'>
                            Didhaifkan oleh:{" "}
                        </span>
                        <span className='text-neutral-700 dark:text-neutral-300'>
                            {hadith.dhaif_by}
                        </span>
                    </div>
                )}
                {hadith.grade_notes && (
                    <div>
                        <span className='font-medium text-neutral-600 dark:text-neutral-400'>
                            Catatan:{" "}
                        </span>
                        <span className='text-neutral-600 dark:text-neutral-400'>
                            {hadith.grade_notes}
                        </span>
                    </div>
                )}
                {hadith.sanad && (
                    <details className='mt-2'>
                        <summary className='cursor-pointer font-medium text-neutral-600 dark:text-neutral-400 select-none'>
                            Sanad (Rangkaian Perawi)
                        </summary>
                        <p className='mt-2 text-neutral-600 dark:text-neutral-400 leading-relaxed'>
                            {hadith.sanad}
                        </p>
                    </details>
                )}
            </div>
        </div>
    );
}
```

---

## Halaman yang Perlu Diupdate

### 1. Halaman List Hadith — `/hadith/[book]`

Tambahkan `<GradeBadge grade={hadith.grade} />` di sebelah nomor hadits pada setiap card.

```tsx
// Sebelum (contoh):
<span className="text-xs text-neutral-500">No. {hadith.number}</span>

// Sesudah:
<div className="flex items-center gap-2">
  <span className="text-xs text-neutral-500">No. {hadith.number}</span>
  <GradeBadge grade={hadith.grade} />
</div>
```

### 2. Halaman Detail Hadith — `/hadith/[book]/[number]`

Tambahkan komponen `<HadithAuthenticity hadith={hadith} />` di bawah teks terjemahan.

### 3. Halaman Search Results — jika menampilkan hadith

Tambahkan `<GradeBadge>` di setiap item hasil pencarian hadith.

---

## Filter by Grade (Opsional — Phase 2)

Jika ada filter panel di halaman list, tambahkan filter derajat:

```tsx
const gradeOptions = [
    { value: "", label: "Semua Derajat" },
    { value: "shahih", label: "Shahih" },
    { value: "hasan", label: "Hasan" },
    { value: "hasan_shahih", label: "Hasan Shahih" },
    { value: "dhaif", label: "Dha'if" },
];
// Append ?grade=shahih ke query params API
```

API Service sudah support query param `grade` untuk filtering (perlu konfirmasi dengan API service team).

---

## TypeScript Type

```ts
type HadithGrade =
    | "shahih"
    | "shahih_lighairihi"
    | "hasan"
    | "hasan_lighairihi"
    | "hasan_shahih"
    | "dhaif"
    | "dhaif_jiddan"
    | "munkar"
    | "maudhu"
    | "matruk"
    | "majhul";

interface Hadith {
    id: number;
    number: number;
    book_id: number;
    theme_id: number;
    chapter_id: number;
    translation_id: number;
    book?: {
        id: number;
        slug: string;
        translation?: { idn?: string; en?: string };
    };
    theme?: { translation?: { idn?: string; en?: string } };
    chapter?: { translation?: { idn?: string; en?: string } };
    translation?: {
        idn?: string;
        en?: string;
        ar?: string;
    };
    // Grading fields (null = belum diverifikasi)
    grade?: HadithGrade | null;
    shahih_by?: string | null;
    dhaif_by?: string | null;
    grade_notes?: string | null;
    sanad?: string | null;
}
```

---

## Catatan Implementasi

- Field `grade` bisa `null` untuk kitab Sunan — handle gracefully, jangan tampilkan section kosong
- `grade_notes` untuk Sunan berisi penjelasan umum kitab (bukan per-hadits) — tampilkan sebagai info/disclaimer
- `sanad` saat ini masih `null` untuk semua hadits (akan diisi bertahap) — gunakan `<details>` agar tidak memakan space
- Link ke sunnah.com: gunakan slug kitab dari `book.slug` + nomor → `https://sunnah.com/{slug}:{number}` (lihat task [web app-task-hadith-source-links.md](./web app-task-hadith-source-links.md))

## Implementation Update

Status: `DONE`

- `apps/web/src/components/GradeBadge.js` menyediakan badge derajat hadis dan
  panel `HadithAuthenticity`.
- `/hadith/[slug]` menampilkan badge pada list dan panel autentikasi pada
  detail/card hadis.
- `/dashboard/hadith/[slug]` menampilkan badge dan panel autentikasi pada card
  dashboard.
- `/search` menampilkan badge derajat untuk hasil pencarian hadis.
- Field kosong seperti `grade`, `grade_notes`, dan `sanad` ditangani tanpa
  menampilkan section kosong.

Evidence:

```bash
npm --prefix apps/web run lint -- --file src/components/GradeBadge.js --file 'src/app/hadith/[slug]/HadithPage.js' --file src/app/search/SearchClient.js --file 'src/app/dashboard/hadith/[slug]/page.js'
```

Result: `PASS`
