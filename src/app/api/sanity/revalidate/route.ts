import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { POSTS_TAG } from "@/lib/blog";
import { sanityServerEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
    const secret = sanityServerEnv().SANITY_REVALIDATE_SECRET;
    if (!secret) return new Response(null, { status: 503 });

    const { isValidSignature, body } = await parseBody<{ _type?: string }>(request, secret, true);
    if (!isValidSignature) return new Response(null, { status: 401 });
    if (body?._type !== "post") return Response.json({ revalidated: false });

    revalidateTag(POSTS_TAG, { expire: 0 });
    return Response.json({ revalidated: true });
}
