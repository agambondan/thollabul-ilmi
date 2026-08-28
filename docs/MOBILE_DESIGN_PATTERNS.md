# Mobile Design Patterns

> Acuan pola desain wajib untuk `apps/mobile`. Pola di sini bersifat **mengikat** — tidak boleh diabaikan tanpa diskusi eksplisit dengan owner.

## Detail UI: Modal atau Page, Bukan Inline Expand/Collapse

**Aturan:** Detail konten untuk item dalam list **dilarang** memakai pola inline expand/collapse (tombol "Buka detail" → "Tutup detail" yang merubah card list menjadi panjang).

**Pakai salah satu dari dua pola berikut:**

### 1. Bottom-Sheet Modal Popup

Cocok untuk detail singkat-menengah (1–2 layar konten).

**Implementasi acuan:**

- `apps/mobile/src/screens/QuranScreen.js` — popup Tafsir, Asbabun Nuzul, Settings, Tajweed legend
- `apps/mobile/src/screens/ExploreScreen.js` — popup detail untuk Kajian, Blog, Siroh, Fiqh, Tafsir item, dll

**Komponen wajib dalam modal:**

```jsx
<Modal
    animationType='slide'
    onRequestClose={close}
    transparent
    visible={visible}
>
    <Pressable onPress={close} style={styles.modalOverlay} />
    <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalMeta}>{meta}</Text>
            </View>
            <Pressable hitSlop={8} onPress={close} style={styles.modalClose}>
                <X color={colors.muted} size={18} strokeWidth={2.2} />
            </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* content */}
            <View style={styles.modalBottomPad} />
        </ScrollView>
    </View>
</Modal>
```

**Style anchor (lihat ExploreScreen / QuranScreen):**

- Overlay `rgba(0,0,0,0.38)`, full-flex tap-to-close
- Sheet rounded-top 20px, `maxHeight: '80%'` atau `'65%'`, `bg = colors.bg`
- Handle pill 40×4 di tengah-atas
- Header dengan judul (`fontFamily: 'serif'`, weight 900) + meta + close X

### 2. Halaman Detail Terpisah (Page Push)

Cocok untuk detail panjang dengan banyak section/tab (Quran reader, Hadith detail).

**Implementasi acuan:**

- `apps/mobile/src/screens/HadithScreen.js` — `if (selectedHadith) return <DetailView />`
- `apps/mobile/src/screens/QuranScreen.js` — `if (selectedSurah) return <Reader />`

**Pola:**

```jsx
const [selectedItem, setSelectedItem] = useState(null);

useEffect(() => {
    if (!isActive) return;
    if (selectedItem) {
        navigation?.setBack(() => {
            setSelectedItem(null);
            return true;
        });
    } else {
        navigation?.clearBack?.();
    }
}, [isActive, selectedItem, navigation]);

if (selectedItem) {
    return (
        <DetailScreen
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
        />
    );
}
```

**Wajib:** `setBack`/`clearBack` agar tombol back Android menutup detail dulu, baru keluar fitur.

---

## Mengapa

1. **List tetap scannable** — user bisa scroll panjang katalog tanpa item membengkak.
2. **Fokus pada detail** — modal/page memberi seluruh layar untuk konten detail tanpa noise list.
3. **Konsisten** — Quran sudah pakai pola ini untuk Tafsir/Asbab/Settings; user mengharapkan pola yang sama di seluruh app.
4. **Back navigation native** — modal & page push terintegrasi dengan Android back gesture; expand inline tidak.

---

## Saat Refactor / Fitur Baru

- Cek dulu fitur sudah pakai expand inline atau belum: cari `Buka detail`, `Tutup detail`, `setExpanded`, `isExpanded`.
- Kalau ada, refactor ke modal popup (default) atau page detail (kalau kontennya panjang/multi-section).
- Reuse style class `modalOverlay`, `modalSheet`, `modalHandle`, `modalHeader`, `modalTitle`, `modalMeta`, `modalClose`, `modalBottomPad` dari ExploreScreen/QuranScreen — jangan bikin variasi visual baru.

---

## Pengecualian

- **List truncation / show-more** (misalnya "Tampilkan semua (23 lagi)" / "Ringkas") — bukan termasuk pola yang dilarang. Itu pagination, bukan detail expand. Lihat `HadithScreen.js` line 244.
- **Inline form section** seperti murojaah form di QuranScreen tab Murojaah — bukan detail item, jadi boleh.
- **Sub-section dalam satu screen** (Hafalan stats, Bookmark notes panel) — boleh, asal bukan untuk membuka detail item dari list.
