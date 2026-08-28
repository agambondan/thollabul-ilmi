# Tasbih Digital

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Counter digital untuk tasbih dengan haptic feedback.

## Scope

- API: —
- Web: `/tasbih`
- Mobile: `IbadahScreen`

## Evidence

- Web page: `apps/web/src/app/tasbih/page.js`
- Mobile screen: `apps/mobile/src/screens/IbadahScreen.js`

## Source of Truth

- `apps/web/src/app/tasbih/`

## Details

### Features (No API — Purely Frontend)

| Feature               | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| **Counter**           | Tap-to-increment with visual count display                             |
| **Decrement**         | Undo accidental increment                                              |
| **Reset**             | One-tap reset to zero                                                  |
| **Target per dzikir** | Preset targets: 33 (tasbih), 33 (tahmid), 33 (takbir), 100 (istighfar) |
| **Auto-complete**     | Visual feedback when target reached (vibration/color flash)            |
| **Haptic feedback**   | Device vibration on each tap (navigator.vibrate)                       |
| **Session history**   | LocalStorage-based daily log of completed dzikir counts                |
| **Dark mode**         | Follows system theme                                                   |

### State Shape (Client-side)

```ts
interface TasbihSession {
    dzikir:
        | "subhanallah"
        | "alhamdulillah"
        | "allahuakbar"
        | "istighfar"
        | "custom";
    label: string;
    count: number;
    target: number;
}

interface TasbihDailyLog {
    date: string; // YYYY-MM-DD
    entries: { dzikir: string; total: number }[];
}
```

### Key Frontend Components

- **Web** (`/tasbih`): Large tap-able area with animated counter ring; dzikir selector chips; session summary card
- **Mobile** (`IbadahScreen`): Full-screen counter with haptic; swipe to switch dzikir; bottom sheet for history
