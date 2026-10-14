// The programme pages under /our-work. Copy lives in messages under Programmes.<key>.
export const PROGRAMMES = [
    { slug: "education", key: "education", image: "/images/education.png" },
    { slug: "housing", key: "housing", image: "/images/housing.png" },
    { slug: "healthcare-welfare", key: "healthcare", image: "/images/healthcare.png" },
    { slug: "group-marriages", key: "marriages", image: "/images/marriages.png" },
    { slug: "relief", key: "relief", image: "/images/relief.png" },
] as const;

export type Programme = (typeof PROGRAMMES)[number];

export function findProgramme(slug: string) {
    return PROGRAMMES.find((programme) => programme.slug === slug);
}

// Every programme page shows four highlights, h1..h4, in messages.
export const HIGHLIGHT_KEYS = ["h1", "h2", "h3", "h4"] as const;
