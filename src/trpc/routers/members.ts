import type { Prisma } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/access";
import { maskPhone } from "@/lib/audit";
import { db } from "@/lib/db";
import { dayRange, memberListInputSchema } from "@/lib/list.schemas";
import { createTRPCRouter, staffProcedure } from "../init";

export const membersRouter = createTRPCRouter({
    list: staffProcedure({ member: ["read"] })
        .input(memberListInputSchema)
        .query(async ({ ctx, input }) => {
            const canSeePhone = hasPermission(ctx.auth.user.role, { member: ["readContact"] });

            const and: Prisma.UserWhereInput[] = [];

            const search = input.search?.trim();
            if (search) {
                const or: Prisma.UserWhereInput[] = [
                    { name: { contains: search } },
                    { memberId: { contains: search } },
                ];

                // Phone search is off for roles that only see masked numbers, otherwise
                // a hit would confirm that a number belongs to a member.
                const digits = search.replace(/\D/g, "");
                if (canSeePhone && digits.length >= 3) {
                    or.push({ phoneNumber: { contains: digits } });
                }

                and.push({ OR: or });
            }

            if (input.status) and.push({ status: input.status });
            if (input.role) and.push(input.role === "member" ? { OR: [{ role: "member" }, { role: null }] } : { role: input.role });

            const joined = dayRange(input.joined);
            if (joined) and.push({ createdAt: joined });

            const where: Prisma.UserWhereInput = and.length > 0 ? { AND: and } : {};

            const [total, rows] = await Promise.all([
                db.user.count({ where }),
                db.user.findMany({
                    where,
                    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                    skip: (input.page - 1) * input.pageSize,
                    take: input.pageSize,
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        memberId: true,
                        status: true,
                        role: true,
                        createdAt: true,
                    },
                }),
            ]);

            return {
                total,
                page: input.page,
                pageSize: input.pageSize,
                canSearchPhone: canSeePhone,
                rows: rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    phone: canSeePhone ? (row.phoneNumber ?? "") : maskPhone(row.phoneNumber),
                    memberId: row.memberId,
                    status: row.status,
                    role: row.role ?? "member",
                    joinedAt: row.createdAt,
                })),
            };
        }),
});
