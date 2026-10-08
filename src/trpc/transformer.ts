import superjson from "superjson";

type DecimalLike = {
    d: number[];
    e: number;
    s: number;
    toFixed: () => string;
    toString: () => string;
};

const isDecimal = (value: unknown): value is DecimalLike =>
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as DecimalLike).d) &&
    typeof (value as DecimalLike).e === "number" &&
    typeof (value as DecimalLike).s === "number" &&
    typeof (value as DecimalLike).toFixed === "function";

superjson.registerCustom<DecimalLike, string>(
    {
        isApplicable: isDecimal,
        serialize: (value) => value.toString(),
        deserialize: (value) => value as unknown as DecimalLike,
    },
    "decimal",
);

export { superjson };
