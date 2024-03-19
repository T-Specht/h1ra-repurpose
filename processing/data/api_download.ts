import axios from "axios";
import { writeFileSync } from "fs";
import _ from "lodash";

const base = "https://classic.clinicaltrials.gov/api/query/study_fields";

// https://clinicaltrials.gov/api/info/study_fields_list?fmt=json

export let fields = [
  //   "NCTId",
  "OfficialTitle",
  "BriefTitle",
  "OverallStatus",
  "BriefSummary",
  //Results
  "Condition",
  "ConditionMeshTerm",
  "DesignInterventionModel",
  "LeadSponsorName",
  "LeadSponsorClass",
  "CollaboratorName",
  "CollaboratorClass",
  "Gender",

  "MaximumAge",
  "MinimumAge",
  "StdAge",
  "Phase",
  "EnrollmentCount",
  "EnrollmentType",
  "OrgClass",
  "OrgFullName",
  "DesignAllocation",
  "DesignInterventionModel",
  "DesignInterventionModelDescription",
  "DesignMasking",
  "DesignMaskingDescription",
  "DesignObservationalModel",
  "DesignPrimaryPurpose",
  "DesignTimePerspective",
  "DesignWhoMasked",
  "DetailedDescription",
  "StudyType",
  // Dates
  "StartDate",
  "PrimaryCompletionDate",
  "CompletionDate",
  "StudyFirstPostDate",
  "ResultsFirstPostDate",
  "LastUpdatePostDate",
  // Location
  "LocationCity",
  "LocationContactEMail",
  "LocationContactName",
  "LocationContactPhone",
  "LocationContactPhoneExt",
  "LocationContactRole",
  "LocationCountry",
  "LocationFacility",
  "LocationState",
  "LocationStatus",
  "LocationZip",

  "InterventionMeshTerm",
  "InterventionDescription",
  "InterventionBrowseLeafRelevance",
  "InterventionBrowseLeafName",
  //"InterventionBrowseBranchName"
  "ConditionBrowseLeafName",
  "ConditionAncestorTerm",
  "OverallOfficialAffiliation",
  "PointOfContactOrganization",
  "ReferenceCitation",
  "ReferencePMID",
  "ReferenceType",
  "ResponsiblePartyInvestigatorAffiliation",
  "ResponsiblePartyInvestigatorFullName",
  "ResponsiblePartyInvestigatorTitle",
  "ResponsiblePartyOldNameTitle",
  "ResponsiblePartyOldOrganization",
  "ResponsiblePartyType",
  "WhyStopped",
];

// Increase this number if there are more than 1000 results for the search expression
const MAX_RANK_LIMIT = 1000;

const params = {
  expr: "<expr>",
  fmt: "json",
};

export const apiDownload = async (writeFile = true, fileName = './api_results.json') => {
  let chunks = _.chunk(fields, 19);
  console.log(`Downloading in ${chunks.length} chunks.`);


  let resultsOverAllRanks: any[] = [];

  let min_rank = 1;
  let max_rank = Math.min(MAX_RANK_LIMIT, 1000); // if MAX_RANK_LIMIT < 1000

  // First loop is used if there are more than 1000 entries for search and MAX_RANK_LIMIT is set accordingly
  do {


    let results: any[] = [];


    for (let chunk of chunks) {
      let res = await axios.get(base, {
        params: {
          ...params,
          min_rnk: min_rank,
          max_rnk: max_rank,
          fields: [...chunk, "NCTId"].join(","),
        },
      });

      results = _.merge(results, res.data.StudyFieldsResponse.StudyFields);

    }

    console.log({ min_rank, max_rank, results_length: results.length });


    resultsOverAllRanks.push(results);

    if (max_rank >= MAX_RANK_LIMIT) break;

    const rank_diff = Math.min(MAX_RANK_LIMIT - max_rank, 1000);
    min_rank = max_rank + 1;
    max_rank += rank_diff;
  } while (max_rank <= MAX_RANK_LIMIT);


  if (writeFile) {
    writeFileSync(
      fileName,
      JSON.stringify({ date: new Date(), data: resultsOverAllRanks }, null, 3)
    );
    console.log(`Done. Written to file ${fileName}`);
  }

  return resultsOverAllRanks;
};

if (require.main === module) {
  apiDownload();
}
