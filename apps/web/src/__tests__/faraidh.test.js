import { calculateFaraidh, HEIR_LABELS } from "@/lib/faraidh";

describe("HEIR_LABELS", () => {
    test("has all expected keys", () => {
        expect(Object.keys(HEIR_LABELS)).toEqual([
            "suami",
            "istri",
            "anak_laki",
            "anak_perempuan",
            "ayah",
            "ayah_residue",
            "ibu",
            "kakek",
            "nenek",
            "saudara_laki",
            "saudara_perempuan",
            "ibu_musytarakah",
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
});
