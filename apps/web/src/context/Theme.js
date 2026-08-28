import { createContext, useContext, useState } from "react";

export const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
    const [theme, SetTheme] = useState("");
    return (
        <ThemeContext.Provider value={{ theme, SetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;

export const UseThemeContext = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "UseThemeContext should be used within the scope of a Theme Component",
        );
    }

    return context;
};
