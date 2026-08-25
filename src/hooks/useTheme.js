import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "dsa_theme_preference";
const PALETTE_KEY = "dsa_palette_preference";

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") {
        return stored;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function getPreferredPalette() {
    return localStorage.getItem(PALETTE_KEY) === "orange" ? "orange" : "amber";
}

export function useTheme() {
    const [theme, setThemeState] = useState(getPreferredTheme);
    const [palette, setPaletteState] = useState(getPreferredPalette);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute("data-palette", palette);
    }, [palette]);

    const setTheme = useCallback((next) => {
        localStorage.setItem(THEME_KEY, next);
        setThemeState(next);
    }, []);

    const setPalette = useCallback((next) => {
        localStorage.setItem(PALETTE_KEY, next);
        setPaletteState(next);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [theme, setTheme]);

    const togglePalette = useCallback(() => {
        setPalette(palette === "amber" ? "orange" : "amber");
    }, [palette, setPalette]);

    return { theme, palette, toggleTheme, togglePalette };
}
