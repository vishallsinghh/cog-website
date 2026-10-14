import { createTRPCRouter } from '../init';
import { auditRouter } from './audit';
import { membersRouter } from './members';
import { profileRouter } from './profile';
import { teamRouter } from './team';

export const appRouter = createTRPCRouter({
    profile: profileRouter,
    team: teamRouter,
    members: membersRouter,
    audit: auditRouter,
});

export type AppRouter = typeof appRouter;
