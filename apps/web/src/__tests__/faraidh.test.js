import { calculateFaraidh, HEIR_LABELS } from "@/lib/faraidh";

describe("HEIR_LABELS", () => {
    test("has all expected keys", () => {
        expect(Object.keys(HEIR_LABELS)).toEqual([
            "suami",
            "istri",
            "anak_laki",
            "anak_perempuan",
            "cucu_laki",
            "cucu_perempuan",
            "ayah",
            "ayah_residue",
            "ibu",
            "kakek",
            "kakek_residue",
            "nenek",
            "saudara_laki",
            "saudara_perempuan",
            "saudara_seayah_laki",
            "saudara_seayah_perempuan",
            "saudara_seibu",
            "ibu_saudara_musytarakah",
        ]);
    });
    test("suami has idn/en labels", () => {
        expect(HEIR_LABELS.suami).toEqual({ idn: "Suami", en: "Husband" });
    });
    test("anak_perempuan has idn/en labels", () => {
        expect(HEIR_LABELS.anak_perempuan).toEqual({
            idn: "Anak Perempuan",
            en: "Daughter",
        });
    });
});

describe("calculateFaraidh", () => {
    describe("suami only", () => {
        test("suami gets 1/2 without children", () => {
            const result = calculateFaraidh({ suami: 1 }, 100);
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].key).toBe("suami");
            expect(result.rows[0].share).toBeCloseTo(0.5, 5);
            expect(result.rows[0].amount).toBe(50);
        });

        test("suami gets 1/4 with children", () => {
            const result = calculateFaraidh({ suami: 1, anakL: 1 }, 100);
            expect(
                result.rows.find((r) => r.key === "suami").share,
            ).toBeCloseTo(0.25, 5);
        });
    });

    describe("istri only", () => {
        test("istri gets 1/4 without children", () => {
            const result = calculateFaraidh({ istri: 1 }, 100);
            expect(result.rows[0].key).toBe("istri");
            expect(result.rows[0].share).toBeCloseTo(0.25, 5);
        });

        test("istri gets 1/8 with children", () => {
            const result = calculateFaraidh({ istri: 1, anakL: 1 }, 100);
            expect(
                result.rows.find((r) => r.key === "istri").share,
            ).toBeCloseTo(0.125, 5);
        });
    });

    describe("with children", () => {
        test("son and daughter get ashabah with 2:1 ratio", () => {
            const result = calculateFaraidh({ anakL: 1, anakP: 1 });
            const son = result.rows.find((r) => r.key === "anak_laki");
            const daughter = result.rows.find(
                (r) => r.key === "anak_perempuan",
            );
            expect(son).toBeDefined();
            expect(daughter).toBeDefined();
            expect(son.share).toBeCloseTo(daughter.share * 2, 5);
        });

        test("one daughter gets full share via radd", () => {
            const result = calculateFaraidh({ anakP: 1 });
            const daughter = result.rows.find(
                (r) => r.key === "anak_perempuan",
            );
            expect(daughter.share).toBeCloseTo(1, 5);
            expect(result.applied.radd).toBe(true);
        });

        test("one daughter with spouse: radd redistributes residue to daughter", () => {
            const result = calculateFaraidh({ anakP: 1, suami: 1 });
            const daughter = result.rows.find(
                (r) => r.key === "anak_perempuan",
            );
            const husband = result.rows.find((r) => r.key === "suami");
            expect(husband.share).toBeCloseTo(0.25, 5);
            expect(daughter.share).toBeCloseTo(0.75, 5);
            expect(result.applied.radd).toBe(true);
        });

        test("two daughters get radd-adjusted full share", () => {
            const result = calculateFaraidh({ anakP: 2 });
            const daughter = result.rows.find(
                (r) => r.key === "anak_perempuan",
            );
            expect(daughter.share).toBeCloseTo(1, 5);
            expect(result.applied.radd).toBe(true);
        });
    });

    describe("ayah", () => {
        test("ayah gets 1/6 with son", () => {
            const result = calculateFaraidh({ ayah: 1, anakL: 1 });
            expect(result.rows.find((r) => r.key === "ayah").share).toBeCloseTo(
                1 / 6,
                5,
            );
        });

        test("ayah gets 1/6 with daughter plus residue", () => {
            const result = calculateFaraidh({ ayah: 1, anakP: 1 });
            expect(result.rows.find((r) => r.key === "ayah").share).toBeCloseTo(
                1 / 6,
                5,
            );
            const residue = result.rows.find((r) => r.key === "ayah_residue");
            expect(residue).toBeDefined();
            expect(residue.share).toBeGreaterThan(0);
        });
    });

    describe("ibu", () => {
        test("ibu gets full share via radd without children", () => {
            const result = calculateFaraidh({ ibu: 1 });
            expect(result.rows.find((r) => r.key === "ibu").share).toBeCloseTo(
                1,
                5,
            );
            expect(result.applied.radd).toBe(true);
        });

        test("ibu gets 1/6 with children", () => {
            const result = calculateFaraidh({ ibu: 1, anakL: 1 });
            expect(result.rows.find((r) => r.key === "ibu").share).toBeCloseTo(
                1 / 6,
                5,
            );
        });
    });

    describe("siblings", () => {
        test("siblings get ashabah when no children/father", () => {
            const result = calculateFaraidh({ saudaraL: 1, saudaraP: 1 });
            const brother = result.rows.find((r) => r.key === "saudara_laki");
            const sister = result.rows.find(
                (r) => r.key === "saudara_perempuan",
            );
            expect(brother).toBeDefined();
            expect(sister).toBeDefined();
            expect(brother.share).toBeCloseTo(sister.share * 2, 5);
        });
    });

    describe("aul (oversubscription)", () => {
        test("detects aul when shares exceed 1", () => {
            const result = calculateFaraidh({ suami: 1, ibu: 1, anakP: 2 });
            expect(result.applied.aul).toBe(true);
            expect(result.totalShare).toBeCloseTo(1, 5);
        });
    });

    describe("radd (return)", () => {
        test("applies radd when residue remains without ashabah", () => {
            const result = calculateFaraidh({ ibu: 1, anakP: 1 });
            expect(result.totalShare).toBeCloseTo(1, 5);
        });
    });

    test("total share sums to 1", () => {
        const result = calculateFaraidh({
            suami: 1,
            ayah: 1,
            ibu: 1,
            anakL: 1,
            anakP: 1,
        });
        expect(result.totalShare).toBeCloseTo(1, 5);
    });

    test("amounts scale with total", () => {
        const result = calculateFaraidh({ suami: 1, anakP: 1 }, 200);
        const totalAmount = result.rows.reduce((s, r) => s + r.amount, 0);
        expect(totalAmount).toBeCloseTo(200, 5);
    });

    describe("Umariyyatain (ayah + pasangan)", () => {
        test("ayah + suami tanpa anak: suami 1/2, ayah sisa", () => {
            const result = calculateFaraidh({ ayah: 1, suami: 1 }, 100);
            expect(result.applied.umariyyah).toBe(true);
            const suami = result.rows.find((r) => r.key === "suami");
            const ayah = result.rows.find(
                (r) => r.key === "ayah" || r.key === "ayah_residue",
            );
            expect(suami.share).toBeCloseTo(0.5, 5);
            expect(ayah.share).toBeCloseTo(0.5, 5);
        });

        test("ayah + istri tanpa anak: istri 1/4, ayah sisa", () => {
            const result = calculateFaraidh({ ayah: 1, istri: 1 }, 100);
            expect(result.applied.umariyyah).toBe(true);
            const istri = result.rows.find((r) => r.key === "istri");
            const ayah = result.rows.find(
                (r) => r.key === "ayah" || r.key === "ayah_residue",
            );
            expect(istri.share).toBeCloseTo(0.25, 5);
            expect(ayah.share).toBeCloseTo(0.75, 5);
        });

        test("ayah + suami + anak: bukan umariyyah, suami 1/4", () => {
            const result = calculateFaraidh(
                { ayah: 1, suami: 1, anakL: 1 },
                100,
            );
            expect(result.applied.umariyyah).toBe(false);
            const suami = result.rows.find((r) => r.key === "suami");
            expect(suami.share).toBeCloseTo(0.25, 5);
        });
    });

    describe("Minbariyah (kakek + saudara kandung)", () => {
        test("kakek + 1 saudara L: kakek 1/6, saudara sisa", () => {
            const result = calculateFaraidh({ kakek: 1, saudaraL: 1 }, 100);
            expect(result.applied.kakek_saudara).toBe(true);
            const kakek = result.rows.find((r) => r.key === "kakek");
            expect(kakek.share).toBeCloseTo(1 / 6, 5);
            expect(result.totalShare).toBeCloseTo(1, 5);
        });

        test("kakek + 2 saudara L: kakek 1/6, saudara ashabah 5/6 (2:1)", () => {
            const result = calculateFaraidh({ kakek: 1, saudaraL: 2 }, 100);
            const kakek = result.rows.find((r) => r.key === "kakek");
            expect(kakek.share).toBeCloseTo(1 / 6, 5);
            expect(result.totalShare).toBeCloseTo(1, 5);
        });
    });

    describe("Akdariyah (kakek + saudara P kandung)", () => {
        test("kakek + 1 saudara P: kakek 1/6, saudara P 1/2, sisa kakek ashabah", () => {
            const result = calculateFaraidh({ kakek: 1, saudaraP: 1 }, 100);
            expect(result.applied.akdariyah).toBe(true);
            expect(result.totalShare).toBeCloseTo(1, 5);
        });

        test("kakek + 2 saudara P: kakek 1/6, saudara P 2/3, sisa kakek ashabah", () => {
            const result = calculateFaraidh({ kakek: 1, saudaraP: 2 }, 100);
            expect(result.applied.akdariyah).toBe(true);
            expect(result.totalShare).toBeCloseTo(1, 5);
        });
    });

    describe("Saudara seayah", () => {
        test("seayah L ashabah jika kandung tidak ada", () => {
            const result = calculateFaraidh({ saudaraSeayahL: 1 }, 100);
            const row = result.rows.find(
                (r) => r.key === "saudara_seayah_laki",
            );
            expect(row).toBeDefined();
            expect(row.share).toBeCloseTo(1, 5);
        });

        test("seayah terhalang oleh kandung L", () => {
            const result = calculateFaraidh(
                { saudaraL: 1, saudaraSeayahL: 1 },
                100,
            );
            const seayah = result.rows.find(
                (r) => r.key === "saudara_seayah_laki",
            );
            expect(seayah).toBeUndefined();
        });

        test("seayah terhalang oleh ayah", () => {
            const result = calculateFaraidh(
                { ayah: 1, saudaraSeayahL: 1 },
                100,
            );
            const seayah = result.rows.find(
                (r) => r.key === "saudara_seayah_laki",
            );
            expect(seayah).toBeUndefined();
        });
    });

    describe("Saudara seibu", () => {
        test("seibu + suami: radd applies sisa 1/3 ke seibu", () => {
            const result = calculateFaraidh(
                { suami: 1, saudaraSeibuL: 1 },
                100,
            );
            const row = result.rows.find((r) => r.key === "saudara_seibu");
            expect(result.applied.radd).toBe(true);
            expect(row.share).toBeCloseTo(0.5, 5);
        });

        test("seibu 1 org tanpa ashabah: radd -> full share", () => {
            const result = calculateFaraidh({ saudaraSeibuL: 1 }, 100);
            const row = result.rows.find((r) => r.key === "saudara_seibu");
            expect(row.share).toBeCloseTo(1, 5);
            expect(result.applied.radd).toBe(true);
        });

        test("seibu >1 + suami: radd applies", () => {
            const result = calculateFaraidh(
                { suami: 1, saudaraSeibuL: 1, saudaraSeibuP: 1 },
                100,
            );
            const row = result.rows.find((r) => r.key === "saudara_seibu");
            expect(result.applied.radd).toBe(true);
            expect(row.share).toBeCloseTo(1 / 3 + 1 / 6, 5);
        });

        test("seibu terhalang oleh anak", () => {
            const result = calculateFaraidh(
                { anakL: 1, saudaraSeibuL: 1 },
                100,
            );
            const row = result.rows.find((r) => r.key === "saudara_seibu");
            expect(row).toBeUndefined();
        });

        test("seibu terhalang oleh saudara kandung", () => {
            const result = calculateFaraidh(
                { saudaraL: 1, saudaraSeibuL: 1 },
                100,
            );
            const row = result.rows.find((r) => r.key === "saudara_seibu");
            expect(row).toBeUndefined();
        });
    });

    describe("Cucu (furu' dari anak laki)", () => {
        test("cucu L + cucu P ashabah 2:1", () => {
            const result = calculateFaraidh({ cucuL: 1, cucuP: 1 }, 100);
            const L = result.rows.find((r) => r.key === "cucu_laki");
            const P = result.rows.find((r) => r.key === "cucu_perempuan");
            expect(L).toBeDefined();
            expect(P).toBeDefined();
            expect(L.share).toBeCloseTo(P.share * 2, 5);
        });

        test("1 cucu P dapat 1/2 + radd", () => {
            const result = calculateFaraidh({ cucuP: 1 }, 100);
            const P = result.rows.find((r) => r.key === "cucu_perempuan");
            expect(P.share).toBeCloseTo(1, 5);
            expect(result.applied.radd).toBe(true);
        });

        test("cucu terhalang oleh anak L", () => {
            const result = calculateFaraidh({ anakL: 1, cucuL: 1 }, 100);
            const cucuL = result.rows.find((r) => r.key === "cucu_laki");
            expect(cucuL).toBeUndefined();
        });
    });
});
