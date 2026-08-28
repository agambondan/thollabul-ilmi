# Bookmark System

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-13`

## Objective

Bookmark multi-tipe (ayat, hadith, doa, artikel) dengan warna/label, sync lintas device. Memudahkan pengguna menandai dan mengorganisir konten favorit secara visual.

## Scope

- API: /bookmarks
- Web: /bookmarks, /dashboard/bookmarks
- Mobile: Semua screen + BookmarkButton komponen

## Evidence

- API: services/api/app/controllers/bookmark_controller.go
- Web: apps/web/src/app/bookmarks/page.js, apps/web/src/app/dashboard/bookmarks/page.js
- Mobile: components/BookmarkButton.js

## Source of Truth

- apps/web/src/lib/api/bookmarks.js
- services/api/app/controllers/bookmark_controller.go

## Details

### API Response Shape

**`GET /bookmarks`**

```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "ref_type": "ayah",
        "ref_id": 1,
        "ref_slug": "al-fatihah-1",
        "color": "#FFD700",
        "label": "Favorit",
        "ayah": { "id": 1, "number": 1, "surah_id": 1 },
        "hadith": null
    }
]
```

**`POST /bookmarks`**

```json
{
    "ref_type": "ayah",
    "ref_id": 1,
    "ref_slug": "al-fatihah-1"
}
```

### Database Model

**`Bookmark`** (`model/bookmark.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user; unique with ref_type + ref_id |
| `ref_type` | BookmarkType | ayah, hadith, or article |
| `ref_id` | int | ID of the referenced content |
| `ref_slug` | string | Slug for URL resolution |
| `color` | string | Hex color for visual organization |
| `label` | string | Custom label (e.g. "Favorit", "Hafalan") |
| `ayah` | *Ayah | Populated when ref_type=ayah |
| `hadith` | *Hadith | Populated when ref_type=hadith |

### Key Frontend Components

- **Web** (`/bookmarks`, `/dashboard/bookmarks`): Bookmark list grouped by type with color dots; filter by label; tap to navigate to source content
- **Mobile** (Semua screen + `BookmarkButton`): Floating bookmark icon on content pages (ayat/hadith/article); bookmarks tab in profile screen; color-coded label management
