import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function AppImage({
    accessibilityLabel,
    fallbackSource,
    source,
    style,
    testID = "app-image",
    ...rest
}) {
    const [hasError, setHasError] = useState(false);

    const uri = typeof source === "object" ? source?.uri : null;
    if (!source || (uri !== undefined && !uri) || hasError) {
        if (fallbackSource) {
            return (
                <Image
                    accessibilityIgnoresInvertColors
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole='image'
                    source={fallbackSource}
                    style={style}
                    testID={testID}
                    {...rest}
                />
            );
        }
        return (
            <View
                accessibilityLabel={accessibilityLabel}
                accessibilityRole='image'
                style={[styles.placeholder, style]}
                testID={`${testID}-placeholder`}
            />
        );
    }

    return (
        <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={accessibilityLabel}
            accessibilityRole='image'
            onError={() => setHasError(true)}
            source={source}
            style={style}
            testID={testID}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: colors.surfaceMuted ?? "#f1f5f9",
    },
});
