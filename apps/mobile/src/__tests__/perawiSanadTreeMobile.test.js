import { fireEvent, render } from "@testing-library/react-native";
import { PerawiSanadTreeMobile } from "../screens/explore/PerawiSanadTreeMobile";

jest.mock("lucide-react-native", () => ({
    Users: "Users",
    HelpCircle: "HelpCircle",
}));

describe("PerawiSanadTreeMobile", () => {
    it("renders sanad tree heading and root node", () => {
        const onOpen = jest.fn();
        const { getByText, getAllByText } = render(
            <PerawiSanadTreeMobile onOpenPerawi={onOpen} />,
        );

        expect(getByText("Bagan Silsilah Sanad (40 Perawi)")).toBeTruthy();
        expect(getByText("Muhammad Rasulullah ﷺ")).toBeTruthy();
        expect(getAllByText("Abdullah bin Umar").length).toBeGreaterThan(0);
        expect(getAllByText("Abu Hurairah").length).toBeGreaterThan(0);
    });

    it("filters tree branch when filter chip pressed", () => {
        const onOpen = jest.fn();
        const { getByText, getAllByText, queryByText } = render(
            <PerawiSanadTreeMobile onOpenPerawi={onOpen} />,
        );

        const filterChip = getAllByText("Abu Hurairah")[0];
        fireEvent.press(filterChip);

        expect(getAllByText("Abu Hurairah").length).toBeGreaterThan(0);
        expect(queryByText("Abdullah bin Umar")).toBeNull();
    });

    it("calls onOpenPerawi when node card is pressed", () => {
        const onOpen = jest.fn();
        const { getAllByText } = render(
            <PerawiSanadTreeMobile onOpenPerawi={onOpen} />,
        );

        const card = getAllByText("Abu Hurairah")[1];
        fireEvent.press(card);
        expect(onOpen).toHaveBeenCalledWith(
            expect.objectContaining({ nama_latin: "Abu Hurairah" }),
        );
    });
});
