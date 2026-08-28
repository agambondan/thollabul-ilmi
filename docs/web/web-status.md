# Web App Status

## Implemented

- Core app shell, navigation, auth, profile, and shared UI components are in place.
- `blog`, `search`, `hadith`, and `quran` pages now have usable browsing, filtering, and safer reader flows.
- `dev` includes API key management for listing, creating, and revoking keys.
- Content discovery pages are no longer bare shells:
    - `asbabun-nuzul`
    - `asmaul-husna`
    - `doa`
    - `dzikir`
    - `fiqh`
    - `goals`
    - `hijri`
    - `kajian`
    - `leaderboard`
    - `muhasabah`
    - `notifications`
    - `stats`
    - `tafsir`
- `notifications` now supports bulk enable/disable and bulk save actions.
- Reader pages handle empty states and partial API service data more gracefully instead of exposing placeholder copy.

## API Service-dependent

- Some pages still render empty states when their API service datasets are empty or incomplete.
- That is expected fallback behavior, not a missing web app route.
- Remaining feature completeness is mostly a API service data/content issue rather than a missing UI shell.
- The API service backlog that matches this web app contract is documented in `docs/api-gaps.md`.
