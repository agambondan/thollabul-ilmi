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
        <div className='flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0'>
            {controlId ? (
                <label
                    htmlFor={controlId}
                    className='text-sm text-gray-700 dark:text-gray-300 font-medium'
                >
                    {label}
                </label>
            ) : (
                <span className='text-sm text-gray-700 dark:text-gray-300 font-medium'>
                    {label}
                </span>
            )}
            <div className='flex items-center'>{boundChildren}</div>
        </div>
    );
}
