# Notifications

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Notifikasi inbox, push token, reminder email, preferensi notifikasi. Mengirim pengingat sholat, jadwal mengaji, aktivitas teman, dan pencapaian pribadi secara real-time.

## Scope

- API: /notifications
- Web: /notifications, /dashboard/notifications
- Mobile: NotificationCenter komponen

## Evidence

- API: services/api/app/controllers/notification_controller.go
- Web: apps/web/src/app/notifications/page.js, apps/web/src/app/dashboard/notifications/page.js
- Mobile: apps/mobile/src/components/NotificationCenter.js

## Source of Truth

- services/api/app/controllers/notification_controller.go
- apps/web/src/app/notifications/page.js

## Details

### API Response Shape

**`GET /notifications`**

```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "title": "Waktunya Sholat",
        "body": "Sholat Dzuhur akan masuk dalam 10 menit",
        "type": "daily_quran",
        "ref_id": null,
        "is_read": false
    }
]
```

**`GET /notifications/settings`**

```json
[
    {
        "id": 1,
        "user_id": "uuid",
        "type": "daily_quran",
        "time": "05:00",
        "is_active": true,
        "last_sent_at": "2026-05-13T05:00:00Z"
    }
]
```

**`POST /notifications/push-token`**

```json
{
    "token": "ExponentPushToken[...]",
    "platform": "android",
    "provider": "expo",
    "device_id": "device-uuid"
}
```

### Database Model

**`NotificationSetting`** (`model/notification.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user; unique per type |
| `type` | NotificationType | daily_quran, daily_hadith, doa |
| `time` | string | HH:mm format |
| `is_active` | bool | Toggle on/off |
| `last_sent_at` | \*time.Time | Last delivery timestamp |

**`PushToken`** (`model/notification.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `token` | string | Push notification token |
| `platform` | string | android, ios, web |
| `provider` | string | expo, fcm, apns |
| `device_id` | string | Device identifier |
| `is_active` | bool | Token is valid |
| `last_seen_at` | time.Time | Last used timestamp |

**`UserNotification`** (`model/notification.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (BaseUUID) | Primary key |
| `user_id` | uuid | FK to user |
| `title` | string | Notification title |
| `body` | string | Notification body text |
| `type` | NotificationType | Category |
| `ref_id` | string | Optional reference |
| `is_read` | bool | Read status |

### Key Frontend Components

- **Web** (`/notifications`, `/dashboard/notifications`): Notification list with read/unread styling; setting toggles per type with time picker
- **Mobile** (`NotificationCenter`): Bell icon badge on header; notification list with swipe-to-dismiss; push permission prompt on first launch; settings panel
