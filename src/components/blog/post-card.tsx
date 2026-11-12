import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/blog";
import { formatDate } from "@/lib/format";

export async function PostCard({ post, locale, featured = false }: { post: PostSummary; locale: string; featured?: boolean }) {
    const t = await getTranslations("Updates");

    return (
        <article className={`group relative flex min-w-0 flex-col ${featured ? "md:col-span-2 md:flex-row md:items-stretch" : ""}`}>
            <div
                className={`relative overflow-hidden bg-green/8 ${featured ? "aspect-[16/10] md:aspect-auto md:min-h-[420px] md:flex-[1_1_58%]" : "aspect-[16/10]"}`}
                style={{ borderRadius: featured ? "220px 220px 0 0" : "160px 160px 0 0" }}
            >
                {post.cover && (
                    <Image
                        src={post.cover.url}
                        alt={post.cover.alt}
                        fill
                        sizes={featured ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 33vw"}
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                )}
            </div>
            <div className={`flex flex-col pt-6 ${featured ? "md:flex-[1_1_42%] md:justify-center md:pt-0 md:pl-12" : ""}`}>
                <time dateTime={post.publishedAt} className="label text-gold-ink [--ls:.14em]">
                    {formatDate(new Date(post.publishedAt), locale)}
                </time>
                <h2
                    className={`display mt-3 leading-[1.1] text-green ${featured ? "text-[clamp(34px,3.6vw,52px)]" : "text-[clamp(26px,2.4vw,32px)]"}`}
                >
                    <Link href={`/updates/${post.slug}`} className="after:absolute after:inset-0 hover:text-gold-ink">
                        {post.title}
                    </Link>
                </h2>
                {post.summary && (
                    <p className={`mt-3 leading-[1.7] font-light text-ink-soft ${featured ? "text-[18px]" : "text-[16px]"}`}>{post.summary}</p>
                )}
                <span aria-hidden="true" className="mt-5 text-[15px] font-semibold text-green group-hover:text-gold-ink">
                    {t("readMore")}
                </span>
            </div>
        </article>
    );
}
