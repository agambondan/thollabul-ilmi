import { render } from "@testing-library/react-native";
import { AppImage } from "../components/AppImage";

describe("AppImage", () => {
    test("renders Image with valid source uri", () => {
        const { getByTestId } = render(
            <AppImage
                accessibilityLabel='Test cover'
                source={{ uri: "https://example.com/pic.jpg" }}
            />,
        );
        const image = getByTestId("app-image");
        expect(image).toBeTruthy();
        expect(image.props.accessibilityLabel).toBe("Test cover");
    });

    test("renders placeholder when source is null", () => {
        const { getByTestId } = render(
            <AppImage
                accessibilityLabel='Empty image'
                source={null}
            />,
        );
        expect(getByTestId("app-image-placeholder")).toBeTruthy();
    });

    test("renders fallbackSource when source uri is invalid", () => {
        const fallback = { uri: "https://example.com/fallback.png" };
        const { getByTestId } = render(
            <AppImage
                accessibilityLabel='Fallback'
                fallbackSource={fallback}
                source={{ uri: "" }}
            />,
        );
        const image = getByTestId("app-image");
        expect(image.props.source).toEqual(fallback);
    });
});
