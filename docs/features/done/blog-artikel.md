# Blog & Artikel

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Blog dengan sistem posting, kategori, tags, dan related posts untuk menyediakan artikel-artikel keislaman yang terstruktur dan mudah ditemukan.

## Scope

- API: `/blog`
- Web: `/blog`, `/dashboard/blog`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/blog/page.js`, `apps/web/src/app/dashboard/blog/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/blog_controller.go

## Source of Truth

- services/api/app/controllers/blog_controller.go
- services/api/app/model/blog.go
- services/api/app/services/blog_service.go

## Details

### API Response Shape

**`GET /blog`**

```json
[
    {
        "id": "uuid",
        "author_id": "uuid",
        "category_id": 1,
        "slug": "keutamaan-sedekah",
        "cover_image": "https://...",
        "status": "published",
        "published_at": "2026-01-10T08:00:00Z",
        "view_count": 1200,
        "author": { "id": "uuid", "name": "Admin", "avatar": "..." },
        "category": {
            "id": 1,
            "slug": "amal",
            "translation": { "idn": "Amal" }
        },
        "tags": [
            { "id": 1, "slug": "sedekah", "translation": { "idn": "Sedekah" } }
        ],
        "translation": {
            "idn": "Keutamaan Sedekah",
            "en": "The Virtue of Charity",
            "title_idn": "Keutamaan Sedekah",
            "title_en": "The Virtue of Charity"
        }
    }
]
```

### Database Model

**`BlogPost`** (`model/blog.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `author_id` | uuid | FK to User |
| `category_id` | *int | FK to BlogCategory |
| `title` | string | Post title (stored in Translation) |
| `slug` | string | URL-safe; unique |
| `excerpt` | string | Summary (stored in Translation) |
| `content` | string | Full content (stored in Translation) |
| `cover_image` | *string | Featured image URL |
| `status` | BlogStatus | draft, published, archived |
| `published_at` | *time.Time | Publication timestamp |
| `view_count` | int | View counter |
| `author` | *User | Belongs-to User |
| `category` | *BlogCategory | Belongs-to category |
| `tags` | []BlogTag | Many-to-many tags |
| `translation_id` | *int | FK to Translation |

**`BlogCategory`** & **`BlogTag`** support categorization.

### Key Frontend Components

- **Web** (`/blog`, `/dashboard/blog`): Card grid with cover image, category badge, read time; detail page with rich content, related posts sidebar; admin editor with draft/publish workflow
- **Mobile** (`ExploreScreen`): Article card list → detail screen with rich text rendering; save/bookmark button; share functionality
