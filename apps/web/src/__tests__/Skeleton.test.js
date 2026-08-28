import { render } from "@testing-library/react";
import {
    SkeletonBlock,
    SkeletonNavbar,
    SkeletonProfile,
    SkeletonList,
    SkeletonCards,
    SkeletonStats,
    SkeletonHafalan,
    SkeletonReader,
    SkeletonInline,
    SkeletonInlineCards,
} from "@/components/skeleton/Skeleton";

describe("SkeletonBlock", () => {
    test("renders with animate-pulse class", () => {
        const { container } = render(<SkeletonBlock />);
        const div = container.firstChild;
        expect(div.className).toContain("animate-pulse");
        expect(div.className).toContain("rounded");
    });

    test("applies custom className", () => {
        const { container } = render(<SkeletonBlock className='h-10 w-full' />);
        const div = container.firstChild;
        expect(div.className).toContain("h-10");
        expect(div.className).toContain("w-full");
    });
});

describe("SkeletonNavbar", () => {
    test("renders navbar skeleton", () => {
        const { container } = render(<SkeletonNavbar />);
        const navbar = container.firstChild;
        expect(navbar.className).toContain("fixed");
        expect(navbar.className).toContain("top-0");
        expect(navbar.className).toContain("z-50");
    });
});

describe("SkeletonList", () => {
    test("renders default number of rows", () => {
        const { container } = render(<SkeletonList />);
        const rows = container.querySelectorAll(".rounded-xl.border");
        expect(rows.length).toBe(6);
    });

    test("renders custom number of rows", () => {
        const { container } = render(<SkeletonList rows={3} />);
        const rows = container.querySelectorAll(".rounded-xl.border");
        expect(rows.length).toBe(3);
    });

    test("hides title when title=false", () => {
        const { container } = render(<SkeletonList title={false} />);
        const fullRounded = container.querySelectorAll(".rounded-full");
        expect(fullRounded.length).toBe(2);
    });
});

describe("SkeletonCards", () => {
    test("renders correct number of cards", () => {
        const { container } = render(<SkeletonCards cols={2} rows={2} />);
        const cards = container.querySelectorAll(".rounded-xl:not(.border)");
        expect(cards.length).toBe(4);
    });
});

describe("SkeletonInline", () => {
    test("renders default 4 rows", () => {
        const { container } = render(<SkeletonInline />);
        const rows = container.querySelectorAll(".rounded-xl.border");
        expect(rows.length).toBe(4);
    });
});

describe("SkeletonInlineCards", () => {
    test("renders correct grid", () => {
        const { container } = render(<SkeletonInlineCards cols={2} rows={3} />);
        const cards = container.querySelectorAll(".rounded-xl");
        expect(cards.length).toBe(6);
    });
});

describe("SkeletonProfile", () => {
    test("renders profile skeleton", () => {
        const { container } = render(<SkeletonProfile />);
        expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });
});

describe("SkeletonStats", () => {
    test("renders stats skeleton", () => {
        const { container } = render(<SkeletonStats />);
        expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });
});

describe("SkeletonHafalan", () => {
    test("renders hafalan skeleton", () => {
        const { container } = render(<SkeletonHafalan />);
        expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });
});

describe("SkeletonReader", () => {
    test("renders reader skeleton", () => {
        const { container } = render(<SkeletonReader />);
        expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });
});
