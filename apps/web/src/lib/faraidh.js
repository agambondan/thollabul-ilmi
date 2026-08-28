// Kalkulator pembagian waris (faraidh) — kasus dasar Ashabul Furudh + Ashabah
// Mendukung: suami/istri, anak L/P, ayah/ibu, kakek/nenek, saudara kandung L/P
// Kasus khusus: Musytarakah (suami+ibu+2+saudara kandung L/P berbagi 1/3)
// Output: { rows: [{key, count, fraction, share, amount}], total, residueAfterFurudh, applied: {aul?, radd?, musytarakah?} }

const fr = (num, den) => ({ num, den });
const frToDec = (f) => f.num / f.den;

const lcm = (a, b) => {
    const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
    return Math.abs(a * b) / gcd(a, b);
};

export function calculateFaraidh(input, total) {
    const {
        suami = 0,
        istri = 0,
        anakL = 0,
        anakP = 0,
        ayah = 0,
        ibu = 0,
        kakek = 0,
        nenek = 0,
        saudaraL = 0,
        saudaraP = 0,
    } = input;

    const hasChildren = anakL > 0 || anakP > 0;
    const hasSon = anakL > 0;
    const hasDaughter = anakP > 0;
    const hasFather = ayah > 0;
    const hasGrandfather = kakek > 0 && !hasFather;
    const hasMultipleSiblings = saudaraL + saudaraP >= 2;
    const grandmotherActive = nenek > 0 && ibu === 0;
    const isMusytarakah =
        suami > 0 &&
        ibu > 0 &&
        !hasFather &&
        !hasChildren &&
        !hasGrandfather &&
        (saudaraL >= 2 || saudaraL + saudaraP >= 2);

    const rows = [];
    const ashabah = [];

    if (suami > 0) {
        rows.push({
            key: "suami",
            count: 1,
            fraction: hasChildren ? fr(1, 4) : fr(1, 2),
        });
    } else if (istri > 0) {
        rows.push({
            key: "istri",
            count: istri,
            fraction: hasChildren ? fr(1, 8) : fr(1, 4),
        });
    }

    if (ibu > 0) {
        const oneThird = !hasChildren && !hasMultipleSiblings;
        rows.push({
            key: "ibu",
            count: 1,
            fraction: oneThird ? fr(1, 3) : fr(1, 6),
        });
    } else if (grandmotherActive) {
        rows.push({ key: "nenek", count: nenek, fraction: fr(1, 6) });
    }

    if (hasFather) {
        if (hasSon) {
            rows.push({ key: "ayah", count: 1, fraction: fr(1, 6) });
        } else if (hasDaughter) {
            rows.push({ key: "ayah", count: 1, fraction: fr(1, 6) });
            ashabah.push({ key: "ayah_residue", count: 1, weight: 1 });
        } else {
            ashabah.push({ key: "ayah", count: 1, weight: 1 });
        }
    } else if (hasGrandfather) {
        if (hasSon) {
            rows.push({ key: "kakek", count: 1, fraction: fr(1, 6) });
        } else {
            ashabah.push({ key: "kakek", count: 1, weight: 1 });
        }
    }

    if (hasSon) {
        const totalShares = anakL * 2 + anakP;
        ashabah.push({
            key: "anak_laki",
            count: anakL,
            weight: (anakL * 2) / totalShares,
        });
        if (anakP > 0) {
            ashabah.push({
                key: "anak_perempuan",
                count: anakP,
                weight: anakP / totalShares,
            });
        }
    } else if (hasDaughter) {
        rows.push({
            key: "anak_perempuan",
            count: anakP,
            fraction: anakP === 1 ? fr(1, 2) : fr(2, 3),
        });
    }

    if (!hasChildren && !hasFather && !hasGrandfather) {
        if (isMusytarakah) {
            rows.push({
                key: "ibu_musytarakah",
                count: 1 + saudaraL + saudaraP,
                fraction: fr(1, 3),
                note: "Musytarakah: ibu + saudara kandung berbagi 1/3 bersama",
            });
        } else if (saudaraL > 0) {
            const totalShares = saudaraL * 2 + saudaraP;
            ashabah.push({
                key: "saudara_laki",
                count: saudaraL,
                weight: (saudaraL * 2) / totalShares,
            });
            if (saudaraP > 0) {
                ashabah.push({
                    key: "saudara_perempuan",
                    count: saudaraP,
                    weight: saudaraP / totalShares,
                });
            }
        } else if (saudaraP > 0) {
            rows.push({
                key: "saudara_perempuan",
                count: saudaraP,
                fraction: saudaraP === 1 ? fr(1, 2) : fr(2, 3),
            });
        }
    }

    let denomLCM = 1;
    rows.forEach((r) => {
        denomLCM = lcm(denomLCM, r.fraction.den);
    });

    let totalFurudhDec = rows.reduce((sum, r) => sum + frToDec(r.fraction), 0);
    let applied = { aul: false, radd: false, musytarakah: false };

    if (isMusytarakah) {
        applied.musytarakah = true;
    }

    if (totalFurudhDec > 1) {
        const adjustedTotal = totalFurudhDec;
        rows.forEach((r) => {
            r.adjusted = frToDec(r.fraction) / adjustedTotal;
        });
        applied.aul = true;
        ashabah.length = 0;
    } else if (totalFurudhDec < 1 && ashabah.length === 0 && rows.length > 0) {
        const onlySpouse =
            rows.length === 1 &&
            (rows[0].key === "suami" || rows[0].key === "istri");
        if (!onlySpouse) {
            const spouseRow = rows.find(
                (r) => r.key === "suami" || r.key === "istri",
            );
            const spouseShare = spouseRow ? frToDec(spouseRow.fraction) : 0;
            const remaining = 1 - spouseShare;
            const radSubjects = rows.filter(
                (r) => r.key !== "suami" && r.key !== "istri",
            );
            const radTotal = radSubjects.reduce(
                (s, r) => s + frToDec(r.fraction),
                0,
            );
            radSubjects.forEach((r) => {
                r.adjusted = (frToDec(r.fraction) / radTotal) * remaining;
            });
            if (spouseRow) spouseRow.adjusted = spouseShare;
            applied.radd = true;
        }
    }

    const finalRows = rows.map((r) => {
        const dec = r.adjusted ?? frToDec(r.fraction);
        const amount = (total ?? 0) * dec;
        return {
            key: r.key,
            count: r.count,
            fraction: r.fraction,
            share: dec,
            amount,
        };
    });

    if (ashabah.length > 0) {
        const usedDec = rows.reduce((s, r) => s + frToDec(r.fraction), 0);
        const residueDec = Math.max(0, 1 - usedDec);
        ashabah.forEach((a) => {
            const share = residueDec * a.weight;
            finalRows.push({
                key: a.key,
                count: a.count,
                fraction: null,
                share,
                amount: (total ?? 0) * share,
                isAshabah: true,
            });
        });
    }

    const sumShare = finalRows.reduce((s, r) => s + r.share, 0);

    return {
        rows: finalRows,
        totalShare: sumShare,
        residueAfterFurudh: Math.max(
            0,
            1 - rows.reduce((s, r) => s + frToDec(r.fraction), 0),
        ),
        applied,
    };
}

export const HEIR_LABELS = {
    suami: { idn: "Suami", en: "Husband" },
    istri: { idn: "Istri", en: "Wife" },
    anak_laki: { idn: "Anak Laki-laki", en: "Son" },
    anak_perempuan: { idn: "Anak Perempuan", en: "Daughter" },
    ayah: { idn: "Ayah", en: "Father" },
    ayah_residue: { idn: "Ayah (sisa)", en: "Father (residue)" },
    ibu: { idn: "Ibu", en: "Mother" },
    kakek: { idn: "Kakek", en: "Grandfather" },
    nenek: { idn: "Nenek", en: "Grandmother" },
    saudara_laki: { idn: "Saudara Laki-laki", en: "Brother" },
    saudara_perempuan: { idn: "Saudara Perempuan", en: "Sister" },
    ibu_musytarakah: {
        idn: "Ibu + Saudara (Musytarakah)",
        en: "Mother + Siblings (Mushtarakah)",
    },
};
