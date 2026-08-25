import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";

function GoogleIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path
                fill="currentColor"
                d="M21.6 12.23c0-.68-.06-1.36-.18-2H12v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.32 3-7.31Z"
                opacity=".9"
            />
            <path
                fill="currentColor"
                d="M12 22c2.7 0 4.97-.89 6.63-2.42l-3.24-2.5c-.9.6-2.06.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H3.05v2.58A10 10 0 0 0 12 22Z"
                opacity=".7"
            />
            <path
                fill="currentColor"
                d="M6.4 13.92a6 6 0 0 1 0-3.84V7.5H3.05a10 10 0 0 0 0 9l3.35-2.58Z"
                opacity=".5"
            />
            <path
                fill="currentColor"
                d="M12 6.06c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.94 9.94 0 0 0 12 2 10 10 0 0 0 3.05 7.5l3.35 2.58c.8-2.36 3-4.02 5.6-4.02Z"
            />
        </svg>
    );
}

export default function AuthMenu({
    user,
    firebaseEnabled,
    authBusy,
    login,
    logout,
    syncNow,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState({});
    const avatarBtnRef = useRef(null);
    const menuRef = useRef(null);

    const positionMenu = useCallback(() => {
        const anchor = avatarBtnRef.current;
        if (!anchor) {
            return;
        }
        const rect = anchor.getBoundingClientRect();
        const menuWidth = 224;
        const gap = 8;
        const left = Math.max(
            8,
            Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
        );
        setMenuStyle({ top: rect.bottom + gap, left });
    }, []);

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }
        positionMenu();

        const handleOutside = (event) => {
            if (
                menuRef.current?.contains(event.target) ||
                avatarBtnRef.current?.contains(event.target)
            ) {
                return;
            }
            setMenuOpen(false);
        };
        const handleKey = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };
        const handleReposition = () => setMenuOpen(false);

        document.addEventListener("click", handleOutside);
        document.addEventListener("keydown", handleKey);
        window.addEventListener("scroll", handleReposition, { passive: true });
        window.addEventListener("resize", handleReposition);

        return () => {
            document.removeEventListener("click", handleOutside);
            document.removeEventListener("keydown", handleKey);
            window.removeEventListener("scroll", handleReposition);
            window.removeEventListener("resize", handleReposition);
        };
    }, [menuOpen, positionMenu]);

    if (!firebaseEnabled) {
        return null;
    }

    if (!user) {
        return (
            <button
                type="button"
                onClick={login}
                disabled={authBusy}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
                <GoogleIcon />
                Sign in with Google
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <p className="hidden max-w-40 truncate font-mono text-sm text-muted-foreground md:block">
                {user.displayName || user.email || "Signed in"}
            </p>
            <button
                ref={avatarBtnRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen((open) => !open);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 transition hover:ring-2 hover:ring-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <img
                    src={
                        user.photoURL ||
                        "https://ui-avatars.com/api/?name=User&background=0f766e&color=fff"
                    }
                    alt="User avatar"
                    className="h-9 w-9 rounded-full object-cover"
                />
            </button>

            {menuOpen && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label="User menu"
                    style={{ top: menuStyle.top, left: menuStyle.left }}
                    className="fixed z-50 w-56 rounded-xl border border-border bg-card p-1.5 shadow-md"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setMenuOpen(false);
                            void syncNow();
                        }}
                        className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Sync</span>
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setMenuOpen(false);
                            void logout();
                        }}
                        className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
}
