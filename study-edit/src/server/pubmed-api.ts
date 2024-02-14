import axios from "axios";

export async function searchPubMed(
  query: string,
  maxResults: number
): Promise<string> {
  const searchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
  const summaryUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

  try {
    // Perform the search to get PubMed IDs
    const searchParams = {
      db: "pubmed",
      retmode: "json",
      term: query,
      retmax: maxResults.toString(),
    };
    const searchResponse = await axios.get(searchUrl, { params: searchParams });
    const pmIds: string[] = searchResponse.data.esearchresult.idlist;

    // Fetch detailed information for all PubMed IDs in one request

    const summaryParams = {
      db: "pubmed",
      id: pmIds.join(","), // Join PubMed IDs with commas to form a comma-separated list
      retmode: "text",
      rettype: "abstract",
    };

    const abstracts = await axios.get(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
      {
        params: summaryParams,
      }
    );

    return abstracts.data;
  } catch (error) {
    console.error("Error searching PubMed:", error);
    return "";
  }
}
