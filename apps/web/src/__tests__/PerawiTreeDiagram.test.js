import { render, screen, fireEvent } from "@testing-library/react";
import PerawiTreeDiagram from "@/components/perawi/PerawiTreeDiagram";
import GlobalPerawiTree from "@/components/perawi/GlobalPerawiTree";

const mockCurrentPerawi = {
    id: 1,
    nama_latin: "Imam Malik bin Anas",
    nama_arab: "مَالِكُ بْنُ أَنَسٍ",
    tabaqah: "tabaut_tabiin",
    status: "tsiqah_tsiqah",
    tahun_wafat: 179,
};

const mockGuru = [
    {
        id: 2,
        nama_latin: "Nafi' Maula Ibnu Umar",
        nama_arab: "نَافِعٌ",
        tabaqah: "tabiin",
        status: "tsiqah",
        tahun_wafat: 117,
    },
    {
        id: 3,
        nama_latin: "Ibn Shihab Az-Zuhri",
        nama_arab: "ابْنُ شِهَابٍ الزُّهْرِيُّ",
        tabaqah: "tabiin",
        status: "tsiqah",
        tahun_wafat: 124,
    },
];

const mockMurid = [
    {
        id: 4,
        nama_latin: "Imam Asy-Syafi'i",
        nama_arab: "الشَّافِعِيُّ",
        tabaqah: "tabaqah_5",
        status: "tsiqah_tsiqah",
        tahun_wafat: 204,
    },
];

describe("PerawiTreeDiagram", () => {
    it("renders tree diagram with guru, current perawi, and murid nodes", () => {
        render(
            <PerawiTreeDiagram
                currentPerawi={mockCurrentPerawi}
                guru={mockGuru}
                murid={mockMurid}
                basePath='/perawi'
            />,
        );

        expect(screen.getByText("Imam Malik bin Anas")).toBeInTheDocument();
        expect(screen.getByText("Nafi' Maula Ibnu Umar")).toBeInTheDocument();
        expect(screen.getByText("Imam Asy-Syafi'i")).toBeInTheDocument();
        expect(screen.getByText("Jalur Guru (2)")).toBeInTheDocument();
        expect(screen.getByText("Jalur Murid (1)")).toBeInTheDocument();
    });

    it("toggles between tree diagram and list view", () => {
        render(
            <PerawiTreeDiagram
                currentPerawi={mockCurrentPerawi}
                guru={mockGuru}
                murid={mockMurid}
                basePath='/perawi'
            />,
        );

        const listButton = screen.getByTitle("Tampilan Daftar");
        fireEvent.click(listButton);

        expect(screen.getByText("Guru (2)")).toBeInTheDocument();
        expect(screen.getByText("Murid (1)")).toBeInTheDocument();
    });

    it("returns null if no guru and no murid", () => {
        const { container } = render(
            <PerawiTreeDiagram
                currentPerawi={mockCurrentPerawi}
                guru={[]}
                murid={[]}
                basePath='/perawi'
            />,
        );

        expect(container.firstChild).toBeNull();
    });
});

describe("GlobalPerawiTree", () => {
    it("renders complete sanad tree from Nabi to Aimmah", () => {
        render(<GlobalPerawiTree basePath='/perawi' />);

        expect(screen.getByText(/Pohon Transmisi Sanad Hadis/i)).toBeInTheDocument();
        expect(screen.getByText("Muhammad Rasulullah ﷺ")).toBeInTheDocument();
        expect(screen.getByText("Abu Hurairah")).toBeInTheDocument();
        expect(screen.getByText("Abdullah bin Umar")).toBeInTheDocument();
        expect(screen.getByText("Malik bin Anas")).toBeInTheDocument();
        expect(screen.getByText("Muhammad bin Ismail al-Bukhari")).toBeInTheDocument();
        expect(screen.getByText("Export PNG")).toBeInTheDocument();
    });

    it("filters tree by selected branch", () => {
        render(<GlobalPerawiTree basePath='/perawi' />);

        const abuHurairahTab = screen.getByText("Jalur Abu Hurairah");
        fireEvent.click(abuHurairahTab);

        expect(screen.getByText("Abu Hurairah")).toBeInTheDocument();
        expect(screen.queryByText("Abdullah bin Umar")).not.toBeInTheDocument();
    });

    it("searches and highlights perawi node", () => {
        render(<GlobalPerawiTree basePath='/perawi' />);

        const searchInput = screen.getByPlaceholderText("Cari & sorot perawi...");
        fireEvent.change(searchInput, { target: { value: "Bukhari" } });

        expect(screen.getByText("1")).toBeInTheDocument(); // Match count badge
    });
});
