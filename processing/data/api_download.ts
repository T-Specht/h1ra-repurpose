import axios from "axios";
import { writeFileSync } from "fs";
import _, { upperFirst } from "lodash";
import xml2json from '@hendt/xml2json';

const base = "https://clinicaltrials.gov/api/legacy/study-fields";

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

const arrayKeys: string[] = [
  "Condition",
  "ConditionMeshTerm",
  "CollaboratorName",
  "CollaboratorClass",
  "StdAge",
  "Phase",
  "DesignWhoMasked",
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
  "ConditionBrowseLeafName",
  "ConditionAncestorTerm",
  "OverallOfficialAffiliation",
  "ReferenceCitation",
];

// Increase this number if there are more than 1000 results for the search expression
const MAX_RANK_LIMIT = 1000;

const params = {
  expr: "NCT06179056,NCT06172686,NCT06120140,NCT06101420",
  //fmt: "json", // this is no longer supported in the legacy api
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
      let xml = await axios.get(base, {
        params: {
          ...params,
          min_rnk: min_rank,
          max_rnk: max_rank,
          fields: [...chunk, "NCTId"].join(","),
        },
      });

      let json = xml2json(xml.data, {
      })


      let values = json.StudyFieldsResponse.StudyFieldsList.StudyFields.map((e: any) => e.FieldValues) as Array<
        Array<{
          Field: string
          FieldValue: any
        }>
      >

      let res = values.map(o => o.reduce<any>((obj, v) => {

        if (arrayKeys.includes(v.Field)) {

          let valueIsArray = Array.isArray(v.FieldValue);

          if (valueIsArray || v.FieldValue == null) {
            if (v.FieldValue == null) {
              obj[v.Field] = []
            } else {
              obj[v.Field] = v.FieldValue

            }
          } else {
            obj[v.Field] = [v.FieldValue]
          }


        } else {

          obj[v.Field] = v.FieldValue
        }

        return obj;
      }, {}))

      results = _.merge(results, res);

    }

    console.log({ min_rank, max_rank, results_length: results.length });


    resultsOverAllRanks.push(...results);

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
