import Image from "next/image";
import { PortableText, type PortableTextBlock, type PortableTextComponents } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityImageUrl } from "@/lib/blog";

type BodyImage = SanityImageSource & { alt?: string; asset?: { _ref?: string } };

function dimensions(ref: string | undefined) {
    const match = ref ? /-(\d+)x(\d+)-/.exec(ref) : null;
    return match ? { width: Number(match[1]), height: Number(match[2]) } : { width: 1600, height: 1000 };
}

const components: PortableTextComponents = {
    block: {
        h2: ({ children }) => <h2>{children}</h2>,
        h3: ({ children }) => <h3 className="display mt-10 mb-3 text-[clamp(24px,2.4vw,30px)] leading-[1.2] text-green">{children}</h3>,
        blockquote: ({ children }) => (
            <blockquote className="my-8 border-l-[3px] border-gold pl-5 text-[19px] leading-[1.7] text-ink-soft italic">{children}</blockquote>
        ),
    },
    marks: {
        link: ({ children, value }) => {
            const href = typeof value?.href === "string" ? value.href : "";
            const external = /^https?:\/\//.test(href);
            return (
                <a
                    href={href}
                    className="font-medium text-green underline underline-offset-4 hover:text-gold-ink"
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                    {children}
                </a>
            );
        },
    },
    types: {
        image: ({ value }: { value: BodyImage }) => {
            const url = sanityImageUrl(value, 1520);
            if (!url) return null;
            const size = dimensions(value.asset?._ref);

            return (
                <figure className="my-10">
                    <Image
                        src={url}
                        alt={value.alt ?? ""}
                        width={size.width}
                        height={size.height}
                        sizes="(max-width: 820px) 100vw, 760px"
                        className="h-auto w-full rounded-[14px]"
                    />
                </figure>
            );
        },
    },
};

export function PostBody({ value }: { value: PortableTextBlock[] }) {
    return (
        <div className="prose-block">
            <PortableText value={value} components={components} />
        </div>
    );
}
