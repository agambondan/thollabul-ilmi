# Admin Modal Standardization Audit

**Date:** 2026-09-19  
**Scope:** All `apps/web/src/app/admin/**/page.js` with create/edit modals/forms  
**Standard Pattern:** `ModalShell` with `flex-col`/`max-h-[90vh]`/`overflow-y-auto flex-1` body, fixed footer (`shrink-0`), `useLayoutMode`/`isWide` modal sizing, `MarkdownEditor` for long rich-text fields

---

## Standardized Pattern (Reference Implementation)

**Files that fully match the standard:**
- `fiqh/page.js` (29a8dcf3)
- `manasik/page.js` (29a8dcf3)
- `panduan-sholat/page.js` (29a8dcf3)
- `tokoh-tarikh/page.js` (via GenericAdminCRUD)
- `blog/[id]/edit/page.js` & `blog/new/page.js` (page-based, not modal)
- `amalan/page.js` (f85528b1)
- `asmaul-husna/page.js` (f85528b1)
- `doa/page.js` (f85528b1)
- `dzikir/page.js` (f85528b1)
- `kamus/page.js` (f85528b1)
- `wirid/page.js` (f85528b1)
- `sejarah/page.js` (pre-standard, close but missing isWide)
- `asbabun-nuzul/page.js` (pre-standard, close but missing isWide)
- `GenericAdminCRUD.js` (component-level standard)

**Key Pattern Checklist:**
1. ✅ `import { useLayoutMode } from "@/lib/useLayoutMode"` + `const isWide = useLayoutMode()`
2. ✅ `<ModalShell>` with `panelClassName={`... flex flex-col max-h-[90vh] overflow-hidden ${isWide ? "max-w-4xl" : "max-w-2xl"}`}`
3. ✅ Header: `shrink-0` with border-b
4. ✅ Body: `p-6 space-y-6 overflow-y-auto flex-1` (scrollable, fills remaining space)
5. ✅ Footer: `flex gap-3 p-6 border-t border-gray-100 dark:border-slate-700 shrink-0` (fixed bottom)
6. ✅ `MarkdownEditor` for long rich-text fields (description, content, notes, etc.)
7. ✅ Delete confirmation modal: `panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6'`

---

## Audit Results

### ⚠️ PRIORITY 1 — Active WIP (Do NOT Edit)

| File | Status | Evidence | Notes |
|------|--------|----------|-------|
| `library/page.js` | **Active WIP** | `git status` shows modified; contains 3 modals (create/edit, extract, draft) with custom logic, file uploads, auto-save checkbox, multi-step extraction workflow | Complex multi-modal flow with file uploads, MinIO integration, PDF extraction. **Do not touch** — unrelated active work in progress. |

---

### ✅ PRIORITY 2 — Already Standardized (No Action)

| File | Modal Type | isWide | MarkdownEditor | Notes |
|------|------------|--------|----------------|-------|
| `fiqh/page.js` | Create/Edit + Delete | ✅ | ✅ (content) | Standard |
| `manasik/page.js` | Create/Edit + Delete | ✅ | ✅ (description, notes) | Standard |
| `panduan-sholat/page.js` | Create/Edit + Delete | ✅ | ✅ (description, notes) | Standard |
| `amalan/page.js` | Create/Edit + Delete | ✅ | ✅ (description) | f85528b1 |
| `asmaul-husna/page.js` | Create/Edit + Delete | ✅ | ✅ (description) | f85528b1 |
| `doa/page.js` | Create/Edit + Delete | ✅ | ✅ (translation) | f85528b1 |
| `dzikir/page.js` | Create/Edit + Delete | ✅ | ✅ (translation) | f85528b1 |
| `kamus/page.js` | Create/Edit + Delete | ✅ | ✅ (definition) | f85528b1 |
| `wirid/page.js` | Create/Edit + Delete | ✅ | ✅ (translation) | f85528b1 |
| `sejarah/page.js` | Create/Edit + Delete | ❌ | ✅ (description) | Missing `isWide` — uses fixed `max-w-2xl` |
| `asbabun-nuzul/page.js` | Create/Edit + Delete | ❌ | ✅ (content) | Missing `isWide` — uses fixed `max-w-2xl` |
| `tokoh-tarikh/page.js` | Via GenericAdminCRUD | ✅ | ✅ (biografi, kontribusi) | Uses GenericAdminCRUD |
| `blog/new/page.js` | Page (not modal) | ✅ | ✅ (content) | Page-based with split editor/preview |
| `blog/[id]/edit/page.js` | Page (not modal) | ✅ | ✅ (content) | Page-based with split editor/preview |
| `siroh/new/page.js` | Page (not modal) | ✅ | ✅ (content) | Page-based form via `_SirohForm.js` |
| `siroh/[id]/edit/page.js` | Page (not modal) | ✅ | ✅ (content) | Page-based form via `_SirohForm.js` |

---

### ❌ PRIORITY 3 — Non-Standard Modals (Need Migration)

| File | Issues | Evidence | Complexity | Ownership |
|------|--------|----------|------------|-----------|
| `quiz/page.js` | No `isWide`; panel uses `max-w-lg` + `overflow-y-auto` on panel (not body); no `flex-col` structure; body not `flex-1`; footer not `shrink-0`; uses plain `<textarea>` for `explanation` (should be MarkdownEditor?) | Lines 411-569 | Medium | Quiz admin — simple fields, `explanation` is the only long text |
| `reminders/page.js` | No `isWide`; panel uses `max-w-2xl` + `overflow-y-auto` on panel; body `space-y-4 p-5` not `flex-1 overflow-y-auto`; footer not `shrink-0`; uses plain `<textarea>` for `text` (5 rows) | Lines 407-575 | Low | Simple form, `text` field could use MarkdownEditor |
| `achievements/page.js` | Uses `isOpen={showModal}` prop instead of conditional render; no `isWide`; panel `max-w-lg` + `overflow-y-auto` on panel; body `space-y-4 p-4` not `flex-1`; footer not `shrink-0`; `description`/`desc_en` use plain `<textarea rows=2>` | Lines 392-570 | Low | Two language fields — both short, MarkdownEditor not needed |
| `lessons/page.js` | Uses `modalOpen` state; panel has `flex-col max-h-[90vh]` but body is `<form className='flex-1 overflow-y-auto p-6 space-y-6'>` (good); footer is `shrink-0` (good); **BUT** uses `MarkdownEditor` for step bodies ✅ — only missing `isWide`; `panelClassName` hardcodes `max-w-2xl` | Lines 337-563 | Low | Complex nested steps with multiple MarkdownEditors; missing `isWide` |
| `kajian/page.js` | No `isWide`; panel `max-w-lg` + `overflow-y-auto` on panel; body `p-5 space-y-4` not `flex-1`; footer not `shrink-0`; has `MarkdownEditor` for `description` ✅; also has 3rd image preview modal | Lines 618-916 | Medium | Three modals (create/edit, delete, image preview); `description` uses MarkdownEditor |
| `siroh/page.js` (category modals) | Two inline forms (not ModalShell): category create (line 217-247) and category edit (line 352-389) — no modal shell, no standardization | Lines 217-389 | Low | Separate from content forms which use pages |

---

### ❌ PRIORITY 4 — GenericAdminCRUD Consumers (Standard via Component)

| File | Uses GenericAdminCRUD | isWide | MarkdownEditor | Notes |
|------|----------------------|--------|----------------|-------|
| `perawi/page.js` | ✅ | ✅ (via component) | ❌ (uses `textarea` for `biografis`) | `biografis` could be MarkdownEditor |
| `hadith-ayah/page.js` | ✅ | ✅ | N/A | Simple relational fields only |
| `jarh-tadil/page.js` | ✅ | ✅ | ❌ (uses `textarea` for `catatan`) | `catatan` could be MarkdownEditor |
| `masjid/page.js` | ✅ | ✅ | ❌ (uses `textarea` for `description`) | `description` could be MarkdownEditor |
| `locations/page.js` | ✅ | ✅ | ❌ (uses `textarea` for `description`) | `description` could be MarkdownEditor |
| `ads/page.js` | ✅ | ✅ | N/A | No long text fields |
| `radio-islamic/page.js` | ✅ | ✅ | ❌ (uses `textarea` for `description`) | `description` could be MarkdownEditor |
| `takhrij/page.js` | ✅ | ✅ | ❌ (uses `textarea` for `catatan`) | `catatan` could be MarkdownEditor |
| `sanad/page.js` | ✅ | ✅ | N/A | Uses custom `MataSanadEditor` for nested data |

---

### ❓ PRIORITY 5 — Unverified / Need Check

| File | Has Create/Edit Modal? | Notes |
|------|------------------------|-------|
| `audit-logs/page.js` | ❌ | Read-only |
| `users/page.js` | ❌ | Role change only, no create/edit modal |
| `reports/page.js` | ✅ (status update modal) | Line 407 — simple status change, not CRUD form |
| `push/page.js` | ✅ (send notification form) | Line 109 — form in modal? Need check |
| `sanad/MataSanadEditor.js` | ✅ (nested editor) | Line 74 — custom component, not standard modal |

---

## Summary by Category

| Category | Count | Action |
|----------|-------|--------|
| **Active WIP (skip)** | 1 | `library/page.js` |
| **Fully Standard** | 14 | `fiqh`, `manasik`, `panduan-sholat`, `amalan`, `asmaul-husna`, `doa`, `dzikir`, `kamus`, `wirid`, `tokoh-tarikh`, `blog/*`, `siroh/*` |
| **Close (missing `isWide` only)** | 2 | `sejarah`, `asbabun-nuzul` |
| **Need Full Migration** | 6 | `quiz`, `reminders`, `achievements`, `lessons`, `kajian`, `siroh` (category forms) |
| **Via GenericAdminCRUD (could enhance)** | 9 | `perawi`, `hadith-ayah`, `jarh-tadil`, `masjid`, `locations`, `ads`, `radio-islamic`, `takhrij`, `sanad` |
| **Special / Unverified** | 4 | `audit-logs`, `users`, `reports`, `push` |

**Total admin pages with modals/forms: ~36**

---

## Recommended Next Steps

1. **Immediate (low risk):** Add `useLayoutMode`/`isWide` to `sejarah/page.js` and `asbabun-nuzul/page.js` — 2 lines each
2. **Quick wins:** Migrate `quiz`, `reminders`, `achievements` to standard pattern — simple forms
3. **Medium effort:** `lessons` (add `isWide`), `kajian` (3 modals), `siroh` category forms
4. **Component-level:** Enhance `GenericAdminCRUD` to use `MarkdownEditor` for `TYPE_TEXTAREA` fields when `rows >= 4` or new `TYPE_MARKDOWN` hint
5. **Skip:** `library/page.js` (active WIP)

---

## Evidence Appendix

### Standard Pattern (fiqh/page.js lines 381-553):
```jsx
<ModalShell
    onClose={() => setShowModal(false)}
    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
    panelClassName={`bg-white dark:bg-slate-800 rounded-2xl w-full flex flex-col max-h-[90vh] overflow-hidden ${
        isWide ? "max-w-4xl" : "max-w-2xl"
    }`}>
    <div className='flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700 shrink-0'>
        {/* Header */}
    </div>
    <div className='p-6 space-y-6 overflow-y-auto flex-1'>
        {/* Scrollable body */}
        <MarkdownEditor ... />
    </div>
    <div className='flex gap-3 p-6 border-t border-gray-100 dark:border-slate-700 shrink-0'>
        {/* Fixed footer */}
    </div>
</ModalShell>
```

### Non-Standard Example (quiz/page.js lines 411-569):
```jsx
<ModalShell
    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'  // No flex-col, overflow on panel
>
    <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>  // No shrink-0
    <div className='p-5 space-y-4'>  // No flex-1, no overflow-y-auto
    <div className='flex gap-3 p-5 border-t border-gray-100 dark:border-slate-700'>  // No shrink-0
```

### GenericAdminCRUD (lines 520-705):
```jsx
<ModalShell
    panelClassName={`bg-white dark:bg-slate-900 w-full rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden ${
        isWide ? "max-w-4xl" : "max-w-2xl"
    }`}>
    <div className='flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800 shrink-0'>
    <div className={formLayout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 overflow-y-auto flex-1" : "space-y-4 p-6 overflow-y-auto flex-1"}>
        {fields.map(f => f.type === TYPE_MARKDOWN ? <MarkdownEditor /> : ...)}
    </div>
    <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-800 shrink-0'>
```

