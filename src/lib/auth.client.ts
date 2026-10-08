import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
    plugins: [
        phoneNumberClient(),
        adminClient({ ac, roles }),
        inferAdditionalFields<typeof auth>(),
    ],
});

export const { useSession, signOut } = authClient;
