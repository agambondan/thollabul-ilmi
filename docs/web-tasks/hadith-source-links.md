# Web App Task: Tambah Link Referensi ke Nomor Hadits

## Context

Field `source` pada data doa, dzikir, dan panduan sholat kini sudah mengandung nomor hadits dan derajat keshahihan secara lengkap. Contoh format baru:

```
HR. Bukhari No. 6312; Shahih
HR. Muslim No. 713; HR. Ibnu Majah No. 772; Shahih
HR. Abu Dawud No. 3767; Hasan Shahih (Al-Albani)
QS. Thaha: 114
```

## Task

Parse field `source` dan render setiap referensi sebagai **clickable link** yang mengarah ke sumber hadits online.

## URL Mapping per Kitab

| Kitab                    | URL Template                                   |
| ------------------------ | ---------------------------------------------- |
| HR. Bukhari No. `{N}`    | `https://sunnah.com/bukhari:{N}`               |
| HR. Muslim No. `{N}`     | `https://sunnah.com/muslim:{N}`                |
| HR. Abu Dawud No. `{N}`  | `https://sunnah.com/abudawud:{N}`              |
| HR. Tirmidzi No. `{N}`   | `https://sunnah.com/tirmidzi:{N}`              |
| HR. Ibnu Majah No. `{N}` | `https://sunnah.com/ibnmajah:{N}`              |
| HR. Nasai No. `{N}`      | `https://sunnah.com/nasai:{N}`                 |
| HR. Ahmad No. `{N}`      | `https://sunnah.com/ahmad:{N}`                 |
| QS. `{Surah}: {Ayat}`    | `/quran/surah/{Surah}#{Ayat}` (internal route) |

Referensi lain (Al-Baihaqi, Al-Hakim, Al-Albani, dll.) tidak punya URL online yang konsisten — cukup render sebagai plain text.

## Logic

```js
// Contoh parser sederhana
function parseSource(source) {
    // Split by ";" untuk dapat tiap bagian
    const parts = source.split(";").map((s) => s.trim());
    return parts.map((part) => {
        const hrMatch = part.match(
            /HR\.\s*(Bukhari|Muslim|Abu Dawud|Tirmidzi|Ibnu Majah|Nasai|Ahmad)\s+No\.\s*(\d+)/i,
        );
        if (hrMatch) {
            const kitab = hrMatch[1].toLowerCase().replace(" ", "");
            const no = hrMatch[2];
            const slugMap = {
                bukhari: "bukhari",
                muslim: "muslim",
                abudawud: "abudawud",
                tirmidzi: "tirmidzi",
                ibnumajah: "ibnmajah",
                nasai: "nasai",
                ahmad: "ahmad",
            };
            const slug = slugMap[kitab] || kitab;
            return { text: part, url: `https://sunnah.com/${slug}:${no}` };
        }
        const qsMatch = part.match(/QS\.\s*([^:]+):\s*(\d+)/i);
        if (qsMatch) {
            const surah = qsMatch[1].trim();
            const ayat = qsMatch[2];
            return { text: part, url: `/quran/surah/${surah}#${ayat}` };
        }
        return { text: part, url: null };
    });
}
```

## Komponen Render

```jsx
function SourceBadges({ source }) {
    if (!source) return null;
    const refs = parseSource(source);
    return (
        <div className='flex flex-wrap gap-1 mt-1'>
            {refs.map((ref, i) =>
                ref.url ? (
                    <a
                        key={i}
                        href={ref.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800'
                    >
                        {ref.text}
                    </a>
                ) : (
                    <span
                        key={i}
                        className='text-xs text-neutral-500 dark:text-neutral-400'
                    >
                        {ref.text}
                    </span>
                ),
            )}
        </div>
    );
}
```

## Halaman yang Perlu Diupdate

- `/doa` — card/detail tiap doa, field `source`
- `/dzikir` — card/detail tiap dzikir, field `source`
- `/sholat/guide` — setiap langkah sholat, field `source`
- (Opsional) Hadith detail page — sudah ada `book` + `number`, langsung bisa link ke `sunnah.com/{book.slug}:{hadith.number}`

## API Response

Field `source` sudah ada di response API API service. Tidak ada perubahan API yang diperlukan.

## Implementation Update

Status: `DONE`

- `apps/web/src/components/SourceBadges.js` sekarang parse `source` menjadi
  link eksternal `sunnah.com` untuk Bukhari, Muslim, Abu Dawud, Tirmidzi,
  Ibnu Majah, Nasai, dan Ahmad.
- Referensi Quran `QS. {Surah}: {Ayat}` diarahkan ke route internal
  `/quran/surah/{Surah}#{Ayat}`.
- Referensi yang tidak punya mapping stabil tetap dirender sebagai teks biasa.
- Halaman `/doa`, `/dzikir`, dan `/panduan-sholat` sudah memakai
  `SourceBadges`, jadi tidak butuh perubahan per-page lagi.

Evidence:

```bash
npm --prefix apps/web run lint -- --file src/components/SourceBadges.js
```

Result: `PASS`
