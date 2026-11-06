import { emptyAnswers, type Answers } from "./answers";
import { allFields, type FormDefinition, type PrefillSource } from "./definition";

export type PrefillValues = Partial<Record<PrefillSource, string | null | undefined>>;

export function prefillAnswers(definition: FormDefinition, values: PrefillValues): Answers {
    const answers = emptyAnswers(definition);

    for (const field of allFields(definition)) {
        if ((field.type === "short_text" || field.type === "long_text") && field.prefill) {
            answers[field.id] = values[field.prefill] ?? "";
        }
    }

    return answers;
}

export function answerForSource(definition: FormDefinition, answers: Answers, source: PrefillSource) {
    const field = allFields(definition).find(
        (item) => (item.type === "short_text" || item.type === "long_text") && item.prefill === source,
    );
    const value = field ? answers[field.id] : undefined;

    return typeof value === "string" && value.trim() ? value.trim() : null;
}
