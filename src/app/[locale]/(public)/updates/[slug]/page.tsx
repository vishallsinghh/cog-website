import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PostBody } from "@/components/blog/post-body";
import { Link } from "@/i18n/navigation";
import { getPost, getPostSlugs } from "@/lib/blog";
import { formatDate } from "@/lib/format";

export const instant = false;

const NO_POSTS_SLUG = "no-posts-yet";

export async function generateStaticParams() {
    const slugs = await getPostSlugs();
    return (slugs.length > 0 ? slugs : [NO_POSTS_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/updates/[slug]">): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(await getLocale(), slug);
    if (!post) return {};

    return {
        title: post.title,
        description: post.summary || undefined,
        openGraph: post.cover ? { images: [{ url: post.cover.url, alt: post.cover.alt }] } : undefined,
    };
}

export default async function Page({ params }: PageProps<"/[locale]/updates/[slug]">) {
    const { slug } = await params;
    const locale = await getLocale();
    const post = await getPost(locale, slug);
    if (!post) notFound();

    const t = await getTranslations("Updates");

    return (
        <main>
            <article>
                <header className="relative overflow-hidden bg-green text-cream">
                    <div className="arch-bg absolute inset-0" aria-hidden="true" style={{ opacity: 0.3 }} />
                    <div className="wrap relative pt-20 pb-16">
                        <Link href="/updates" className="intro label text-gold-light hover:text-cream">
                            ← {t("back")}
                        </Link>
                        <time dateTime={post.publishedAt} className="intro d1 label mt-8 block text-cream/75 [--ls:.14em]">
                            {formatDate(new Date(post.publishedAt), locale)}
                        </time>
                        <h1 className="intro d1 display mt-4 max-w-[980px] text-[clamp(40px,5.2vw,72px)] leading-[1.02]">{post.title}</h1>
                        {post.summary && (
                            <p className="intro d2 mt-6 max-w-[700px] text-[19px] leading-[1.7] font-light text-cream/85">{post.summary}</p>
                        )}
                    </div>
                </header>

                <section className="section interior">
                    <div className="wrap">
                        {post.cover && (
                            <div
                                className="relative mx-auto mb-16 aspect-[16/9] max-w-[1080px] overflow-hidden"
                                style={{ borderRadius: "320px 320px 0 0" }}
                            >
                                <Image
                                    src={post.cover.url}
                                    alt={post.cover.alt}
                                    fill
                                    priority
                                    sizes="(max-width: 1140px) 100vw, 1080px"
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="mx-auto max-w-[760px]">
                            <PostBody value={post.body} />
                            <Link
                                href="/updates"
                                className="mt-14 inline-flex text-[16px] font-semibold text-green underline underline-offset-4 hover:text-gold-ink"
                            >
                                ← {t("back")}
                            </Link>
                        </div>
                    </div>
                </section>
            </article>
        </main>
    );
}
