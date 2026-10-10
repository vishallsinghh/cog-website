import { db } from "../src/lib/db";
import { seedEnv } from "../src/lib/env";
import { tempEmailForPhone } from "../src/lib/phone";

const env = seedEnv();

async function main() {
    const phoneNumber = env.SUPER_ADMIN_PHONE;

    const existing = await db.user.findUnique({ where: { phoneNumber } });

    const user = existing
        ? await db.user.update({
              where: { id: existing.id },
              data: {
                  name: env.SUPER_ADMIN_NAME,
                  role: "super_admin",
                  status: "approved",
                  phoneNumberVerified: true,
                  banned: false,
              },
          })
        : await db.user.create({
              data: {
                  name: env.SUPER_ADMIN_NAME,
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
