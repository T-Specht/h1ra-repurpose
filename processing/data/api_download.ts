import axios from "axios";
import { writeFileSync } from "fs";
import _ from "lodash";

const base = "https://clinicaltrials.gov/api/query/study_fields";

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

const params = {
  expr: "Cetirizine OR Levocetirizine OR Fexofenadine OR Loratadine OR Desloratadine",
  min_rnk: 1,
  max_rnk: 1000,
  fmt: "json",
};

export const apiDownload = async (writeFile = true, fileName = './api_results.json') => {
  let chunks = _.chunk(fields, 19);
  console.log(`Downloading in ${chunks.length} chunks.`);

  let results: any[] = [];

  for (let chunk of chunks) {
    let res = await axios.get(base, {
      params: {
        ...params,
        fields: [...chunk, "NCTId"].join(","),
      },
    });

    results = _.merge(results, res.data.StudyFieldsResponse.StudyFields);
  }

  if (writeFile) {
    writeFileSync(
      fileName,
      JSON.stringify({ date: new Date(), data: results }, null, 3)
    );
    console.log(`Done. Written to file ${fileName}`);
  }

  return results;
};

if (require.main === module) {
  apiDownload();
}
