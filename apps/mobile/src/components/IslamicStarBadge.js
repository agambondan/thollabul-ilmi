import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const STAR_PATH =
    "M 20.0 2.5 L 25.1 7.8 L 32.4 7.6 L 32.2 14.9 L 37.5 20.0 L 32.2 25.1 L 32.4 32.4 L 25.1 32.2 L 20.0 37.5 L 14.9 32.2 L 7.6 32.4 L 7.8 25.1 L 2.5 20.0 L 7.8 14.9 L 7.6 7.6 L 14.9 7.8 Z";

export function IslamicStarBadge({
    number,
    size = 42,
    stroke = "#C49E63",
    fill = "transparent",
    textColor = "#1E293B",
    strokeWidth = 1.6,
    style,
}) {
    const fontSize = size >= 42 ? 12 : size >= 36 ? 11 : 10;

    return (
        <View
            style={[
                styles.container,
                { height: size, width: size },
                style,
            ]}
        >
            <Svg
                height={size}
                style={StyleSheet.absoluteFill}
                viewBox='0 0 40 40'
                width={size}
            >
                <Path
                    d={STAR_PATH}
                    fill={fill}
                    stroke={stroke}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={strokeWidth}
                />
            </Svg>
            <Text
                style={[
                    styles.text,
                    {
                        color: textColor,
                        fontSize,
                    },
                ]}
            >
                {number}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    text: {
        fontWeight: "900",
        textAlign: "center",
    },
});
