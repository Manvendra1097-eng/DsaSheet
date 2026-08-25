import STRIVERS_SHEET from "../data/striversSheetv1.js";

export function normalizeSheet(rawSheet) {
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

    return { normalizedSheet: normalized, problemsById };
}

export function normalizeLink(rawLink) {
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

export const { normalizedSheet, problemsById } = normalizeSheet(STRIVERS_SHEET);
