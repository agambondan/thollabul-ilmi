import { Children, cloneElement, isValidElement, useId } from "react";

const CONTROLS = new Set(["input", "select", "textarea"]);

/**
 * Row label + control. The label is bound to the control with htmlFor/id so
 * screen readers announce the setting's name and clicking the text focuses the
 * control — previously the text was a plain <span> with no association.
 */
export default function SettingRow({ label, children }) {
    const generatedId = useId();
    let controlId = null;

    const boundChildren = Children.map(children, (child) => {
        if (!isValidElement(child) || !CONTROLS.has(child.type)) return child;
        if (child.props.id) {
            controlId = controlId ?? child.props.id;
            return child;
        }
        if (controlId) return child;
        controlId = generatedId;
        return cloneElement(child, { id: generatedId });
    });

    return (
        <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-1.5 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0'>
            {controlId ? (
                <label
                    htmlFor={controlId}
                    className='text-sm text-gray-700 dark:text-gray-300 font-medium sm:flex-shrink-0'
                >
                    {label}
                </label>
            ) : (
                <span className='text-sm text-gray-700 dark:text-gray-300 font-medium sm:flex-shrink-0'>
                    {label}
                </span>
            )}
            <div className='flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:w-auto sm:flex-1 sm:justify-end sm:min-w-0'>
                {boundChildren}
            </div>
        </div>
    );
}
