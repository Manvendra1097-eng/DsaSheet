import { Moon, Palette, Sun } from "lucide-react";

export default function ThemeControls({
    theme,
    palette,
    toggleTheme,
    togglePalette,
}) {
    const isDark = theme === "dark";

    return (
        <>
            <button
                type="button"
                onClick={togglePalette}
                title="Switch color palette"
                aria-label={`Switch color palette (currently ${palette})`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
                <Palette className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={toggleTheme}
                title="Toggle theme"
                aria-pressed={isDark}
                aria-label={
                    isDark ? "Switch to light theme" : "Switch to dark theme"
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
                {isDark ? (
                    <Sun className="h-4 w-4" />
                ) : (
                    <Moon className="h-4 w-4" />
                )}
            </button>
        </>
    );
}
