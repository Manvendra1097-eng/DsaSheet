import ThemeControls from "./ThemeControls.jsx";
import AuthMenu from "./AuthMenu.jsx";

export default function Header({
    theme,
    palette,
    toggleTheme,
    togglePalette,
    auth,
    syncNow,
}) {
    return (
        <header className="sticky top-0 z-30 border-b border-border bg-background">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
                        Striver A2Z
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Build consistency, one problem at a time.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <ThemeControls
                        theme={theme}
                        palette={palette}
                        toggleTheme={toggleTheme}
                        togglePalette={togglePalette}
                    />
                    <AuthMenu
                        user={auth.user}
                        firebaseEnabled={auth.firebaseEnabled}
                        authBusy={auth.authBusy}
                        login={auth.login}
                        logout={auth.logout}
                        syncNow={syncNow}
                    />
                </div>
            </div>
        </header>
    );
}
