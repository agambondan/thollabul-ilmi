"use client";

import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";

const SettingButton = dynamic(() => import("@/components/popup/SettingButton"), {
    ssr: false,
});
const PwaInstallNotice = dynamic(
    () => import("@/components/PwaInstallNotice"),
    { ssr: false },
);
const NotificationPermissionPrompt = dynamic(
    () => import("@/components/NotificationPermissionPrompt"),
    { ssr: false },
);
const InAppNotification = dynamic(
    () => import("@/components/InAppNotification"),
    { ssr: false },
);

export default function FloatingOverlays() {
    return (
        <>
            <SettingButton />
            <PwaInstallNotice />
            <NotificationPermissionPrompt />
            <Toaster
                position='top-right'
                toastOptions={{
                    duration: 5000,
                    className: "app-toast",
                    style: {
                        borderRadius: "12px",
                        background: "var(--toast-bg)",
                        color: "var(--toast-fg)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.16)",
                    },
                }}
            />
            <InAppNotification />
        </>
    );
}
