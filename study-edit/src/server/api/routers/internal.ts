import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { findPublications, generateAIInformation } from "~/server/langchain";

enum AICacheTypes {
  AI_FIELDS = "ai_fields",
}

export interface IAiFields {
  drug_name: string;
  repurpose: boolean;
  repurpose_reasoning: string;
  drug_role: string;
  drug_role_explanation: string;
  usecase: string;
}

export const internalRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  aiFields: publicProcedure
    .input(z.object({ text: z.string(), entryId: z.number() }))
    .query(async ({ input, ctx }) => {
      const aiCache = await ctx.prisma.aICache.findFirst({
        where: {
          entryId: input.entryId,
          type: AICacheTypes.AI_FIELDS,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let returnStr: string;

      if (aiCache) {
        console.log("using cache");
        returnStr = aiCache.output;
      } else {
        let aiInfo = await generateAIInformation(input.text);

        await ctx.prisma.aICache.create({
          data: {
            input: input.text,
            output: aiInfo,
            type: AICacheTypes.AI_FIELDS,
            entryId: input.entryId,
          },
        });

        returnStr = aiInfo;
      }

      return {
        data: JSON.parse(returnStr) as IAiFields,
        cacheInfo: aiCache,
      };
    }),
  findPublication: publicProcedure
    .input(z.object({ text: z.string(), entryId: z.number() }))
    .query(({ input }) => {
      return findPublications(input.text);
    }),
});
