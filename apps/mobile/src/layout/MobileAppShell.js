import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { ClassicAppShell } from "./ClassicAppShell";
import { WebAppShell } from "./WebAppShell";

export function MobileAppShell(props) {
    const { isWebAppLayout } = useLayoutModePreference();
    const Shell = isWebAppLayout ? WebAppShell : ClassicAppShell;
    return <Shell {...props} />;
}
