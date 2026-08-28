import classNames from "classnames";
import {
    Children,
    cloneElement,
    createContext,
    useContext,
    useState,
} from "react";

const SelectContext = createContext();

export const SelectOptionWithLabel = ({
    children,
    id,
    label,
    customDivClassName,
    customSelectClassName,
    customLabelClassName,
    callbackOnChange,
    defaultValue,
    items,
    customItemValue,
    customItemKey,
}) => {
    return (
        <div
            className={classNames(
                customDivClassName === undefined
                    ? "flex flex-col"
                    : customDivClassName,
            )}
        >
            <label
                htmlFor={id}
                className={classNames(
                    customSelectClassName === undefined
                        ? "block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        : customLabelClassName,
                )}
            >
                {label}
            </label>
            <Select
                defaultValue={defaultValue}
                callbackOnChange={callbackOnChange}
                id={id}
                customClassName={customSelectClassName}
            >
                {children}
            </Select>
        </div>
    );
};

const Select = ({
    children,
    id,
    customClassName,
    callbackOnChange,
    defaultValue,
}) => {
    const [activeOption, setActiveOption] = useState("");
    return (
        <SelectContext.Provider value={{ activeOption, setActiveOption }}>
            <select
                value={defaultValue}
                id={id}
                onChange={callbackOnChange}
                className={classNames(customClassName, {
                    "w-full p-2.5 rounded-lg block": true,
                    "border border-gray-300 dark:border-gray-600": true,
                    "bg-gray-50 dark:bg-gray-700": true,
                    "text-gray-900 text-sm dark:text-white": true,
                    "dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500": true,
                })}
            >
                {Children.map(children, (child) => {
                    return cloneElement(child, { key: child.props.value });
                })}
            </select>
        </SelectContext.Provider>
    );
};

export default Select;

const Option = ({ value, children, customClassName }) => {
    const { activeOption, setActiveOption } = UseSelectContext();

    const isActive = activeOption === value;

    return (
        <option
            className={classNames(customClassName, "p-4", {
                "bg-gray-600 dark:bg-gray-300": isActive,
                "bg-white dark:bg-gray-600": !isActive,
            })}
            key={value}
            value={value}
            onClick={() => {
                setActiveOption(value);
            }}
        >
            {children}
        </option>
    );
};

Select.Option = Option;

const UseSelectContext = () => {
    const context = useContext(SelectContext);

    if (!context) {
        throw new Error(
            "UseSelectContext should be used within the scope of a Select Component",
        );
    }

    return context;
};
