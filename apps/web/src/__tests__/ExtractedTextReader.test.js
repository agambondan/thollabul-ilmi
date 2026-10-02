import { render, screen, fireEvent } from "@testing-library/react";
import ExtractedTextReader from "../components/library/ExtractedTextReader";

describe("ExtractedTextReader", () => {
    const sampleText = `DOSA-DOSA BESAR
Dosa-dosa besar adalah apa yang dilarang oleh Allah dan Rasul-Nya.
"Jika kamu menjauhi dosa-dosa besar, niscaya Kami hapus kesalahanmu." (An-Nisa: 31)

1. Syirik
2. Sihir`;

    test("renders document mode by default with headings and blockquotes", () => {
        render(
            <ExtractedTextReader
                text={sampleText}
                pageNumber={7}
                bookTitle="Al-Kaba'ir"
                fontSize={16}
                fontFamily="serif"
                viewMode="doc"
            />,
        );

        expect(screen.getByText("DOSA-DOSA BESAR")).toBeInTheDocument();
        expect(screen.getByText("Dokumen Rapi")).toBeInTheDocument();
        expect(screen.getByText("Markdown")).toBeInTheDocument();
        expect(screen.getByText("Teks Asli")).toBeInTheDocument();
        expect(screen.getByText(/Syirik/)).toBeInTheDocument();
    });

    test("switches to markdown mode and renders formatted markdown text", () => {
        const handleViewModeChange = jest.fn();
        const { rerender } = render(
            <ExtractedTextReader
                text={sampleText}
                pageNumber={7}
                bookTitle="Al-Kaba'ir"
                viewMode="doc"
                onViewModeChange={handleViewModeChange}
            />,
        );

        fireEvent.click(screen.getByText("Markdown"));
        expect(handleViewModeChange).toHaveBeenCalledWith("markdown");

        rerender(
            <ExtractedTextReader
                text={sampleText}
                pageNumber={7}
                bookTitle="Al-Kaba'ir"
                viewMode="markdown"
                onViewModeChange={handleViewModeChange}
            />,
        );

        expect(screen.getByText(/## DOSA-DOSA BESAR/)).toBeInTheDocument();
    });

    test("switches to raw mode and renders original text", () => {
        render(
            <ExtractedTextReader
                text={sampleText}
                pageNumber={7}
                bookTitle="Al-Kaba'ir"
                viewMode="raw"
            />,
        );

        expect(screen.getByText(/DOSA-DOSA BESAR/)).toBeInTheDocument();
        expect(screen.getByText(/Sihir/)).toBeInTheDocument();
    });

    test("handles full width toggle and shows reading statistics", () => {
        const handleFullWidthChange = jest.fn();
        render(
            <ExtractedTextReader
                text={sampleText}
                pageNumber={7}
                totalPages={313}
                bookTitle="Al-Kaba'ir"
                viewMode="raw"
                isFullWidth={false}
                onFullWidthChange={handleFullWidthChange}
            />,
        );

        expect(screen.getByText(/Halaman 7 dari 313/)).toBeInTheDocument();
        expect(screen.getByText(/kata/)).toBeInTheDocument();

        const fullWidthBtn = screen.getByTitle(/Mode Lebar Penuh/);
        fireEvent.click(fullWidthBtn);
        expect(handleFullWidthChange).toHaveBeenCalledWith(true);
    });

    test("switches paper theme to sepia and dark", () => {
        const { container } = render(
            <ExtractedTextReader
                text={sampleText}
                pageNumber={7}
                bookTitle="Al-Kaba'ir"
                viewMode="doc"
            />,
        );

        const sepiaBtn = screen.getByTitle(/Tema Kertas Sepia/);
        fireEvent.click(sepiaBtn);
        expect(container.querySelector(".bg-\\[\\#faf6ee\\]")).toBeInTheDocument();

        const darkBtn = screen.getByTitle(/Tema Gelap/);
        fireEvent.click(darkBtn);
        expect(container.querySelector(".bg-slate-950")).toBeInTheDocument();
    });
});
