import { useEffect } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabBar } from "../components/TabBar";
import { colors } from "../theme";

export function ClassicAppShell({
    activeTab,
    children,
    keyboardVisible,
    onTabChange,
    testID = "classic-app-shell",
}) {
    useEffect(() => {
        StatusBar.setBarStyle("dark-content");
    }, []);

    return (
        <SafeAreaView
            edges={["top", "left", "right"]}
            style={styles.safeArea}
            testID={testID}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
                style={styles.container}
            >
                {children}
            </KeyboardAvoidingView>
            {activeTab === "quran" || keyboardVisible ? null : (
                <TabBar active={activeTab} onChange={onTabChange} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
});
