const fr = (num, den) => ({ num, den });
const frToDec = (f) => f.num / f.den;

const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

export function calculateFaraidh(input, total) {
    const {
        suami = 0,
        istri = 0,
        anakL = 0,
        anakP = 0,
        cucuL = 0,
        cucuP = 0,
        ayah = 0,
        ibu = 0,
        kakek = 0,
        nenek = 0,
        saudaraL = 0,
        saudaraP = 0,
        saudaraSeayahL = 0,
        saudaraSeayahP = 0,
        saudaraSeibuL = 0,
        saudaraSeibuP = 0,
    } = input;

    const hasSpouse = suami > 0 || istri > 0;
    const hasChildren = anakL > 0 || anakP > 0;
    const hasSon = anakL > 0;
    const hasDaughter = anakP > 0;
    const hasGrandchild = cucuL > 0 || cucuP > 0;
    const hasGrandson = cucuL > 0;
    const hasFather = ayah > 0;
    const hasGrandfather = kakek > 0 && !hasFather;
    const hasMother = ibu > 0;
    const hasGrandmother = nenek > 0 && !hasMother;

    const totalSiblings = saudaraL + saudaraP + saudaraSeayahL + saudaraSeayahP;
    const hasMultipleSiblings = totalSiblings >= 2;
    const hasSiblingsKandung = saudaraL > 0 || saudaraP > 0;
    const hasSiblingsSeayah = saudaraSeayahL > 0 || saudaraSeayahP > 0;
    const hasSiblingsSeibu = saudaraSeibuL > 0 || saudaraSeibuP > 0;

    const blockedKandung = hasFather || hasSon || hasGrandson;
    const blockedSeayah =
        hasSiblingsKandung || hasFather || hasSon || hasGrandson;
    const blockedSeibu =
        hasChildren ||
        hasGrandson ||
        hasFather ||
        hasGrandfather ||
        hasSiblingsKandung ||
        hasSiblingsSeayah;

    const activeSaudaraL = blockedKandung ? 0 : saudaraL;
    const activeSaudaraP = blockedKandung ? 0 : saudaraP;
    const activeSaudaraSeayahL = blockedSeayah ? 0 : saudaraSeayahL;
    const activeSaudaraSeayahP = blockedSeayah ? 0 : saudaraSeayahP;
    const activeSaudaraSeibu = blockedSeibu ? 0 : saudaraSeibuL + saudaraSeibuP;

    const hasActiveKandung = activeSaudaraL > 0 || activeSaudaraP > 0;
    const hasActiveSeayah =
        activeSaudaraSeayahL > 0 || activeSaudaraSeayahP > 0;
    const hasActiveSeibu = activeSaudaraSeibu > 0;
    const hasActiveSiblings =
        hasActiveKandung || hasActiveSeayah || hasActiveSeibu;

    const rows = [];
    let ashabah = [];
    const notes = [];

    const isUmariyyah =
        hasFather &&
        hasSpouse &&
        !hasChildren &&
        !hasGrandson &&
        !hasActiveSiblings;

    const isMusytarakah =
        suami > 0 &&
        hasMother &&
        !hasFather &&
        !hasGrandfather &&
        !hasChildren &&
        !hasGrandson &&
        activeSaudaraL +
            activeSaudaraP +
            activeSaudaraSeayahL +
            activeSaudaraSeayahP >=
            2;

    const isKakekSaudara =
        hasGrandfather &&
        !hasChildren &&
        !hasGrandson &&
        !hasFather &&
        hasActiveKandung;

    const isAkdariyah =
        hasGrandfather &&
        !hasChildren &&
        !hasGrandson &&
        !hasFather &&
        activeSaudaraL === 0 &&
        activeSaudaraP > 0;

    if (suami > 0) {
        rows.push({
            key: "suami",
            count: 1,
            fraction: hasChildren || hasGrandson ? fr(1, 4) : fr(1, 2),
        });
    } else if (istri > 0) {
        rows.push({
            key: "istri",
            count: istri,
            fraction: hasChildren || hasGrandson ? fr(1, 8) : fr(1, 4),
        });
    }

    if (hasMother) {
        const oneThird = !hasChildren && !hasGrandson && !hasActiveSiblings;
        if (isMusytarakah) {
            rows.push({
                key: "ibu_saudara_musytarakah",
                count:
                    1 +
                    activeSaudaraL +
                    activeSaudaraP +
                    activeSaudaraSeayahL +
                    activeSaudaraSeayahP,
                fraction: fr(1, 3),
                note: "Musytarakah: 1/3 untuk ibu + saudara (dibagi 1:1)",
            });
        } else {
            rows.push({
                key: "ibu",
                count: 1,
                fraction: oneThird ? fr(1, 3) : fr(1, 6),
            });
        }
    } else if (hasGrandmother) {
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
            if (isUmariyyah) notes.push("umariyyah");
        }
    } else if (hasGrandfather) {
        if (hasSon) {
            rows.push({ key: "kakek", count: 1, fraction: fr(1, 6) });
        } else if (isAkdariyah) {
            rows.push({ key: "kakek", count: 1, fraction: fr(1, 6) });
            notes.push("akdariyah");
        } else if (isKakekSaudara) {
            rows.push({ key: "kakek", count: 1, fraction: fr(1, 6) });
            notes.push("kakek_saudara_zaid");
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
        if (hasDaughter) {
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

    if (!hasChildren && hasGrandchild) {
        if (hasGrandson) {
            const totalShares = cucuL * 2 + cucuP;
            ashabah.push({
                key: "cucu_laki",
                count: cucuL,
                weight: (cucuL * 2) / totalShares,
            });
            if (cucuP > 0) {
                ashabah.push({
                    key: "cucu_perempuan",
                    count: cucuP,
                    weight: cucuP / totalShares,
                });
            }
        } else {
            rows.push({
                key: "cucu_perempuan",
                count: cucuP,
                fraction: cucuP === 1 ? fr(1, 2) : fr(2, 3),
            });
        }
    }

    if (!hasChildren && !hasGrandson && !hasFather) {
        if (isMusytarakah) {
            // handled in mother block
        } else if (isAkdariyah) {
            rows.push({
                key: "saudara_perempuan",
                count: activeSaudaraP,
                fraction: activeSaudaraP === 1 ? fr(1, 2) : fr(2, 3),
            });
            ashabah.push({ key: "kakek_residue", count: 1, weight: 1 });
        } else if (activeSaudaraL > 0) {
            const totalShares =
                activeSaudaraL * 2 + activeSaudaraP + activeSaudaraSeayahP;
            ashabah.push({
                key: "saudara_laki",
                count: activeSaudaraL,
                weight: (activeSaudaraL * 2) / totalShares,
            });
            if (activeSaudaraP > 0) {
                ashabah.push({
                    key: "saudara_perempuan",
                    count: activeSaudaraP,
                    weight: activeSaudaraP / totalShares,
                });
            } else if (activeSaudaraSeayahP > 0) {
                ashabah.push({
                    key: "saudara_seayah_perempuan",
                    count: activeSaudaraSeayahP,
                    weight: activeSaudaraSeayahP / totalShares,
                });
            }
        } else if (activeSaudaraSeayahL > 0) {
            const totalShares = activeSaudaraSeayahL * 2 + activeSaudaraSeayahP;
            ashabah.push({
                key: "saudara_seayah_laki",
                count: activeSaudaraSeayahL,
                weight: (activeSaudaraSeayahL * 2) / totalShares,
            });
            if (activeSaudaraSeayahP > 0) {
                ashabah.push({
                    key: "saudara_seayah_perempuan",
                    count: activeSaudaraSeayahP,
                    weight: activeSaudaraSeayahP / totalShares,
                });
            }
        } else if (activeSaudaraP > 0) {
            rows.push({
                key: "saudara_perempuan",
                count: activeSaudaraP,
                fraction: activeSaudaraP === 1 ? fr(1, 2) : fr(2, 3),
            });
        } else if (activeSaudaraSeayahP > 0) {
            rows.push({
                key: "saudara_seayah_perempuan",
                count: activeSaudaraSeayahP,
                fraction: activeSaudaraSeayahP === 1 ? fr(1, 2) : fr(2, 3),
            });
        } else if (activeSaudaraSeibu > 0) {
            rows.push({
                key: "saudara_seibu",
                count: activeSaudaraSeibu,
                fraction: activeSaudaraSeibu === 1 ? fr(1, 6) : fr(1, 3),
            });
        }
    }

    let totalFurudhDec = rows.reduce(
        (sum, r) => (r.fraction ? sum + frToDec(r.fraction) : sum),
        0,
    );
    let applied = {
        aul: false,
        radd: false,
        umariyyah: notes.includes("umariyyah"),
        musytarakah: isMusytarakah,
        kakek_saudara: notes.includes("kakek_saudara_zaid"),
        akdariyah: notes.includes("akdariyah"),
    };

    if (totalFurudhDec > 1) {
        rows.forEach((r) => {
            if (r.fraction) {
                r.adjusted = frToDec(r.fraction) / totalFurudhDec;
            }
        });
        applied.aul = true;
        ashabah = [];
    }

    if (totalFurudhDec < 1 && rows.length > 0) {
        const hasStandardAshabah = ashabah.some((a) => !a.shareOfResidue);
        if (!hasStandardAshabah) {
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
                    (r) => r.key !== "suami" && r.key !== "istri" && r.fraction,
                );
                const radTotal = radSubjects.reduce(
                    (s, r) => s + frToDec(r.fraction),
                    0,
                );
                radSubjects.forEach((r) => {
                    r.adjusted =
                        radTotal > 0
                            ? (frToDec(r.fraction) / radTotal) * remaining
                            : 0;
                });
                if (spouseRow) spouseRow.adjusted = spouseShare;
                applied.radd = true;
                ashabah = ashabah.filter((a) => a.shareOfResidue);
            }
        }
    }

    const finalRows = rows.map((r) => {
        const dec = r.adjusted ?? (r.fraction ? frToDec(r.fraction) : 0);
        return {
            key: r.key,
            count: r.count,
            fraction: r.fraction,
            share: dec,
            amount: (total ?? 0) * dec,
            note: r.note,
        };
    });

    if (ashabah.length > 0) {
        const usedDec = rows.reduce(
            (s, r) => (r.fraction ? s + frToDec(r.fraction) : s),
            0,
        );
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
            1 -
                rows.reduce(
                    (s, r) => (r.fraction ? s + frToDec(r.fraction) : s),
                    0,
                ),
        ),
        applied,
    };
}

export const HEIR_LABELS = {
    suami: { idn: "Suami", en: "Husband" },
    istri: { idn: "Istri", en: "Wife" },
    anak_laki: { idn: "Anak Laki-laki", en: "Son" },
    anak_perempuan: { idn: "Anak Perempuan", en: "Daughter" },
    cucu_laki: { idn: "Cucu Laki-laki (furu')", en: "Grandson (furu')" },
    cucu_perempuan: {
        idn: "Cucu Perempuan (furu')",
        en: "Granddaughter (furu')",
    },
    ayah: { idn: "Ayah", en: "Father" },
    ayah_residue: { idn: "Ayah (sisa)", en: "Father (residue)" },
    ibu: { idn: "Ibu", en: "Mother" },
    kakek: { idn: "Kakek", en: "Grandfather" },
    kakek_residue: { idn: "Kakek (sisa)", en: "Grandfather (residue)" },
    nenek: { idn: "Nenek", en: "Grandmother" },
    saudara_laki: { idn: "Saudara Laki-laki Kandung", en: "Full Brother" },
    saudara_perempuan: {
        idn: "Saudara Perempuan Kandung",
        en: "Full Sister",
    },
    saudara_seayah_laki: {
        idn: "Saudara Laki-laki Seayah",
        en: "Paternal Half-Brother",
    },
    saudara_seayah_perempuan: {
        idn: "Saudara Perempuan Seayah",
        en: "Paternal Half-Sister",
    },
    saudara_seibu: {
        idn: "Saudara Seibu (L+P)",
        en: "Maternal Siblings (M+F)",
    },
    ibu_saudara_musytarakah: {
        idn: "Ibu + Saudara (Musytarakah)",
        en: "Mother + Siblings (Mushtarakah)",
    },
};
