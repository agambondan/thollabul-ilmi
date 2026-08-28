# Quran Audio Murotal

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Audio murotal per ayat dari multiple qori', streaming via API.

## Scope

- API: /audio
- Web: bagian dari /quran, termasuk range player setara mobile
- Mobile: audioPlayer utilitas dan kontrol reader Quran

## Evidence

- API controller: services/api/app/controllers/audio_controller.go
- Web page: apps/web/src/app/quran/page.js
- Web player: apps/web/src/components/SurahAudioPlayer.js
- Mobile utility: apps/mobile/src/utils/audioPlayer.js
- Mobile screen: apps/mobile/src/screens/QuranScreen.js

## Source of Truth

- Model: services/api/app/model/audio.go
- Controller: services/api/app/controllers/audio_controller.go
- Service: services/api/app/service/audio_service.go

## Details

### API Response Shape

**`GET /audio?bySurah=1&qari=misyari`**

```json
{
    "surah_audio": {
        "id": 1,
        "surah_id": 1,
        "qari_name": "Misyari Rasyid",
        "qari_slug": "misyari",
        "audio_url": "https://.../001.mp3",
        "surah": { "id": 1, "number": 1 }
    }
}
```

**`GET /audio?byAyah=1&qari=misyari`**

```json
{
    "ayah_audio": {
        "id": 1,
        "ayah_id": 1,
        "qari_name": "Misyari Rasyid",
        "qari_slug": "misyari",
        "audio_url": "https://.../001001.mp3",
        "ayah": { "id": 1, "number": 1 }
    }
}
```

### Database Model

**`SurahAudio`** (`model/audio.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `surah_id` | \*int | FK to Surah; unique with qari_slug |
| `qari_name` | string | Qari display name |
| `qari_slug` | string | URL-safe qari identifier |
| `audio_url` | string | Full surah audio URL |

**`AyahAudio`** (`model/audio.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `ayah_id` | \*int | FK to Ayah; unique with qari_slug |
| `qari_name` | string | Qari display name |
| `qari_slug` | string | URL-safe qari identifier |
| `audio_url` | string | Per-ayah audio URL |

### Key Frontend Components

- **Web** (bagian dari `/quran`): qari picker, range playlist dari surat ke surat dengan batas ayat akhir, repeat toggle, dan playback speed 0.75x-2x.
- **Mobile** (`QuranScreen` + `audioPlayer` utility): qari picker, per-ayat play, range playlist dari surat ke surat dengan batas ayat akhir, repeat toggle, dan playback speed 0.75x-2x.
