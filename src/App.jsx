import { useMemo, useState } from "react";
import { useTheme } from "./hooks/useTheme.js";
import { useAuth } from "./hooks/useAuth.js";
import { useProgress } from "./hooks/useProgress.js";
import { normalizedSheet } from "./lib/sheet.js";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import StatsGrid from "./components/StatsGrid.jsx";
import Filters from "./components/Filters.jsx";
import StepList from "./components/StepList.jsx";

const DEFAULT_PROGRESS = { status: "not-started", notes: "", updatedAt: 0 };

export default function App() {
    const { theme, palette, toggleTheme, togglePalette } = useTheme();
    const auth = useAuth();
    console.log("USER: ", auth);
    const { progressMap, updateProgress, syncNow } = useProgress(
        auth.user,
        auth.setAuthMessage,
    );

    const [filters, setFilters] = useState({
        search: "",
        topic: "all",
        difficulty: "all",
        status: "all",
    });
    const [activeStepNo, setActiveStepNo] = useState(null);

    const getProgress = (problemId) =>
        progressMap[problemId] || DEFAULT_PROGRESS;

    const stats = useMemo(() => {
        const allProblems = normalizedSheet.flatMap((step) =>
            step.subSteps.flatMap((subStep) => subStep.problems),
        );
        let solved = 0;
        let attempted = 0;
        for (const problem of allProblems) {
            const status = getProgress(problem.id).status;
            if (status === "solved") solved += 1;
            else if (status === "attempted") attempted += 1;
        }
        const total = allProblems.length;
        return {
            total,
            solved,
            attempted,
            solvedPercent: total ? Math.round((solved * 100) / total) : 0,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progressMap]);

    const matchesFilters = (problem) => {
        const progress = getProgress(problem.id);
        const matchesSearch = problem.titleText
            .toLowerCase()
            .includes(filters.search.toLowerCase());
        const matchesDifficulty =
            filters.difficulty === "all" ||
            problem.difficultyText === filters.difficulty;
        const matchesStatus =
            filters.status === "all" || progress.status === filters.status;
        return matchesSearch && matchesDifficulty && matchesStatus;
    };

    const handleToggleStep = (stepNo) => {
        setActiveStepNo((prev) => (prev === stepNo ? null : stepNo));
    };

    const handleFiltersChange = (updater) => {
        setFilters((prev) => {
            const next =
                typeof updater === "function" ? updater(prev) : updater;
            if (next.topic !== prev.topic && next.topic !== "all") {
                setActiveStepNo(Number(next.topic));
            }
            return next;
        });
    };

    return (
        <>
            <Header
                theme={theme}
                palette={palette}
                toggleTheme={toggleTheme}
                togglePalette={togglePalette}
                auth={auth}
                syncNow={syncNow}
            />

            <main className="relative mx-auto max-w-6xl px-4 pb-8 pt-5 md:px-6">
                <Hero statusMessage={auth.authMessage} />

                <StatsGrid stats={stats} />

                <Filters
                    filters={filters}
                    setFilters={handleFiltersChange}
                    topics={normalizedSheet.map((step) => ({
                        stepNo: step.stepNo,
                        stepTitle: step.stepTitle,
                    }))}
                />

                <StepList
                    steps={normalizedSheet}
                    activeStepNo={activeStepNo}
                    onToggleStep={handleToggleStep}
                    getProgress={getProgress}
                    matchesFilters={matchesFilters}
                    topicFilter={filters.topic}
                    onSetStatus={(problemId, status) =>
                        updateProgress(problemId, { status })
                    }
                    onSetNotes={(problemId, notes) =>
                        updateProgress(problemId, { notes })
                    }
                />
            </main>
        </>
    );
}
