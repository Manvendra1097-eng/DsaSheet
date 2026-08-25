import { ChevronDown, ChevronRight } from "lucide-react";
import ProblemRow from "./ProblemRow.jsx";

export default function StepCard({
    step,
    isOpen,
    onToggle,
    getProgress,
    matchesFilters,
    onSetStatus,
    onSetNotes,
}) {
    const allStepProblems = step.subSteps.flatMap(
        (subStep) => subStep.problems,
    );
    const solvedInStep = allStepProblems.filter(
        (problem) => getProgress(problem.id).status === "solved",
    ).length;

    const visibleSubSteps = step.subSteps
        .map((subStep) => ({
            ...subStep,
            problems: subStep.problems.filter(matchesFilters),
        }))
        .filter((subStep) => subStep.problems.length > 0);

    if (visibleSubSteps.length === 0) {
        return null;
    }

    return (
        <article className="rounded-2xl border border-border bg-card shadow-sm">
            <header className="border-b border-border rounded-2xl px-4 py-3">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3"
                >
                    <h3 className="text-left text-sm font-bold md:text-base">
                        Step {step.stepNo}: {step.stepTitle}
                    </h3>
                    <span className="ml-auto inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        Solved {solvedInStep}/{allStepProblems.length}
                    </span>
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
            </header>

            {isOpen && (
                <div className="px-3 pb-3">
                    {visibleSubSteps.map((subStep) => (
                        <section
                            key={subStep.subStepId}
                            className="mt-3 rounded-xl border border-border bg-muted/30 p-3"
                        >
                            <h4 className="text-sm font-semibold md:text-base">
                                {subStep.subStepTitle}
                            </h4>
                            <div className="mt-2 grid gap-2">
                                {subStep.problems.map((problem) => (
                                    <ProblemRow
                                        key={problem.id}
                                        problem={problem}
                                        progress={getProgress(problem.id)}
                                        onSetStatus={onSetStatus}
                                        onSetNotes={onSetNotes}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </article>
    );
}
