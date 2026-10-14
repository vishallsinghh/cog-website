// Public impact figures from the 40 Years catalogue (p.13–14). Change them here only.
// Labels live in messages under Impact.figures.<id>.
export const IMPACT_FIGURES = [
    { id: "jamaats", value: "44" },
    { id: "people", value: "35,000+" },
    { id: "villages", value: "100+" },
    { id: "housing", value: "681" },
    { id: "elderlyWomen", value: "700" },
    { id: "marriageProgrammes", value: "43" },
    { id: "marriages", value: "830" },
    { id: "families", value: "1,660" },
] as const;

export type ImpactFigureId = (typeof IMPACT_FIGURES)[number]["id"];

export function impactValue(id: ImpactFigureId) {
    return IMPACT_FIGURES.find((figure) => figure.id === id)!.value;
}
