import type { Metadata } from "next";
import { ExternalLinkIcon, NewspaperIcon, PencilIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { hasPermission } from "@/lib/access";
import { getLatestPosts, isBlogConfigured } from "@/lib/blog";
import { getSession, requireNavAccess } from "@/lib/auth.utils";
import { formatDate } from "@/lib/format";
import { STUDIO_PATH } from "@/sanity/constants";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items.content");
    return { title: t("title") };
}

export default async function Page() {
    const item = await requireNavAccess("/content");
    const session = await getSession();
    const locale = await getLocale();
    const t = await getTranslations("Content");

    const canWrite = hasPermission(session?.user.role, { content: ["write"] });
    const configured = isBlogConfigured();
    const posts = configured ? await getLatestPosts(locale, 8) : [];

    return (
        <div className="flex flex-col gap-8">
            <NavPageHeader item={item} />

            <section className="rise r2 flex flex-wrap items-center gap-6 rounded-[22px] bg-green p-[clamp(28px,4vw,48px)] text-cream">
                <div className="min-w-0 flex-[1_1_380px]">
                    <h2 className="display m-0 text-[clamp(28px,3vw,38px)] leading-[1.1]">{t("studioTitle")}</h2>
                    <p className="mt-2 max-w-[560px] text-[16px] leading-[1.7] text-cream/85">
                        {configured ? t("studioText") : t("notConfigured")}
                    </p>
                </div>
                {configured && canWrite && (
                    <Button asChild size="lg" className="bg-gold text-green hover:bg-gold-light">
                        <a href={STUDIO_PATH} target="_blank" rel="noopener">
                            <ExternalLinkIcon data-icon="inline-start" />
                            {t("openStudio")}
                        </a>
                    </Button>
                )}
            </section>

            <section className="rise r3 flex flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 className="display m-0 text-[26px] text-green">{t("latestTitle")}</h2>
                    <Link href="/updates" className="text-[15px] font-semibold text-green underline underline-offset-4">
                        {t("viewUpdates")}
                    </Link>
                </div>

                {posts.length === 0 ? (
                    <Empty className="rounded-[14px] border border-green/10 bg-field">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <NewspaperIcon />
                            </EmptyMedia>
                            <EmptyDescription>{t("empty")}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                        {posts.map((post) => (
                            <li
                                key={post.id}
                                className="flex flex-wrap items-center gap-4 rounded-[14px] border border-green/10 bg-field p-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="text-[17px] font-semibold text-green">{post.title}</div>
                                    <div className="mt-1 text-[14px] text-[#4A5451]">
                                        {t("published", { date: formatDate(new Date(post.publishedAt), locale) })}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/updates/${post.slug}`}>{t("view")}</Link>
                                    </Button>
                                    {canWrite && (
                                        <Button asChild variant="outline" size="sm">
                                            <a href={`${STUDIO_PATH}/structure/post;${post.id}`} target="_blank" rel="noopener">
                                                <PencilIcon data-icon="inline-start" />
                                                {t("edit")}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="m-0 text-[14px] leading-[1.6] text-muted-ink">{t("accessNote")}</p>
            </section>
        </div>
    );
}
