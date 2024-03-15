import axios from "axios";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  findPublications,
  generateAIInformation,
} from "~/server/langchain";
import { SearxngAPIResponse } from "~/server/searxng_api";

enum AICacheTypes {
  AI_FIELDS = "ai_fields",
  AI_PAPERS = "ai_papers",
}

export type IAiFields = Awaited<ReturnType<typeof generateAIInformation>>;
export type IAiPapers = Awaited<ReturnType<typeof findPublications>>;

export const internalRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  searchNgx: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      let results: SearxngAPIResponse = (
        await axios.get("http://searxng:8080/search", {
          params: {
            q: input.query,
            format: "json",
            categories: "science",
          },
        })
      ).data;

      return JSON.stringify(results.results.slice(0, 5));
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

      let returnObject: IAiFields;

      if (aiCache) {
        //console.log("using cache for ai fields", input.entryId);
        returnObject = JSON.parse(aiCache.output) as IAiFields;
      } else {
        let aiInfo = await generateAIInformation(input.text);

        await ctx.prisma.aICache.create({
          data: {
            input: input.text,
            output: JSON.stringify(aiInfo),
            type: AICacheTypes.AI_FIELDS,
            entryId: input.entryId,
          },
        });

        returnObject = aiInfo;
      }

      return {
        data: returnObject,
        cacheInfo: aiCache,
      };
    }),
  // findPublication: publicProcedure
  //   .input(z.object({ text: z.string(), entryId: z.number() }))
  //   .query(({ input }) => {
  //     return findPublications(input.text);
  //   }),
  findPublication: publicProcedure
    .input(
      z.object({
        text: z.string(),
        entryId: z.number(),
        cacheAfterDate: z.date().nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      const aiCache = await ctx.prisma.aICache.findFirst({
        where: {
          entryId: input.entryId,
          type: AICacheTypes.AI_PAPERS,
          createdAt: {
            gte: input.cacheAfterDate || new Date(0),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let returnObject: IAiPapers;

      if (aiCache || input.cacheAfterDate == null) {
        if (aiCache) returnObject = JSON.parse(aiCache.output) as IAiPapers;
        else returnObject = { result: [] };
      } else {
        let aiInfo = await findPublications(input.text);
        console.log(
          "Trying to find paper via agent; Entry Id: ",
          input.entryId
        );

        //console.log(aiInfo);

        await ctx.prisma.aICache.create({
          data: {
            input: input.text,
            output: JSON.stringify(aiInfo),
            type: AICacheTypes.AI_PAPERS,
            entryId: input.entryId,
          },
        });

        returnObject = aiInfo;
      }

      return {
        data: returnObject,
        cacheInfo: aiCache,
      };
    }),
});
