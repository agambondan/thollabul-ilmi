import React, { forwardRef } from "react";
import { StyleSheet, TextInput, View, Text } from "react-native";
import { Search } from "lucide-react-native";
import { colors, radius, spacing, touchTarget, iconStroke } from "../theme";
import { typography } from "../styles/typography";

export const InputField = forwardRef(function InputField(
  {
    variant = "default",
    isDarkTheme = false,
    leadingIcon,
    trailingIcon,
    error,
    helperText,
    label,
    style,
    inputStyle,
    containerStyle,
    placeholderTextColor,
    ...restProps
  },
  ref
) {
  const themeColors = isDarkTheme ? colors.dark : colors.light;
  const isSearch = variant === "search";
  const isMultiline = variant === "multiline";

  const resolvedPlaceholderColor =
    placeholderTextColor || (isDarkTheme ? "#64748b" : "#94a3b8");

  const defaultLeadingIcon = isSearch && !leadingIcon ? (
    <Search
      color={resolvedPlaceholderColor}
      size={18}
      strokeWidth={iconStroke.regular}
    />
  ) : (
    leadingIcon
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, isDarkTheme && styles.labelDark]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          isDarkTheme && styles.containerDark,
          isSearch && styles.searchContainer,
          isMultiline && styles.multilineContainer,
          error && styles.containerError,
          error && isDarkTheme && styles.containerErrorDark,
          style,
        ]}
      >
        {defaultLeadingIcon ? (
          <View style={styles.leadingIconWrap}>{defaultLeadingIcon}</View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={resolvedPlaceholderColor}
          multiline={isMultiline}
          textAlignVertical={isMultiline ? "top" : "center"}
          style={[
            styles.input,
            isDarkTheme && styles.inputDark,
            isMultiline && styles.inputMultiline,
            defaultLeadingIcon && styles.inputWithLeading,
            trailingIcon && styles.inputWithTrailing,
            inputStyle,
          ]}
          {...restProps}
        />
        {trailingIcon ? (
          <View style={styles.trailingIconWrap}>{trailingIcon}</View>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.errorText, isDarkTheme && styles.errorTextDark]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[styles.helperText, isDarkTheme && styles.helperTextDark]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  label: {
    ...typography.smallStrong,
    color: colors.light.ink,
    marginBottom: spacing.xs,
  },
  labelDark: {
    color: colors.dark.ink,
  },
  container: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  containerDark: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
  },
  searchContainer: {
    borderRadius: radius.full,
    backgroundColor: colors.light.surfaceMuted,
    borderColor: colors.light.border,
  },
  multilineContainer: {
    minHeight: 96,
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
  },
  containerError: {
    borderColor: colors.light.danger,
  },
  containerErrorDark: {
    borderColor: colors.dark.danger,
  },
  leadingIconWrap: {
    marginRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  trailingIconWrap: {
    marginLeft: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.light.ink,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  inputDark: {
    color: colors.dark.ink,
  },
  inputMultiline: {
    minHeight: 80,
  },
  inputWithLeading: {
    paddingLeft: 0,
  },
  inputWithTrailing: {
    paddingRight: 0,
  },
  errorText: {
    ...typography.small,
    color: colors.light.danger,
    marginTop: spacing.xs,
  },
  errorTextDark: {
    color: colors.dark.danger,
  },
  helperText: {
    ...typography.small,
    color: colors.light.muted,
    marginTop: spacing.xs,
  },
  helperTextDark: {
    color: colors.dark.muted,
  },
});
