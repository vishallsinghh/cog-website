import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { LANGUAGES, profileFormSchema, type ProfileFormValues } from "@/lib/profile.schemas";
import { createTRPCRouter, errorsFor, protectedProcedure, sessionProcedure } from "../init";

const nullIfEmpty = (value: string) => (value === "" ? null : value);

export const profileRouter = createTRPCRouter({
    get: protectedProcedure.query(async ({ ctx }) => {
        const user = await db.user.findUnique({
            where: { id: ctx.userId },
            include: { profile: true },
        });

        if (!user) {
            const e = await errorsFor(ctx.locale);
            throw new TRPCError({ code: "NOT_FOUND", message: e("accountNotFound") });
        }

        const profile = user.profile;
        const language = LANGUAGES.find((value) => value === user.preferredLanguage) ?? "en";

        const values: ProfileFormValues = {
            name: user.name,
            preferredLanguage: language,
            contactEmail: profile?.contactEmail ?? "",
            addressLine1: profile?.addressLine1 ?? "",
            addressLine2: profile?.addressLine2 ?? "",
            city: profile?.city ?? "",
            state: (profile?.state ?? "") as ProfileFormValues["state"],
            pincode: profile?.pincode ?? "",
            jamaat: profile?.jamaat ?? "",
        };

        return {
            values,
            phoneNumber: user.phoneNumber,
            memberId: user.memberId,
            status: user.status,
            aadhaarLast4: profile?.aadhaarLast4 ?? null,
            aadhaarVerified: Boolean(profile?.aadhaarVerifiedAt),
        };
    }),

    update: protectedProcedure.input(profileFormSchema).mutation(async ({ ctx, input }) => {
        const details = {
            contactEmail: nullIfEmpty(input.contactEmail),
            addressLine1: nullIfEmpty(input.addressLine1),
            addressLine2: nullIfEmpty(input.addressLine2),
            city: nullIfEmpty(input.city),
            state: nullIfEmpty(input.state),
            pincode: nullIfEmpty(input.pincode),
            jamaat: nullIfEmpty(input.jamaat),
        };

        await db.memberProfile.upsert({
            where: { userId: ctx.userId },
            create: { userId: ctx.userId, ...details },
            update: details,
        });

        await db.user.update({
            where: { id: ctx.userId },
            data: { name: input.name, preferredLanguage: input.preferredLanguage },
        });

        return { ok: true as const };
    }),

    /** Saves the language chosen from the dashboard switcher. */
    setLanguage: sessionProcedure
        .input(z.object({ language: z.enum(LANGUAGES) }))
        .mutation(async ({ ctx, input }) => {
            await db.user.update({
                where: { id: ctx.userId },
                data: { preferredLanguage: input.language },
            });

            return { ok: true as const };
        }),
});
