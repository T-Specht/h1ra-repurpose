import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import axios from "axios";
import { SemanticAPIResponse } from "./semantic_api";
import {
  JsonOutputFunctionsParser,
  StructuredOutputParser,
} from "langchain/output_parsers";
import { z } from "zod";
import {
  createOpenAIFunctionsAgent,
  AgentExecutor,
  //AgentStep as AAgentStep,
} from "langchain/agents";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { zodToJsonSchema } from "zod-to-json-schema";

import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import {
  FunctionsAgentAction,
  OpenAIFunctionsAgentOutputParser,
} from "langchain/agents/openai/output_parser";

import { SearxngSearch } from "@langchain/community/tools/searxng_search";

import {
  type BaseMessage,
  AIMessage,
  FunctionMessage,
  type AgentFinish,
  type AgentStep,
} from "langchain/schema";
import { searchPubMed } from "./pubmed-api";
import { SearxngAPIResponse, searxng_api_search } from "./searxng_api";

async function generateQueries(input: string) {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0125",
    temperature: 0.5,
  });

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
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0125",
    temperature: 0.5,
  });

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

export async function findPublicationsAgent(input: string) {
  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0125",
    temperature: 1,
    verbose: false,
  });

  const semanticSearchTool = new DynamicStructuredTool({
    name: "semantic-scholar",
    description:
      "allows you to search schemantic scholar for papers with a specific topic. Return data will be JSON.",
    schema: z.object({
      query: z.string().describe("this is the search query"),
    }),
    func: async ({ query }) => {
      let semanticResult: SemanticAPIResponse = (
        await axios.get(
          "https://api.semanticscholar.org/graph/v1/paper/search",
          {
            headers: {
              "x-api-key": process.env.SEMANTIC_API_KEY,
            },
            params: {
              query: query,
              fields:
                "title,year,journal,abstract,authors.name,fieldsOfStudy,tldr,externalIds,openAccessPdf,url",
              limit: 10,
            },
          }
        )
      ).data;
      return JSON.stringify(semanticResult.data);
    },
  });
  const pubmedSearchTool = new DynamicStructuredTool({
    name: "pubmed",
    description:
      "allows you to search pubmed for papers with a specific topic. Return data will be text of abstracts for search results",
    schema: z.object({
      query: z.string().describe("this is the search query"),
    }),
    func: async ({ query }) => {
      return await searchPubMed(query, 5);
    },
  });

  const searchTool = new DynamicStructuredTool({
    name: "search-tool",
    description:
      "allows you to search for papers with a specific topic. Return data will be JSON.",
    schema: z.object({
      query: z.string().describe("this is the search query"),
    }),
    func: async ({ query }) => {
      return JSON.stringify(searxng_api_search(query));
    },
  });

  // const searxngTool = new SearxngSearch({
  //   apiBase: "http://searxng:8080/search",
  //   params: {
  //     format: "json", // Do not change this, format other than "json" is will throw error
  //     numResults: 5,
  //     categories: "science",
  //   },
  // });

  const responseSchema = z.object({
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

  const responseOpenAIFunction = {
    name: "response",
    description:
      "Return the response to the user. Also use this if you were not successful.",
    parameters: zodToJsonSchema(responseSchema),
  };

  const structuredOutputParser = (
    message: AIMessage
  ): FunctionsAgentAction | AgentFinish => {
    if (message.content && typeof message.content !== "string") {
      throw new Error("This agent cannot parse non-string model responses.");
    }
    if (message.additional_kwargs.function_call) {
      const { function_call } = message.additional_kwargs;
      try {
        const toolInput = function_call.arguments
          ? JSON.parse(function_call.arguments)
          : {};
        // If the function call name is `response` then we know it's used our final
        // response function and can return an instance of `AgentFinish`
        if (function_call.name === "response") {
          return { returnValues: { ...toolInput }, log: message.content };
        }
        return {
          tool: function_call.name,
          toolInput,
          log: `Invoking "${function_call.name}" with ${
            function_call.arguments ?? "{}"
          }\n${message.content}`,
          messageLog: [message],
        };
      } catch (error) {
        throw new Error(
          `Failed to parse function arguments from chat model response. Text: "${function_call.arguments}". ${error}`
        );
      }
    } else {
      return {
        returnValues: { output: message.content },
        log: message.content,
      };
    }
  };

  const formatAgentSteps = (steps: AgentStep[]): BaseMessage[] =>
    steps.flatMap(({ action, observation }) => {
      if ("messageLog" in action && action.messageLog !== undefined) {
        const log = action.messageLog as BaseMessage[];
        return log.concat(new FunctionMessage(observation, action.tool));
      } else {
        return [new AIMessage(action.log)];
      }
    });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Using the search tool find if there is a published paper to this exact study. Do not search for related papers but only for specific ones to the study data provided. 
      Try different queries and keyword combinations until you found a exactly matching publication.`,
    ],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const llmWithTools = llm.bind({
    functions: [
      // convertToOpenAIFunction(semanticSearchTool),
      // convertToOpenAIFunction(pubmedSearchTool),
      convertToOpenAIFunction(searchTool),
      responseOpenAIFunction,
    ],
  });
  /** Create the runnable */
  const runnableAgent = RunnableSequence.from<{
    input: string;
    steps: Array<AgentStep>;
  }>([
    {
      input: (i) => i.input,
      agent_scratchpad: (i) => formatAgentSteps(i.steps),
    },
    prompt,
    llmWithTools,
    structuredOutputParser,
  ]);

  const executor = AgentExecutor.fromAgentAndTools({
    agent: runnableAgent,
    tools: [
      // semanticSearchTool, pubmedSearchTool,
      searchTool,
    ],
    maxIterations: 10,
  });
  /** Call invoke on the agent */
  const res = await executor.invoke({
    input: input,
  });

  return res as z.infer<typeof responseSchema>;
}

export async function generateAIInformation(input: string) {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0125",
    temperature: 0.2,
    modelKwargs: {
      response_format: { type: "json_object" },
    },
  });

  const structuredParser = StructuredOutputParser.fromZodSchema(
    z.object({
      drug_name: z
        .string()
        .describe(
          "the name of the H1 receptor antagonists / antihistamine if there was one that was looked at primarily. Possible options are cetirizine, levocetirizine, loratadine, desloratadine, fexofenadine or a combination of these. If non of these can be chosen, output 'No h1ra'. If multiple apply, list them by using |, e.g. cetirizine|loratadiine"
        ),
      repurpose: z
        .boolean()
        .describe(
          "true if the drug name above is used, tested or evaluated for other (potential) indications than allergy, all forms of allergic rhinitis, urticaria in this study"
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
    })
  );

  const promt = PromptTemplate.fromTemplate(
    `You are given the follwing information in quotes about a clinical study in JSON format. 
    "{inputText}"

    {format_instructions}

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
   `
  );

  const chain = RunnableSequence.from([promt, model, structuredParser]);
  // console.log('AI Test')
  const result = await chain.invoke({
    inputText: input,
    format_instructions: structuredParser.getFormatInstructions(),
  });
  return result;
}
