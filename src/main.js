import STRIVERS_SHEET from "../StriverDSASheet.js";
import {
    getProgressMap,
    setProgressMap,
    updateProblemProgress,
} from "./storage/local.js";
import {
    isFirebaseEnabled,
    observeAuthState,
    getCurrentAuthUser,
    waitForAuthReady,
    signInWithGoogle,
    consumeRedirectResult,
    signOutCurrentUser,
    pullRemoteProgressByUid,
    pushRemoteProgressByUid,
    authErrorToMessage,
} from "./storage/firebase.js";

const state = {
    user: null,
    authBusy: false,
    lastAuthError: "",
    progressMap: getProgressMap("guest"),
    activeStepNo: null,
    filters: {
        search: "",
        topic: "all",
        difficulty: "all",
        status: "all",
    },
    problemsById: {},
};

const LOGIN_ATTEMPT_KEY = "dsa_login_attempt_in_progress";
const THEME_KEY = "dsa_theme_preference";

function getPreferredTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    const isDark = theme === "dark";

    elements.themeIconMoon?.classList.toggle("is-hidden", isDark);
    elements.themeIconSun?.classList.toggle("is-hidden", !isDark);

    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.setAttribute("aria-pressed", String(isDark));
        elements.themeToggleBtn.setAttribute(
            "aria-label",
            isDark ? "Switch to light theme" : "Switch to dark theme",
        );
    }
}

function positionUserMenu() {
    if (!elements.userMenu || !elements.avatarMenuBtn) {
        return;
    }

    const anchorRect = elements.avatarMenuBtn.getBoundingClientRect();
    const menuWidth = elements.userMenu.offsetWidth || 224;
    const gap = 8;
    const left = Math.max(
        8,
        Math.min(
            anchorRect.right - menuWidth,
            window.innerWidth - menuWidth - 8,
        ),
    );

    elements.userMenu.style.top = `${anchorRect.bottom + gap}px`;
    elements.userMenu.style.left = `${left}px`;
}

function closeUserMenu() {
    if (!elements.userMenu || !elements.avatarMenuBtn) {
        return;
    }

    elements.userMenu.classList.add(
        "pointer-events-none",
        "opacity-0",
        "scale-95",
    );
    elements.userMenu.classList.remove("opacity-100", "scale-100");
    elements.avatarMenuBtn.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
        if (elements.userMenu?.classList.contains("opacity-0")) {
            elements.userMenu.classList.add("is-hidden");
        }
    }, 150);
}

function openUserMenu() {
    if (!elements.userMenu || !elements.avatarMenuBtn) {
        return;
    }

    elements.userMenu.classList.remove("is-hidden");
    positionUserMenu();
    requestAnimationFrame(() => {
        elements.userMenu.classList.remove(
            "pointer-events-none",
            "opacity-0",
            "scale-95",
        );
        elements.userMenu.classList.add("opacity-100", "scale-100");
    });
    elements.avatarMenuBtn.setAttribute("aria-expanded", "true");
}

function toggleUserMenu() {
    if (!elements.userMenu) {
        return;
    }

    const isOpen = !elements.userMenu.classList.contains("is-hidden");
    if (isOpen) {
        closeUserMenu();
    } else {
        openUserMenu();
    }
}

function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCurrentUserWithRetry({
    maxWaitMs = 6000,
    intervalMs = 300,
} = {}) {
    const deadline = Date.now() + maxWaitMs;
    let user = getCurrentAuthUser();

    while (!user && Date.now() < deadline) {
        await delay(intervalMs);
        user = getCurrentAuthUser();
    }

    return user;
}

const elements = {
    themeToggleBtn: document.querySelector("#themeToggleBtn"),
    themeIconMoon: document.querySelector("#themeIconMoon"),
    themeIconSun: document.querySelector("#themeIconSun"),
    guestAuth: document.querySelector("#guestAuth"),
    userAuth: document.querySelector("#userAuth"),
    avatarMenuBtn: document.querySelector("#avatarMenuBtn"),
    userMenu: document.querySelector("#userMenu"),
    loginBtn: document.querySelector("#loginBtn"),
    logoutBtn: document.querySelector("#logoutBtn"),
    syncNowBtn: document.querySelector("#syncNowBtn"),
    userName: document.querySelector("#userName"),
    userAvatar: document.querySelector("#userAvatar"),
    syncStatusDot: document.querySelector("#syncStatusDot"),
    syncStatusText: document.querySelector("#syncStatusText"),
    statsGrid: document.querySelector("#statsGrid"),
    searchInput: document.querySelector("#searchInput"),
    topicFilter: document.querySelector("#topicFilter"),
    difficultyFilter: document.querySelector("#difficultyFilter"),
    statusFilter: document.querySelector("#statusFilter"),
    stepsContainer: document.querySelector("#stepsContainer"),
};

function normalizeSheet(rawSheet) {
    const problemsById = {};

    const normalized = rawSheet.map((step, stepIdx) => {
        const normalizedSubSteps = step.subSteps.map((subStep, subIdx) => {
            const normalizedProblems = subStep.problems.map(
                (problem, problemIdx) => {
                    const id = `s${step.stepNo}_ss${subStep.subStepNo}_p${problemIdx}`;
                    const normalizedProblem = {
                        ...problem,
                        id,
                        stepNo: step.stepNo,
                        subStepNo: subStep.subStepNo,
                        titleText: String(problem.title || "Untitled Problem"),
                        difficultyText: String(problem.difficulty || "Easy"),
                    };

                    problemsById[id] = normalizedProblem;
                    return normalizedProblem;
                },
            );

            return {
                ...subStep,
                subStepId: `s${stepIdx}_ss${subIdx}`,
                problems: normalizedProblems,
            };
        });

        return {
            ...step,
            stepId: `step_${stepIdx}`,
            subSteps: normalizedSubSteps,
        };
    });

    state.problemsById = problemsById;
    return normalized;
}

const normalizedSheet = normalizeSheet(STRIVERS_SHEET);

function renderTopicOptions() {
    const options = normalizedSheet
        .map(
            (step) =>
                `<option value="${step.stepNo}">Step ${step.stepNo}: ${escapeHtml(step.stepTitle)}</option>`,
        )
        .join("");
    elements.topicFilter.insertAdjacentHTML("beforeend", options);
}

function getScopeId() {
    return state.user?.uid || "guest";
}

function getProblemProgress(problemId) {
    return (
        state.progressMap[problemId] || {
            status: "not-started",
            notes: "",
            updatedAt: 0,
        }
    );
}

const SYNC_DOT_CLASS = {
    success: "h-2 w-2 shrink-0 rounded-full bg-emerald-500",
    error: "h-2 w-2 shrink-0 rounded-full bg-rose-500",
    pending: "h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse",
    neutral: "h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50",
};

function classifySyncStatus(text) {
    const lower = text.toLowerCase();
    if (/fail|error|cancelled|blocked|invalid|not restored/.test(lower)) {
        return "error";
    }
    if (/synced|successful|complete/.test(lower)) {
        return "success";
    }
    if (/pulling|pushing|opening|continuing/.test(lower)) {
        return "pending";
    }
    return "neutral";
}

function setSyncStatus(text) {
    if (elements.syncStatusText) {
        elements.syncStatusText.textContent = text;
    }
    if (elements.syncStatusDot) {
        elements.syncStatusDot.className =
            SYNC_DOT_CLASS[classifySyncStatus(text)];
    }
}

function mergeProgressMaps(localMap, remoteMap) {
    const merged = { ...localMap };
    for (const [problemId, remoteProgress] of Object.entries(remoteMap || {})) {
        const localProgress = merged[problemId];
        if (
            !localProgress ||
            (remoteProgress.updatedAt || 0) > (localProgress.updatedAt || 0)
        ) {
            merged[problemId] = remoteProgress;
        }
    }
    return merged;
}

function getStatusCounts() {
    const allProblems = Object.values(state.problemsById);
    let solved = 0;
    let attempted = 0;

    for (const problem of allProblems) {
        const progress = getProblemProgress(problem.id);
        if (progress.status === "solved") {
            solved += 1;
        } else if (progress.status === "attempted") {
            attempted += 1;
        }
    }

    const total = allProblems.length;
    const solvedPercent = total ? Math.round((solved * 100) / total) : 0;

    return { total, solved, attempted, solvedPercent };
}

function renderStats() {
    const stats = getStatusCounts();
    elements.statsGrid.innerHTML = [
        statCard("Total Problems", String(stats.total)),
        statCard("Solved", String(stats.solved)),
        statCard("Attempted", String(stats.attempted)),
        statCard("Solved %", `${stats.solvedPercent}%`),
    ].join("");
}

function renderAuthState() {
    if (!isFirebaseEnabled()) {
        if (elements.guestAuth) {
            elements.guestAuth.classList.remove("is-hidden");
        }
        if (elements.userAuth) {
            elements.userAuth.classList.add("is-hidden");
        }
        elements.loginBtn.disabled = true;
        elements.logoutBtn.disabled = true;
        elements.syncNowBtn.disabled = true;
        setSyncStatus("local only (set Firebase config)");
        return;
    }

    const signedIn = Boolean(state.user);

    if (elements.guestAuth) {
        elements.guestAuth.classList.toggle("is-hidden", signedIn);
    }
    if (elements.userAuth) {
        elements.userAuth.classList.toggle("is-hidden", !signedIn);
    }

    if (signedIn) {
        state.lastAuthError = "";
        elements.userName.textContent =
            state.user.displayName || state.user.email || "Signed in";
        elements.userAvatar.src =
            state.user.photoURL ||
            "https://ui-avatars.com/api/?name=User&background=0f766e&color=fff";
    } else {
        elements.userName.textContent = "";
        elements.userAvatar.src = "";
        closeUserMenu();
    }

    elements.loginBtn.disabled = signedIn;
    elements.logoutBtn.disabled = !signedIn;
    elements.syncNowBtn.disabled = !signedIn;

    if (state.authBusy && !signedIn) {
        elements.loginBtn.disabled = true;
    }

    if (!signedIn && state.lastAuthError) {
        setSyncStatus(state.lastAuthError);
    } else if (!signedIn) {
        setSyncStatus("login required for cloud sync");
    } else {
        setSyncStatus("signed in");
    }
}

function statCard(label, value) {
    return `<article class="rounded-xl border border-border/70 bg-card/80 p-4 shadow-glass backdrop-blur"><p class="text-xs text-muted-foreground">${label}</p><p class="mt-1 text-2xl font-extrabold tracking-tight">${value}</p></article>`;
}

function problemMatchesFilters(problem) {
    const progress = getProblemProgress(problem.id);
    const matchesSearch = problem.titleText
        .toLowerCase()
        .includes(state.filters.search.toLowerCase());
    const matchesDifficulty =
        state.filters.difficulty === "all" ||
        problem.difficultyText === state.filters.difficulty;
    const matchesStatus =
        state.filters.status === "all" ||
        progress.status === state.filters.status;

    return matchesSearch && matchesDifficulty && matchesStatus;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeLink(rawLink) {
    if (!rawLink) {
        return null;
    }

    if (typeof rawLink === "string") {
        return rawLink;
    }

    if (typeof rawLink === "object") {
        const firstString = Object.values(rawLink).find(
            (value) => typeof value === "string" && value.trim(),
        );
        return firstString || null;
    }

    return null;
}

function renderSheet() {
    const html = normalizedSheet
        .map((step) => {
            if (
                state.filters.topic !== "all" &&
                String(step.stepNo) !== state.filters.topic
            ) {
                return "";
            }

            const allStepProblems = step.subSteps.flatMap(
                (subStep) => subStep.problems,
            );
            const solvedInStep = allStepProblems.filter(
                (problem) => getProblemProgress(problem.id).status === "solved",
            ).length;

            const subStepHtml = step.subSteps
                .map((subStep) => {
                    const filtered = subStep.problems.filter(
                        problemMatchesFilters,
                    );
                    if (!filtered.length) {
                        return "";
                    }

                    const problemsHtml = filtered
                        .map((problem) => {
                            const progress = getProblemProgress(problem.id);
                            const difficultyClass = (
                                problem.difficultyText || "easy"
                            ).toLowerCase();
                            const lcLink = normalizeLink(problem.lcLink);
                            const gfgLink = normalizeLink(problem.gfgLink);
                            const cnLink = normalizeLink(problem.cnLink);

                            return `
                                <article class="grid grid-cols-1 gap-3 rounded-xl border border-border/50 p-3 md:grid-cols-[1fr_auto_auto] md:items-start ${progress.status === "solved" ? "bg-emerald-500/10" : progress.status === "attempted" ? "bg-amber-500/10" : "bg-background/40"}">
                  <div>
                                        <p class="text-sm font-semibold md:text-base">${escapeHtml(problem.titleText)}</p>
                                        <div class="mt-2 flex flex-wrap gap-2">
                                            <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${difficultyClass === "easy" ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : difficultyClass === "medium" ? "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300"}">${escapeHtml(problem.difficultyText)}</span>
                    </div>
                                        <div class="mt-2 flex flex-wrap gap-2">
                                            ${lcLink ? `<a class="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-secondary" href="${lcLink}" target="_blank" rel="noopener noreferrer">LeetCode</a>` : ""}
                                            ${gfgLink ? `<a class="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-secondary" href="${gfgLink}" target="_blank" rel="noopener noreferrer">GFG</a>` : ""}
                                            ${cnLink ? `<a class="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-secondary" href="${cnLink}" target="_blank" rel="noopener noreferrer">Code360</a>` : ""}
                    </div>
                  </div>
                                    <div class="flex flex-wrap gap-1.5 md:justify-end" data-problem-id="${problem.id}">
                    ${statusButton(problem.id, "not-started", progress.status)}
                    ${statusButton(problem.id, "attempted", progress.status)}
                    ${statusButton(problem.id, "solved", progress.status)}
                  </div>
                                    <textarea class="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:w-60" data-problem-id="${problem.id}" placeholder="Notes">${escapeHtml(progress.notes || "")}</textarea>
                </article>
              `;
                        })
                        .join("");

                    return `
                        <section class="mt-3 rounded-xl border border-border/40 bg-background/45 p-3">
                            <h4 class="text-sm font-semibold md:text-base">${escapeHtml(subStep.subStepTitle)}</h4>
              ${problemsHtml}
            </section>
          `;
                })
                .join("");

            if (!subStepHtml.trim()) {
                return "";
            }

            const isOpen = state.activeStepNo === step.stepNo;
            return `
                <article class="rounded-2xl border border-border/70 bg-card/80 shadow-glass backdrop-blur">
                    <header class="border-b border-border/60 bg-gradient-to-r from-background/20 to-secondary/40 px-4 py-3">
                        <button class="flex w-full items-center gap-3" data-action="toggle-step" data-step-no="${step.stepNo}" type="button" aria-expanded="${isOpen}">
                            <h3 class="text-left text-sm font-bold md:text-base">Step ${step.stepNo}: ${escapeHtml(step.stepTitle)}</h3>
                            <span class="ml-auto inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">Solved ${solvedInStep}/${allStepProblems.length}</span>
                            <span class="font-mono text-xs text-muted-foreground">${isOpen ? "[-]" : "[+]"}</span>
            </button>
          </header>
                    <div class="px-3 pb-3 ${isOpen ? "block" : "hidden"}">
            ${subStepHtml}
          </div>
        </article>
      `;
        })
        .join("");

    elements.stepsContainer.innerHTML =
        html ||
        '<p class="rounded-xl border border-dashed border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">No problems found for current filters.</p>';
}

function statusButton(problemId, statusValue, activeStatus) {
    const isActive = statusValue === activeStatus;
    const label = statusValue === "not-started" ? "Not Started" : statusValue;
    const activeClass =
        statusValue === "solved"
            ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : statusValue === "attempted"
              ? "border-amber-500/45 bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "border-border bg-secondary text-secondary-foreground";
    const idleClass =
        "border-border bg-background text-muted-foreground hover:bg-secondary";
    return `<button class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${isActive ? activeClass : idleClass}" data-action="set-status" data-status="${statusValue}" data-problem-id="${problemId}">${label}</button>`;
}

async function syncFromRemote() {
    if (!state.user?.uid) {
        return;
    }

    setSyncStatus("pulling cloud data...");

    try {
        const remote = await pullRemoteProgressByUid(state.user.uid);
        if (remote?.progressMap && typeof remote.progressMap === "object") {
            state.progressMap = mergeProgressMaps(
                state.progressMap,
                remote.progressMap,
            );
            setProgressMap(getScopeId(), state.progressMap);
            renderAll();
        }
        setSyncStatus("cloud pull complete");
    } catch (error) {
        console.error(error);
        setSyncStatus("sync failed while pulling");
    }
}

async function syncToRemote() {
    if (!state.user?.uid) {
        return;
    }

    try {
        setSyncStatus("pushing changes...");
        await pushRemoteProgressByUid(state.user.uid, state.progressMap);
        setSyncStatus("synced");
    } catch (error) {
        console.error(error);
        setSyncStatus("sync failed while pushing");
    }
}

function saveProgressAndRender(nextProgressMap) {
    state.progressMap = nextProgressMap;
    setProgressMap(getScopeId(), state.progressMap);
    renderAll();
    void syncToRemote();
}

async function handleAuthChange(user) {
    state.user = user;

    if (user?.uid) {
        state.progressMap = getProgressMap(user.uid);
        renderAll();
        renderAuthState();
        await syncFromRemote();
        await syncToRemote();
    } else {
        state.progressMap = getProgressMap("guest");
        renderAll();
        renderAuthState();
    }
}

function setupEvents() {
    elements.themeToggleBtn?.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") || "light";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
    });

    elements.loginBtn.addEventListener("click", async () => {
        if (state.authBusy) {
            setSyncStatus("login already in progress");
            return;
        }

        state.authBusy = true;
        state.lastAuthError = "";
        elements.loginBtn.disabled = true;
        const watchdogId = setTimeout(() => {
            if (state.authBusy) {
                state.authBusy = false;
                state.lastAuthError =
                    "login taking too long; check popup/cookies and retry";
                renderAuthState();
            }
        }, 12000);

        try {
            sessionStorage.setItem(LOGIN_ATTEMPT_KEY, "1");
            setSyncStatus("opening Google login...");
            const signInResult = await signInWithGoogle();

            if (signInResult?.user) {
                sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
                setSyncStatus("login successful");
                await handleAuthChange(signInResult.user);
            } else {
                setSyncStatus("continuing login...");
            }
        } catch (error) {
            console.error(error);
            state.lastAuthError = authErrorToMessage(error);
            setSyncStatus(state.lastAuthError);
        } finally {
            clearTimeout(watchdogId);
            state.authBusy = false;
            renderAuthState();
        }
    });

    elements.logoutBtn.addEventListener("click", async () => {
        try {
            closeUserMenu();
            await signOutCurrentUser();
            setSyncStatus("signed out");
        } catch (error) {
            console.error(error);
            setSyncStatus("sign out failed");
        }
    });

    elements.syncNowBtn.addEventListener("click", async () => {
        if (!state.user?.uid) {
            setSyncStatus("login first");
            return;
        }

        closeUserMenu();
        await syncFromRemote();
        await syncToRemote();
    });

    elements.avatarMenuBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleUserMenu();
    });

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }

        if (
            elements.userMenu?.contains(target) ||
            elements.avatarMenuBtn?.contains(target)
        ) {
            return;
        }

        closeUserMenu();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeUserMenu();
        }
    });

    window.addEventListener("scroll", () => closeUserMenu(), { passive: true });
    window.addEventListener("resize", () => closeUserMenu());

    elements.searchInput.addEventListener("input", () => {
        state.filters.search = elements.searchInput.value.trim();
        renderSheet();
    });

    elements.topicFilter.addEventListener("change", () => {
        state.filters.topic = elements.topicFilter.value;
        state.activeStepNo =
            state.filters.topic === "all"
                ? state.activeStepNo
                : Number(state.filters.topic);
        renderSheet();
    });

    elements.difficultyFilter.addEventListener("change", () => {
        state.filters.difficulty = elements.difficultyFilter.value;
        renderSheet();
    });

    elements.statusFilter.addEventListener("change", () => {
        state.filters.status = elements.statusFilter.value;
        renderSheet();
    });

    elements.stepsContainer.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const actionEl = target.closest("[data-action]");
        if (!(actionEl instanceof HTMLElement)) {
            return;
        }

        if (actionEl.dataset.action === "toggle-step") {
            const stepNo = Number(actionEl.dataset.stepNo);
            state.activeStepNo = state.activeStepNo === stepNo ? null : stepNo;
            renderSheet();
            return;
        }

        if (actionEl.dataset.action !== "set-status") {
            return;
        }

        const problemId = actionEl.dataset.problemId;
        const status = actionEl.dataset.status;
        if (!problemId || !status) {
            return;
        }

        const nextMap = updateProblemProgress(state.progressMap, problemId, {
            status,
        });
        saveProgressAndRender(nextMap);
    });

    elements.stepsContainer.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement)) {
            return;
        }

        const problemId = target.dataset.problemId;
        if (!problemId) {
            return;
        }

        const nextMap = updateProblemProgress(state.progressMap, problemId, {
            notes: target.value.trim(),
        });
        saveProgressAndRender(nextMap);
    });
}

function renderAll() {
    renderStats();
    renderSheet();
}

async function bootstrap() {
    applyTheme(getPreferredTheme());
    renderTopicOptions();
    setupEvents();
    renderAll();
    renderAuthState();

    if (window.location.protocol === "file:") {
        setSyncStatus("run on http://localhost to use Firebase login");
    }

    if (!isFirebaseEnabled()) {
        return;
    }

    observeAuthState((user) => {
        void handleAuthChange(user);
    });

    await waitForAuthReady();

    try {
        const redirectResult = await consumeRedirectResult();
        if (redirectResult?.user) {
            sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
            setSyncStatus("login successful");
            await handleAuthChange(redirectResult.user);
        }
    } catch (error) {
        console.error(error);
        sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
        state.lastAuthError = authErrorToMessage(error);
        setSyncStatus(state.lastAuthError);
    }

    const hadLoginAttempt = sessionStorage.getItem(LOGIN_ATTEMPT_KEY) === "1";
    const currentUser = hadLoginAttempt
        ? await getCurrentUserWithRetry({ maxWaitMs: 7000, intervalMs: 350 })
        : getCurrentAuthUser();

    if (currentUser) {
        sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
        await handleAuthChange(currentUser);
    } else if (hadLoginAttempt) {
        state.lastAuthError =
            "login returned but no session restored (allow cookies / disable strict shields)";
        setSyncStatus(state.lastAuthError);
        sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
    }

    setInterval(() => {
        void syncToRemote();
    }, 30000);
}

void bootstrap();
