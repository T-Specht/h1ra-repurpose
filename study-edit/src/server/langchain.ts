import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import axios from "axios";
import { SemanticAPIResponse } from "./semantic_api";

export async function findPublications(input: string) {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-1106",
    temperature: 0.75,
  });

  const promptTemplate = new PromptTemplate({
    template: `Given the follwing JSON data in quotes for a clinical trial, construct a search query for a semantic scholar api search so that it includes all the information for finding a corresponding publication if it exists. To do this, extract the most relevant information and keywords. 

        "{inputText}"

      Output one main query and an array of other queries in JSON like this:

      {{
        "query": "main query that is quite specific and has the highes chance of success",
        "options": ["array of other queries, max. 6", "another one"]
      }}
      
      Use the following operators when combining keywords. Do NOT use the words AND, OR, NOT
      
      "+" for AND operation
      "|" for OR operation
      "-" negates a term
      "*" can be used to match a prefix
      
      `,
    inputVariables: ["inputText"],
  });
  const outputParser = new StringOutputParser();

  const chain = RunnableSequence.from([promptTemplate, model, outputParser]);
  // console.log('AI Test')
  const resultQuery = JSON.parse(
    await chain.invoke({
      inputText: input,
    })
  ) as { query: string; options: string[] };

  let semanticResult: SemanticAPIResponse = (
    await axios.get("https://api.semanticscholar.org/graph/v1/paper/search", {
      headers: {
        "x-api-key": process.env.SEMANTIC_API_KEY,
      },
      params: {
        query: resultQuery.query,
        fields:
          "title,year,journal,abstract,authors.name,fieldsOfStudy,tldr,externalIds,openAccessPdf,url",
        limit: 10,
      },
    })
  ).data;

  return {
    searchQuery: resultQuery,
    results: semanticResult,
  };
}

export async function generateAIInformation(input: string) {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-1106",
    temperature: 0.2,
    modelKwargs: {
      response_format: { type: "json_object" },
    },
  });
  const promptTemplate = new PromptTemplate({
    template: `You are given the follwing information in quotes about a clinical study in JSON format. 
      
      
          "{inputText}"
      
      
          Using this information, please extract and interpret the following information in JSON format as provided and demonstrated here:
      
        {{
        "drug_name": "the name of the H1 receptor antagonists / antihistamine if there was one that was looked at primarily. Possible options are cetirizine, levocetirizine, loratadine, desloratadine, fexofenadine or a combination of these. If non of these can be chosen, output 'No h1ra'. If multiple apply, list them by using |, e.g. cetirizine|loratadiine",
        "repurpose": "true if the drug name above is used, tested or evaluated for other (potential) indications than allergy, all forms of allergic rhinitis, urticaria in this study",
        "repurpose_reasoning": "Describe why repurpose is true or false",
        "drug_role": "the role of above drug in the study using the roles described below",
        "drug_role_explanation": "short explanation why you chose that drug role", 
        "usecase": "the indication/use case/condition treated with the drug name above in the study. Maximum of 3 words! Whenever possible the usecase should correspond to the study title condition."
        }}
        
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
        
        Only output the JSON.
        `,
    inputVariables: ["inputText"],
  });
  const outputParser = new StringOutputParser();

  const chain = RunnableSequence.from([promptTemplate, model, outputParser]);
  // console.log('AI Test')
  const result = await chain.invoke({
    inputText: input,
  });
  return result;
}
