import { z } from "zod";
import { db } from "../src/lib/db";
import { INDIAN_MOBILE, tempEmailForPhone } from "../src/lib/phone";

const seedEnv = z
    .object({
        SUPER_ADMIN_PHONE: z.string().regex(INDIAN_MOBILE, "Use the format +91XXXXXXXXXX"),
        SUPER_ADMIN_NAME: z.string().trim().min(2).max(100),
    })
    .parse(process.env);

async function main() {
    const phoneNumber = seedEnv.SUPER_ADMIN_PHONE;

    const existing = await db.user.findUnique({ where: { phoneNumber } });

    const user = existing
        ? await db.user.update({
              where: { id: existing.id },
              data: {
                  name: seedEnv.SUPER_ADMIN_NAME,
                  role: "super_admin",
                  status: "approved",
                  phoneNumberVerified: true,
                  banned: false,
              },
          })
        : await db.user.create({
              data: {
                  name: seedEnv.SUPER_ADMIN_NAME,
                  email: tempEmailForPhone(phoneNumber),
                  phoneNumber,
                  phoneNumberVerified: true,
                  role: "super_admin",
                  status: "approved",
              },
          });

    await db.auditLog.create({
        data: {
            actorId: user.id,
            action: existing ? "seed.super_admin.updated" : "seed.super_admin.created",
            entityType: "user",
            entityId: user.id,
        },
    });

    console.log(`${existing ? "Updated" : "Created"} Super Admin ${user.id} (${phoneNumber})`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
