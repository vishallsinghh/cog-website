import { defineArrayMember, defineField, defineType, type Rule } from "sanity";

const LANGUAGES = [
    { id: "en", title: "English" },
    { id: "gu", title: "ગુજરાતી (Gujarati)" },
] as const;

const requireEnglish = (rule: Rule) =>
    rule.custom((value: { en?: unknown } | undefined) => {
        const en = value?.en;
        const filled = Array.isArray(en) ? en.length > 0 : typeof en === "string" && en.trim().length > 0;
        return filled || "English is required. Gujarati is optional; English is shown when it is missing.";
    });

const localeString = defineType({
    name: "localeString",
    title: "Text in both languages",
    type: "object",
    fields: LANGUAGES.map((language) => defineField({ name: language.id, title: language.title, type: "string" })),
});

const localeText = defineType({
    name: "localeText",
    title: "Paragraph in both languages",
    type: "object",
    fields: LANGUAGES.map((language) =>
        defineField({ name: language.id, title: language.title, type: "text", rows: 3, validation: (rule) => rule.max(300) }),
    ),
});

const localeBody = defineType({
    name: "localeBody",
    title: "Body in both languages",
    type: "object",
    fields: LANGUAGES.map((language) =>
        defineField({
            name: language.id,
            title: language.title,
            type: "array",
            of: [
                defineArrayMember({
                    type: "block",
                    styles: [
                        { title: "Normal", value: "normal" },
                        { title: "Heading", value: "h2" },
                        { title: "Subheading", value: "h3" },
                        { title: "Quote", value: "blockquote" },
                    ],
                }),
                defineArrayMember({
                    type: "image",
                    options: { hotspot: true },
                    fields: [defineField({ name: "alt", title: "Description for screen readers", type: "string" })],
                }),
            ],
        }),
    ),
});

const post = defineType({
    name: "post",
    title: "Post",
    type: "document",
    fields: [
        defineField({ name: "title", title: "Title", type: "localeString", validation: requireEnglish }),
        defineField({
            name: "slug",
            title: "Web address",
            type: "slug",
            description: "Part of the post's link, for example /updates/annual-meeting-2026. Generate it from the English title.",
            options: { source: "title.en", maxLength: 96 },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "publishedAt",
            title: "Publish date",
            type: "datetime",
            description: "The post appears on the website from this date and time.",
            initialValue: () => new Date().toISOString(),
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "coverImage",
            title: "Cover image",
            type: "image",
            options: { hotspot: true },
            fields: [defineField({ name: "alt", title: "Description for screen readers", type: "localeString" })],
            validation: (rule) => rule.required(),
        }),
        defineField({ name: "summary", title: "Short summary", type: "localeText", validation: requireEnglish }),
        defineField({ name: "body", title: "Body", type: "localeBody", validation: requireEnglish }),
    ],
    orderings: [{ title: "Publish date, newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
    preview: {
        select: { title: "title.en", subtitle: "publishedAt", media: "coverImage" },
        prepare: ({ title, subtitle, media }) => ({
            title: title || "Untitled",
            subtitle: subtitle ? new Date(subtitle).toLocaleDateString("en-IN") : "No publish date",
            media,
        }),
    },
});

export const schemaTypes = [localeString, localeText, localeBody, post];
