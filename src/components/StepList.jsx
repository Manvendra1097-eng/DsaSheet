import StepCard from "./StepCard.jsx";

export default function StepList({
    steps,
    activeStepNo,
    onToggleStep,
    getProgress,
    matchesFilters,
    onSetStatus,
    onSetNotes,
    topicFilter,
}) {
    const visibleSteps = steps.filter(
        (step) => topicFilter === "all" || String(step.stepNo) === topicFilter,
    );

    const rendered = visibleSteps
        .map((step) => (
            <StepCard
                key={step.stepId}
                step={step}
                isOpen={activeStepNo === step.stepNo}
                onToggle={() => onToggleStep(step.stepNo)}
                getProgress={getProgress}
                matchesFilters={matchesFilters}
                onSetStatus={onSetStatus}
                onSetNotes={onSetNotes}
            />
        ))
        .filter(Boolean);

    if (rendered.length === 0) {
        return (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                No problems found for current filters.
            </p>
        );
    }

    return <section className="mt-4 grid gap-3">{rendered}</section>;
}
