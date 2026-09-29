import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { typography } from "../styles/typography";
import { InputField } from "../components/InputField";

describe("typography tokens", () => {
  test("defines all standard Latin type scale levels", () => {
    expect(typography.display.fontSize).toBe(32);
    expect(typography.display.lineHeight).toBe(40);
    expect(typography.h1.fontSize).toBe(24);
    expect(typography.h1.lineHeight).toBe(32);
    expect(typography.h2.fontSize).toBe(20);
    expect(typography.h2.lineHeight).toBe(28);
    expect(typography.h3.fontSize).toBe(18);
    expect(typography.h3.lineHeight).toBe(26);
    expect(typography.body.fontSize).toBe(14);
    expect(typography.body.lineHeight).toBe(20);
    expect(typography.bodyStrong.fontWeight).toBe("600");
    expect(typography.small.fontSize).toBe(12);
    expect(typography.small.lineHeight).toBe(18);
    expect(typography.smallStrong.fontWeight).toBe("600");
    expect(typography.micro.fontSize).toBe(10);
    expect(typography.micro.lineHeight).toBe(14);
    expect(typography.button.fontSize).toBe(14);
    expect(typography.input.fontSize).toBe(14);
  });

  test("merge helper combines base styles with custom overrides", () => {
    const custom = typography.merge(typography.h1, { color: "#ff0000" });
    expect(custom.fontSize).toBe(24);
    expect(custom.color).toBe("#ff0000");
  });
});

describe("InputField component", () => {
  test("renders basic text input with placeholder", () => {
    const { getByPlaceholderText } = render(
      <InputField placeholder="Cari nama kitab..." />
    );
    expect(getByPlaceholderText("Cari nama kitab...")).toBeTruthy();
  });

  test("renders label and helper text", () => {
    const { getByText } = render(
      <InputField label="Nama Kitab" helperText="Gunakan ejaan standar" />
    );
    expect(getByText("Nama Kitab")).toBeTruthy();
    expect(getByText("Gunakan ejaan standar")).toBeTruthy();
  });

  test("renders error message when error prop provided", () => {
    const { getByText, queryByText } = render(
      <InputField
        label="Password"
        helperText="Minimal 8 karakter"
        error="Password wajib diisi"
      />
    );
    expect(getByText("Password wajib diisi")).toBeTruthy();
    expect(queryByText("Minimal 8 karakter")).toBeNull();
  });

  test("supports dark theme styling without crash", () => {
    const { getByPlaceholderText, getByText } = render(
      <InputField
        isDarkTheme={true}
        label="Pencarian"
        placeholder="Ketik kata kunci..."
      />
    );
    expect(getByPlaceholderText("Ketik kata kunci...")).toBeTruthy();
    expect(getByText("Pencarian")).toBeTruthy();
  });

  test("supports multiline variant", () => {
    const { getByPlaceholderText } = render(
      <InputField
        variant="multiline"
        placeholder="Tulis catatan belajar..."
      />
    );
    expect(getByPlaceholderText("Tulis catatan belajar...")).toBeTruthy();
  });

  test("handles text changes via onChangeText", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Masukkan email"
        onChangeText={onChangeText}
      />
    );
    fireEvent.changeText(getByPlaceholderText("Masukkan email"), "user@test.com");
    expect(onChangeText).toHaveBeenCalledWith("user@test.com");
  });
});
