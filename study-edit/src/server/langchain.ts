import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatAnthropicTools } from "@langchain/anthropic/experimental";

import { searxng_api_search } from "./searxng_api";

const MODEL = "gpt-3.5-turbo-1106";

const getModel = (temp = 0.5) => {
  return new ChatOpenAI({
    modelName: MODEL,
    temperature: 0.5,
  });

  //return new ChatAnthropic({});
};

async function generateQueries(input: string) {
  const model = getModel(0.5);

  const queryGenerationSchema = z.object({
    queries: z.array(z.string()).describe("search queries"),
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Given the input of data from a clinical study, generate 6 search queries that are highly likely to find the exact published paper if one should exist.",
    ],
    ["user", "{input}"],
  ]);
  // Binding "function_call" below makes the model always call the specified function.
  // If you want to allow the model to call functions selectively, omit it.
  const functionCallingModel = model.bind({
    functions: [
      {
        name: "output_formatter",
        description: "Should always be used to properly format output",
        parameters: zodToJsonSchema(queryGenerationSchema),
      },
    ],
    function_call: { name: "output_formatter" },
  });

  const outputParser = new JsonOutputFunctionsParser<
    z.infer<typeof queryGenerationSchema>
  >();

  const chain = RunnableSequence.from([
    prompt,
    functionCallingModel,
    outputParser,
  ]).withRetry({
    stopAfterAttempt: 3,
  });

  const { queries } = await chain.invoke({ input: input });
  return queries;
}

async function extractPapers(input: string, references: string) {
  const model = getModel(0.5);

  const schema = z.object({
    result: z
      .array(
        z.object({
          title: z.string().describe("title of the paper"),
          authors: z.string().describe("authors of the paper"),
          url: z.string().describe("link to the paper"),
          year: z.string().describe("year the paper was published"),
          source: z
            .string()
            .describe(
              "the tool with which you found the source, e.g. pubmed or semantic_scholar"
            ),
          confidence: z
            .number()
            .min(0)
            .max(100)
            .describe("confidence that this paper matches the clinical study"),
        })
      )
      .describe(
        "array of papers that you found. If you found non that match, return an empty array"
      ),
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Given the input of data from a clinical study and potential references for a corresponding publication to the study, find the paper that matches the study data. If you cannot find a paper that matches the study data, return an empty array.",
    ],
    [
      "user",
      `### STUDY DATA ###
    {input}


    ### REFERENCES ###
    {references}`,
    ],
  ]);
  // Binding "function_call" below makes the model always call the specified function.
  // If you want to allow the model to call functions selectively, omit it.
  const functionCallingModel = model.bind({
    functions: [
      {
        name: "output_formatter",
        description: "Should always be used to properly format output",
        parameters: zodToJsonSchema(schema),
      },
    ],
    function_call: { name: "output_formatter" },
  });

  const outputParser = new JsonOutputFunctionsParser<z.infer<typeof schema>>();

  const chain = RunnableSequence.from([
    prompt,
    functionCallingModel,
    outputParser,
  ]).withRetry({
    stopAfterAttempt: 3,
  });

  const result = await chain.invoke({
    input: input,
    references: references,
  });
  return result;
}

async function generateMetaData(input: string) {
  const model = getModel(0.8);

  const schema = z.object({
    drug_name: z
      .string()
      .describe(
        "the name of the H1 receptor antagonists / antihistamine if there was one that was looked at primarily. Possible options are cetirizine, levocetirizine, loratadine, desloratadine, fexofenadine or a combination of these. If non of these can be chosen, output 'No h1ra'. If multiple apply, list them by using |, e.g. cetirizine|loratadiine"
      ),
    repurpose: z
      .boolean()
      .describe(
        "true if drug_name is used, tested or evaluated for other indications than allergy, all forms of allergic rhinitis or urticaria in this study. If in doubt, answer with true."
      ),
    repurpose_reasoning: z
      .string()
      .describe("Describe why repurpose is true or false"),
    drug_role: z
      .string()
      .describe(
        "the role of above drug in the study using the roles described below"
      ),
    drug_role_explanation: z
      .string()
      .describe("short explanation why you chose that drug role"),
    usecase: z
      .string()
      .describe(
        "the indication/use case/condition treated with the drug name above in the study. Maximum of 3 words! Whenever possible the usecase should correspond to the study title condition."
      ),
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are given information about a clinical study in JSON format. Extract the information required in the output formatter function from the study data.
      
      Possible roles, consider in THIS order please:
        - "not included": drug_names are not included in the study (sometimes names of people also matched synonyms of search terms).
        - "combination": drug_name is combined with some other form of treatment, drug or medication.
        - "comparison": drug_name is compared to some other drugs or forms of treatment which are not placebo. If it is only compared to placebo, consider role "main"
        - "premedication": drug_name is used as a premedication and not evaluated further.
        - "rescue medication": drug_name is used as a rescue medication.
        - "minimal": drug_name has a very minimal role in the study. Use this if there are a lot of other drugs in the study and there is no clear focus on the drug_name
        - "main": drug_name is the main focus of the study and there almost no other medication or drugs in the study. Important: Before assiginig this role, consider if comparison or combination may be more descriptive options.
        - "control": drug_name is a control drug and not an aspect of focus in the study.
      
        Please also use combination or comparison if it is combination or comparison of multiple antihistamines.
      
        For usecases, you may consider the follwing if you find them fitting specifically: Do not change them, if you choose them
        - "taste/form/preference"
        - "bioequivalence"
        - "bioavailability"
        - "pharmacokinetics"
    `,
    ],
    ["user", `{input}`],
  ]);
  // Binding "function_call" below makes the model always call the specified function.
  // If you want to allow the model to call functions selectively, omit it.
  const functionCallingModel = model.bind({
    functions: [
      {
        name: "output_formatter",
        description: "Should always be used to properly format output",
        parameters: zodToJsonSchema(schema),
      },
    ],
    function_call: { name: "output_formatter" },
  });

  const outputParser = new JsonOutputFunctionsParser<z.infer<typeof schema>>();

  const chain = RunnableSequence.from([
    prompt,
    functionCallingModel,
    outputParser,
  ]).withRetry({
    stopAfterAttempt: 3,
  });

  const result = await chain.invoke({
    input: input,
  });
  return result;
}

export async function findPublications(input: string) {
  // Get search results

  const queries = await generateQueries(input);

  const references = (
    await Promise.all(
      queries.map(async (query) => await searxng_api_search(query))
    )
  )
    .flat()
    .map((r) => {
      const { content, url, title, authors, score, engine } = r;
      return { content, url, title, authors, score, engine };
    })
    .filter((e, i, self) => {
      const index = self.findIndex((t) => t.title === e.title);
      return index === i;
    });

  const matched = await extractPapers(input, JSON.stringify(references));

  return matched;
}

export async function generateAIInformation(input: string) {
  const metaData = await generateMetaData(input);
  return metaData;
}
