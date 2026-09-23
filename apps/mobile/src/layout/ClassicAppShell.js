import { useEffect } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabBar } from "../components/TabBar";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { getClassicThemeColors } from "../theme";

export function ClassicAppShell({
    activeTab,
    children,
    keyboardVisible,
    onTabChange,
    testID = "classic-app-shell",
}) {
    const { isDarkTheme } = useLayoutModePreference();
    const classicTheme = getClassicThemeColors(isDarkTheme);

    useEffect(() => {
        StatusBar.setBarStyle(isDarkTheme ? "light-content" : "dark-content");
    }, [isDarkTheme]);

    return (
        <SafeAreaView
            edges={["top", "left", "right"]}
            style={[styles.safeArea, { backgroundColor: classicTheme.bg }]}
            testID={testID}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
                style={[styles.container, { backgroundColor: classicTheme.bg }]}
            >
                {children}
            </KeyboardAvoidingView>
            {activeTab === "quran" || keyboardVisible ? null : (
                <TabBar active={activeTab} isDarkTheme={isDarkTheme} onChange={onTabChange} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
});
