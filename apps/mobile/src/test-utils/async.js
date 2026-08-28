import { act } from "@testing-library/react-native";

export const flushAsyncWork = async (cycles = 4) => {
    for (let index = 0; index < cycles; index += 1) {
        await act(async () => {
            await Promise.resolve();
        });
    }
};
