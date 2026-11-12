import { createTRPCRouter } from '../init';
import { applicationReviewRouter } from './application-review';
import { applicationsRouter } from './applications';
import { auditRouter } from './audit';
import { donationsRouter } from './donations';
import { formsAdminRouter } from './forms-admin';
import { membersRouter } from './members';
import { profileRouter } from './profile';
import { teamRouter } from './team';

export const appRouter = createTRPCRouter({
    profile: profileRouter,
    team: teamRouter,
    members: membersRouter,
    audit: auditRouter,
    applications: applicationsRouter,
    applicationReview: applicationReviewRouter,
    formsAdmin: formsAdminRouter,
    donations: donationsRouter,
});

export type AppRouter = typeof appRouter;
