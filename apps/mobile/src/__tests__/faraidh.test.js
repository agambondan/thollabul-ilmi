import { calculateFaraidh, HEIR_LABELS } from "../lib/faraidh";

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
});

describe("calculateFaraidh (mobile parity)", () => {
    test("suami only: 1/2", () => {
        const r = calculateFaraidh({ suami: 1 }, 100);
        expect(r.rows[0].share).toBeCloseTo(0.5, 5);
    });

    test("Umariyyatain: ayah + suami = 1/2 : 1/2", () => {
        const r = calculateFaraidh({ ayah: 1, suami: 1 }, 100);
        expect(r.applied.umariyyah).toBe(true);
        expect(r.rows.find((x) => x.key === "suami").share).toBeCloseTo(
            0.5,
            5,
        );
        expect(r.rows.find((x) => x.key === "ayah").share).toBeCloseTo(
            0.5,
            5,
        );
    });

    test("Musytarakah: suami + ibu + 2 saudara -> totalShare=1", () => {
        const r = calculateFaraidh({ suami: 1, ibu: 1, saudaraL: 2 }, 100);
        expect(r.applied.musytarakah).toBe(true);
        expect(r.totalShare).toBeCloseTo(1, 5);
    });

    test("Minbariyah: kakek + saudara L -> kakek 1/6", () => {
        const r = calculateFaraidh({ kakek: 1, saudaraL: 1 }, 100);
        expect(r.applied.kakek_saudara).toBe(true);
        expect(r.rows.find((x) => x.key === "kakek").share).toBeCloseTo(
            1 / 6,
            5,
        );
    });

    test("Akdariyah: kakek + saudara P -> kakek_residue row", () => {
        const r = calculateFaraidh({ kakek: 1, saudaraP: 1 }, 100);
        expect(r.applied.akdariyah).toBe(true);
        expect(r.rows.find((x) => x.key === "kakek_residue")).toBeDefined();
        expect(r.totalShare).toBeCloseTo(1, 5);
    });

    test("Saudara seayah active when kandung absent", () => {
        expect(
            calculateFaraidh({ saudaraSeayahL: 1 }, 100).rows.find(
                (x) => x.key === "saudara_seayah_laki",
            ),
        ).toBeDefined();
        expect(
            calculateFaraidh({ saudaraL: 1, saudaraSeayahL: 1 }, 100).rows.find(
                (x) => x.key === "saudara_seayah_laki",
            ),
        ).toBeUndefined();
    });

    test("Saudara seibu radd when spouse present", () => {
        const r = calculateFaraidh({ suami: 1, saudaraSeibuL: 1 }, 100);
        expect(r.applied.radd).toBe(true);
    });

    test("Cucu 2:1 ashabah, blocked by anak L", () => {
        const r = calculateFaraidh({ cucuL: 1, cucuP: 1 }, 100);
        const L = r.rows.find((x) => x.key === "cucu_laki");
        const P = r.rows.find((x) => x.key === "cucu_perempuan");
        expect(L.share).toBeCloseTo(P.share * 2, 5);
        expect(
            calculateFaraidh({ anakL: 1, cucuL: 1 }, 100).rows.find(
                (x) => x.key === "cucu_laki",
            ),
        ).toBeUndefined();
    });

    test("Aul: shares > 1 reduce proportionally", () => {
        const r = calculateFaraidh({ suami: 1, ibu: 1, anakP: 2 }, 100);
        expect(r.applied.aul).toBe(true);
        expect(r.totalShare).toBeCloseTo(1, 5);
    });

    test("Radd: residual distributed to non-spouse", () => {
        const r = calculateFaraidh({ ibu: 1, anakP: 1 }, 100);
        expect(r.totalShare).toBeCloseTo(1, 5);
    });
});
