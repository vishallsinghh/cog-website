import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PostCard } from "@/components/blog/post-card";
import { PageBanner } from "@/components/site-shell";
import { getLatestPosts } from "@/lib/blog";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Updates");
    return { title: t("metaTitle"), description: t("description") };
}

export default async function Page() {
    const t = await getTranslations("Updates");
    const locale = await getLocale();
    const posts = await getLatestPosts(locale, 60);

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
            <section className="section interior">
                <div className="wrap">
                    {posts.length === 0 ? (
                        <div className="panel">
                            <h2>{t("emptyTitle")}</h2>
                            <p className="interior-lead">{t("emptyText")}</p>
                        </div>
                    ) : (
                        <div className="grid gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {posts.map((post, index) => (
                                <PostCard key={post.id} post={post} locale={locale} featured={index === 0} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
