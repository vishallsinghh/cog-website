import { cacheLife, cacheTag } from "next/cache";
import { createClient, defineQuery } from "next-sanity";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/react";
import { sanityPublicEnv, sanityServerEnv } from "./env";

export const POSTS_TAG = "posts";
const API_VERSION = "2026-10-01";

type Localized<T> = { en?: T; gu?: T } | null;

type RawImage = (SanityImageSource & { alt?: Localized<string> | string }) | null;

type RawPost = {
    _id: string;
    slug: string;
    publishedAt: string;
    title: Localized<string>;
    summary: Localized<string>;
    coverImage: RawImage;
};

type RawPostDetail = RawPost & { body: Localized<PortableTextBlock[]> };

export type PostImage = { url: string; alt: string };

export type PostSummary = {
    id: string;
    slug: string;
    publishedAt: string;
    title: string;
    summary: string;
    cover: PostImage | null;
};

export type PostDetail = PostSummary & { body: PortableTextBlock[] };

const POST_FIELDS = `_id, "slug": slug.current, publishedAt, title, summary, coverImage`;

const LIST_QUERY = defineQuery(
    `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc) [0...$limit] { ${POST_FIELDS} }`,
);

const POST_QUERY = defineQuery(
    `*[_type == "post" && slug.current == $slug && publishedAt <= now()][0] { ${POST_FIELDS}, body }`,
);

const SLUGS_QUERY = defineQuery(
    `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc) [0...50].slug.current`,
);

function sanityClient() {
    const env = sanityPublicEnv();
    if (!env) return null;

    const token = sanityServerEnv().SANITY_API_READ_TOKEN;

    return createClient({
        projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: API_VERSION,
        useCdn: false,
        perspective: "published",
        ...(token ? { token } : {}),
    });
}

function filled<T>(value: T | undefined): value is T {
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

export function pickLocale<T>(value: Localized<T> | undefined, locale: string): T | undefined {
    if (!value) return undefined;
    if (locale === "gu" && filled(value.gu)) return value.gu;
    return filled(value.en) ? value.en : undefined;
}

export function sanityImageUrl(source: SanityImageSource, width: number, height?: number) {
    const env = sanityPublicEnv();
    if (!env) return null;

    let builder = createImageUrlBuilder({
        projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    })
        .image(source)
        .width(width)
        .auto("format")
        .fit(height ? "crop" : "max");

    if (height) builder = builder.height(height);

    return builder.url();
}

function coverImage(image: RawImage, locale: string, fallbackAlt: string): PostImage | null {
    if (!image) return null;

    const url = sanityImageUrl(image, 1600, 900);
    if (!url) return null;

    const alt = typeof image.alt === "string" ? image.alt : pickLocale(image.alt ?? null, locale);
    return { url, alt: alt ?? fallbackAlt };
}

function summarize(row: RawPost, locale: string): PostSummary {
    const title = pickLocale(row.title, locale) ?? "";

    return {
        id: row._id,
        slug: row.slug,
        publishedAt: row.publishedAt,
        title,
        summary: pickLocale(row.summary, locale) ?? "",
        cover: coverImage(row.coverImage, locale, title),
    };
}

export async function getLatestPosts(locale: string, limit: number): Promise<PostSummary[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(POSTS_TAG);

    const client = sanityClient();
    if (!client) return [];

    const rows = await client.fetch<RawPost[]>(LIST_QUERY, { limit });
    return rows.map((row) => summarize(row, locale));
}

export async function getPost(locale: string, slug: string): Promise<PostDetail | null> {
    "use cache";
    cacheLife("hours");
    cacheTag(POSTS_TAG);

    const client = sanityClient();
    if (!client) return null;

    const row = await client.fetch<RawPostDetail | null>(POST_QUERY, { slug });
    if (!row) return null;

    return { ...summarize(row, locale), body: pickLocale(row.body, locale) ?? [] };
}

export async function getPostSlugs(): Promise<string[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(POSTS_TAG);

    const client = sanityClient();
    if (!client) return [];

    return client.fetch<string[]>(SLUGS_QUERY);
}

export function isBlogConfigured() {
    return sanityPublicEnv() !== null;
}
