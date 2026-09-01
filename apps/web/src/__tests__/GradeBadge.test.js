import { render, screen } from "@testing-library/react";
import GradeBadge, { HadithAuthenticity } from "@/components/GradeBadge";

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k }),
}));

describe("GradeBadge", () => {
    const grades = [
        ["shahih", "Shahih"],
        ["shahih_lighairihi", "Shahih Lighairihi"],
        ["hasan", "Hasan"],
        ["hasan_lighairihi", "Hasan Lighairihi"],
        ["hasan_shahih", "Hasan Shahih"],
        ["dhaif", "Dha'if"],
        ["dhaif_jiddan", "Dha'if Jiddan"],
        ["munkar", "Munkar"],
        ["maudhu", "Maudhu'"],
        ["matruk", "Matruk"],
        ["majhul", "Majhul"],
    ];

    test.each(grades)("renders %s badge with label %s", (grade, label) => {
        const { container } = render(<GradeBadge grade={grade} />);
        expect(screen.getByText(label)).toBeInTheDocument();
        const span = container.querySelector("span");
        expect(span.className).toContain("inline-flex");
    });

    // A missing grade must be stated, not omitted: an absent badge would be
    // indistinguishable from an authenticated hadith.
    test("labels a falsy grade as unverified", () => {
        render(<GradeBadge grade={null} />);
        expect(
            screen.getByText("hadith.grade_unverified"),
        ).toBeInTheDocument();
    });

    test("labels an undefined grade as unverified", () => {
        render(<GradeBadge />);
        expect(
            screen.getByText("hadith.grade_unverified"),
        ).toBeInTheDocument();
    });

    test("labels an unknown grade as unverified", () => {
        render(<GradeBadge grade='unknown_grade' />);
        expect(
            screen.getByText("hadith.grade_unverified"),
        ).toBeInTheDocument();
    });
});

describe("HadithAuthenticity", () => {
    test("states the grade is unverified when no authenticity fields", () => {
        render(<HadithAuthenticity hadith={{}} />);
        expect(screen.getByText("hadith.authenticity")).toBeInTheDocument();
        expect(
            screen.getByText("hadith.grade_unverified"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("hadith.grade_unverified_hint"),
        ).toBeInTheDocument();
    });

    test("renders grade badge and fields", () => {
        const hadith = {
            grade: "shahih",
            shahih_by: "Al-Albani",
            dhaif_by: "some scholar",
            grade_notes: "has some issue",
            sanad: "A -> B -> C",
        };
        render(<HadithAuthenticity hadith={hadith} />);
        expect(screen.getByText("hadith.authenticity")).toBeInTheDocument();
        expect(screen.getByText("Al-Albani")).toBeInTheDocument();
        expect(screen.getByText("some scholar")).toBeInTheDocument();
        expect(screen.getByText("has some issue")).toBeInTheDocument();
        expect(screen.getByText("hadith.sanad_chain")).toBeInTheDocument();
        expect(screen.getByText("A -> B -> C")).toBeInTheDocument();
    });

    test("renders only shahih_by", () => {
        render(
            <HadithAuthenticity
                hadith={{ shahih_by: "Albani", grade: "hasan" }}
            />,
        );
        expect(screen.getByText("Albani")).toBeInTheDocument();
    });
});
