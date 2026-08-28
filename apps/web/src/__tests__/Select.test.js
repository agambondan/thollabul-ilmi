import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Select, { SelectOptionWithLabel } from "@/components/select/Select";

describe("Select", () => {
    test("renders options", () => {
        render(
            <Select>
                <Select.Option value='a'>Option A</Select.Option>
                <Select.Option value='b'>Option B</Select.Option>
            </Select>,
        );
        expect(screen.getByText("Option A")).toBeInTheDocument();
        expect(screen.getByText("Option B")).toBeInTheDocument();
    });

    test("calls callbackOnChange when option selected", async () => {
        const onChange = jest.fn();
        render(
            <Select callbackOnChange={onChange}>
                <Select.Option value='a'>Option A</Select.Option>
                <Select.Option value='b'>Option B</Select.Option>
            </Select>,
        );
        const select = screen.getByRole("combobox");
        await userEvent.selectOptions(select, "b");
        expect(onChange).toHaveBeenCalled();
    });

    test("renders with custom id", () => {
        render(
            <Select id='my-select'>
                <Select.Option value='x'>X</Select.Option>
            </Select>,
        );
        expect(screen.getByRole("combobox").id).toBe("my-select");
    });

    test("renders select tag", () => {
        const { container } = render(
            <Select>
                <Select.Option value='a'>A</Select.Option>
            </Select>,
        );
        expect(container.querySelector("select")).toBeInTheDocument();
    });
});

describe("SelectOptionWithLabel", () => {
    test("renders label and options", () => {
        render(
            <SelectOptionWithLabel label='Pilih' id='test'>
                <Select.Option value='1'>Satu</Select.Option>
            </SelectOptionWithLabel>,
        );
        expect(screen.getByText("Pilih")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
});
