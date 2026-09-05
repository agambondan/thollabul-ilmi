const fs = require('fs');
const path = require('path');

const quranPath = path.join(__dirname, '../services/api/data/quran_base.json');
const fiqhItemPath = path.join(__dirname, '../services/api/data/static/fiqh_item.json');

const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf8'));
const fiqhItems = JSON.parse(fs.readFileSync(fiqhItemPath, 'utf8'));

// Map common surah names to surah number
const surahMap = {
    "al-fatihah": 1,
    "al-faatiha": 1,
    "al-baqarah": 2,
    "al-imran": 3,
    "ali-imran": 3,
    "ali 'imran": 3,
    "an-nisa": 4,
    "al-maidah": 5,
    "al-ma'idah": 5,
    "al-anam": 6,
    "at-taubah": 9,
    "al-isra": 17,
    "an-nur": 24,
    "al-hajj": 22,
    "al-fath": 48
};

function getAyah(surahNum, ayahNum) {
    const surah = quranData.surahs.find(s => s.number === surahNum);
    if (!surah) return null;
    const ayah = surah.ayahs.find(a => a.number === ayahNum);
    if (!ayah) return null;
    return {
        arabic: ayah.arabic,
        indonesian: ayah.indonesian
    };
}

// Load hadith sources on demand
function getHadith(book, number) {
    const file = path.join(__dirname, `../services/api/data/hadits_${book}.json`);
    if (!fs.existsSync(file)) return null;
    try {
        const list = JSON.parse(fs.readFileSync(file, 'utf8'));
        const found = list.find(h => h.number === Number(number));
        if (!found) return null;
        return {
            ar: found.ar,
            idn: found.idn
        };
    } catch {
        return null;
    }
}

const enriched = fiqhItems.map(item => {
    const source = item.source || '';
    let dalilParts = [];

    // Parse Quran: "QS. Surah: Ayah" or "QS. Surah: Ayah-Ayah"
    const quranMatch = source.match(/QS\.\s+([A-Za-z\s'-]+):\s*(\d+)/i);
    if (quranMatch) {
        const rawName = quranMatch[1].trim().toLowerCase().replace(/['’]/g, "'");
        let surahNum = surahMap[rawName];
        if (!surahNum) {
            // Fuzzy find
            const foundS = quranData.surahs.find(s => 
                s.slug.toLowerCase().includes(rawName.replace(/[^a-z]/g, '')) ||
                s.name_en.toLowerCase().includes(rawName.replace(/[^a-z]/g, ''))
            );
            if (foundS) surahNum = foundS.number;
        }

        const ayahNum = parseInt(quranMatch[2], 10);
        if (surahNum && ayahNum) {
            const ayah = getAyah(surahNum, ayahNum);
            if (ayah) {
                dalilParts.push(`QS. ${quranMatch[1].trim()}: ${ayahNum} — ${ayah.arabic}\n"${ayah.indonesian}"`);
            }
        }
    }

    // Parse Hadith: "HR. Bukhari No. 123", "HR. Muslim No. 456"
    const hadithMatches = source.matchAll(/HR\.\s+(Bukhari|Muslim|Abu Dawud|Tirmidzi|Nasai|Ibnu Majah|Ahmad)\s+No\.\s*(\d+)/gi);
    for (const m of hadithMatches) {
        let book = m[1].toLowerCase().replace(/\s+/g, '');
        if (book === 'abudawud') book = 'abudaud';
        if (book === 'ibnumajah') book = 'ibnumajah';
        const num = m[2];
        const h = getHadith(book, num);
        if (h) {
            const shortAr = h.ar.length > 300 ? h.ar.slice(0, 300) + '...' : h.ar;
            const shortIdn = h.idn.length > 300 ? h.idn.slice(0, 300) + '...' : h.idn;
            dalilParts.push(`HR. ${m[1]} No. ${num} — ${shortAr}\n"${shortIdn}"`);
        }
    }

    // If we gathered authentic parts, join them; otherwise keep source
    const dalilText = dalilParts.length > 0 ? dalilParts.join('\n\n') : source;
    return {
        ...item,
        dalil: dalilText
    };
});

fs.writeFileSync(fiqhItemPath, JSON.stringify(enriched, null, 4), 'utf8');
console.log('Successfully enriched', enriched.filter(e => e.dalil && e.dalil !== e.source).length, 'items with authentic texts');
