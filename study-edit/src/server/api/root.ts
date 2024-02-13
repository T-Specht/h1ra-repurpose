import { createTRPCRouter } from "~/server/api/trpc";
import { internalRouter } from "~/server/api/routers/internal";
import { appRouter as generatedAppRouter } from "~/../prisma/generated/routers/index";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  interal: internalRouter,
  generated: generatedAppRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
