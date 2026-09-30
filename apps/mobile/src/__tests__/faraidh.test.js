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

    test("ayah + suami tanpa ibu: bukan Umariyyatain, ayah ashabah 1/2", () => {
        const r = calculateFaraidh({ ayah: 1, suami: 1 }, 100);
        expect(r.applied.umariyyah).toBe(false);
        expect(r.rows.find((x) => x.key === "suami").share).toBeCloseTo(0.5, 5);
        expect(r.rows.find((x) => x.key === "ayah").share).toBeCloseTo(0.5, 5);
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

describe("Umariyyatain (ayah + ibu + satu pasangan)", () => {
    const find = (r, key) => r.rows.find((x) => x.key === key);

    test("suami + ayah + ibu: 120 jt / 80 jt / 40 jt dari 240 jt", () => {
        const r = calculateFaraidh({ suami: 1, ayah: 1, ibu: 1 }, 240000000);
        expect(r.applied.umariyyah).toBe(true);
        expect(r.applied.aul).toBe(false);
        expect(r.applied.radd).toBe(false);
        expect(find(r, "suami").amount).toBeCloseTo(120000000, 0);
        expect(find(r, "ayah").amount).toBeCloseTo(80000000, 0);
        expect(find(r, "ibu").amount).toBeCloseTo(40000000, 0);
        expect(r.totalShare).toBeCloseTo(1, 10);
    });

    test("suami: 1/3 sisa ibu tampil 1/6, ayah mengambil sisa 2x ibu", () => {
        const r = calculateFaraidh({ suami: 1, ayah: 1, ibu: 1 }, 240000000);
        expect(find(r, "suami").fraction).toEqual({ num: 1, den: 2 });
        expect(find(r, "ibu").fraction).toEqual({ num: 1, den: 6 });
        expect(find(r, "ibu").share).toBeCloseTo(1 / 6, 10);
        expect(find(r, "ayah").fraction).toBeNull();
        expect(find(r, "ayah").isAshabah).toBe(true);
        expect(find(r, "ayah").share).toBeCloseTo(1 / 3, 10);
        expect(find(r, "ayah").share).toBeCloseTo(2 * find(r, "ibu").share, 10);
    });

    test("istri + ayah + ibu: 60 jt / 120 jt / 60 jt dari 240 jt", () => {
        const r = calculateFaraidh({ istri: 1, ayah: 1, ibu: 1 }, 240000000);
        expect(r.applied.umariyyah).toBe(true);
        expect(r.applied.aul).toBe(false);
        expect(r.applied.radd).toBe(false);
        expect(find(r, "istri").amount).toBeCloseTo(60000000, 0);
        expect(find(r, "ayah").amount).toBeCloseTo(120000000, 0);
        expect(find(r, "ibu").amount).toBeCloseTo(60000000, 0);
        expect(r.totalShare).toBeCloseTo(1, 10);
    });

    test("istri: 1/3 sisa ibu tampil 1/4, ayah mengambil sisa 2x ibu", () => {
        const r = calculateFaraidh({ istri: 1, ayah: 1, ibu: 1 }, 240000000);
        expect(find(r, "istri").fraction).toEqual({ num: 1, den: 4 });
        expect(find(r, "ibu").fraction).toEqual({ num: 1, den: 4 });
        expect(find(r, "ibu").share).toBeCloseTo(0.25, 10);
        expect(find(r, "ayah").isAshabah).toBe(true);
        expect(find(r, "ayah").share).toBeCloseTo(0.5, 10);
        expect(find(r, "ayah").share).toBeCloseTo(2 * find(r, "ibu").share, 10);
    });

    test("ibu tidak pernah menerima lebih besar dari ayah", () => {
        [{ suami: 1 }, { istri: 1 }, { istri: 3 }].forEach((spouse) => {
            const r = calculateFaraidh({ ...spouse, ayah: 1, ibu: 1 }, 1000);
            expect(find(r, "ibu").amount).toBeLessThan(find(r, "ayah").amount);
        });
    });

    test("lebih dari satu istri tidak mengubah bagian ibu dan ayah", () => {
        const r = calculateFaraidh({ istri: 2, ayah: 1, ibu: 1 }, 240000000);
        expect(find(r, "istri").count).toBe(2);
        expect(find(r, "istri").amount).toBeCloseTo(60000000, 0);
        expect(find(r, "ibu").amount).toBeCloseTo(60000000, 0);
        expect(find(r, "ayah").amount).toBeCloseTo(120000000, 0);
    });

    test("tanpa pasangan: ibu tetap 1/3 dari seluruh harta", () => {
        const r = calculateFaraidh({ ayah: 1, ibu: 1 }, 240000000);
        expect(r.applied.umariyyah).toBe(false);
        expect(find(r, "ibu").fraction).toEqual({ num: 1, den: 3 });
        expect(find(r, "ibu").amount).toBeCloseTo(80000000, 0);
        expect(find(r, "ayah").amount).toBeCloseTo(160000000, 0);
    });

    test("tanpa ayah: ibu tidak memakai aturan sisa", () => {
        const r = calculateFaraidh({ suami: 1, ibu: 1 }, 240000000);
        expect(r.applied.umariyyah).toBe(false);
        expect(find(r, "ibu").fraction).toEqual({ num: 1, den: 3 });
    });

    test("ada anak: bukan Umariyyatain, ibu 1/6 dan suami 1/4", () => {
        const r = calculateFaraidh(
            { suami: 1, ayah: 1, ibu: 1, anakL: 1 },
            240000000,
        );
        expect(r.applied.umariyyah).toBe(false);
        expect(find(r, "suami").fraction).toEqual({ num: 1, den: 4 });
        expect(find(r, "ibu").fraction).toEqual({ num: 1, den: 6 });
    });

    test("dua saudara atau lebih: tidak ditandai Umariyyatain", () => {
        const r = calculateFaraidh(
            { suami: 1, ayah: 1, ibu: 1, saudaraL: 2 },
            240000000,
        );
        expect(r.applied.umariyyah).toBe(false);
    });

    test("satu saudara yang terhalang ayah tidak membatalkan Umariyyatain", () => {
        const r = calculateFaraidh(
            { suami: 1, ayah: 1, ibu: 1, saudaraL: 1 },
            240000000,
        );
        expect(r.applied.umariyyah).toBe(true);
        expect(find(r, "ibu").amount).toBeCloseTo(40000000, 0);
        expect(find(r, "ayah").amount).toBeCloseTo(80000000, 0);
    });
});

describe("rows that merge several heirs list their members", () => {
    const find = (r, key) => r.rows.find((x) => x.key === key);
    const headCount = (members) =>
        Object.values(members).reduce((sum, value) => sum + value, 0);

    test("Musytarakah row names the mother and every sibling sharing 1/3", () => {
        const r = calculateFaraidh({ suami: 1, ibu: 1, saudaraL: 2 }, 100);
        const row = find(r, "ibu_saudara_musytarakah");
        expect(row.members).toEqual({
            ibu: 1,
            saudaraL: 2,
            saudaraP: 0,
            saudaraSeayahL: 0,
            saudaraSeayahP: 0,
        });
        expect(headCount(row.members)).toBe(row.count);
    });

    test("Musytarakah row leaves out seayah siblings blocked by kandung", () => {
        const r = calculateFaraidh(
            { suami: 1, ibu: 1, saudaraL: 2, saudaraSeayahL: 1 },
            100,
        );
        const row = find(r, "ibu_saudara_musytarakah");
        expect(row.members.saudaraSeayahL).toBe(0);
        expect(headCount(row.members)).toBe(row.count);
    });

    test("saudara seibu row keeps the male and female head counts", () => {
        const r = calculateFaraidh(
            { suami: 1, saudaraSeibuL: 1, saudaraSeibuP: 2 },
            100,
        );
        const row = find(r, "saudara_seibu");
        expect(row.members).toEqual({ saudaraSeibuL: 1, saudaraSeibuP: 2 });
        expect(headCount(row.members)).toBe(row.count);
    });

    test("single-heir rows carry no members", () => {
        const r = calculateFaraidh({ suami: 1, anakL: 1 }, 100);
        r.rows.forEach((row) => expect(row.members).toBeUndefined());
    });
});
