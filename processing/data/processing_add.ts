import { Console, assert, log } from "console";
import { readFileSync } from "fs";
import { APIResultType, DesignWhoMasked, Phase } from "./apiResultType";
import { fields as downloadedFields } from "./api_download";

import { PrismaClient } from "@prisma/client";

const LEGACY_SEARCH_TERM = 'doxycycline_added';

const prisma = new PrismaClient();

// This is the data downloaded from clinical trials
const { data }: APIResultType = require("../api_results.json");

interface PDataEntry {
  NCTId: string;
  OfficialTitle: string;
  BriefTitle: string;
  OverallStatus: string;
  BriefSummary: string;
  DesignInterventionModel: string;
  LeadSponsorName: string;
  LeadSponsorClass: string;
  Gender: string;
  MaximumAge: number | null;
  MinimumAge: number | null;
  EnrollmentCount: number | null;
  EnrollmentType: string;
  OrgClass: string;
  OrgFullName: string;
  DesignAllocation: string;
  DesignInterventionModelDescription: string;
  DesignMasking: string;
  DesignMaskingDescription: string;
  DesignObservationalModel: string;
  DesignPrimaryPurpose: string;
  DesignTimePerspective: string;
  DetailedDescription: string;
  StartDate: string | null;
  PrimaryCompletionDate: string | null;
  CompletionDate: string | null;
  StudyFirstPostDate: string | null;
  ResultsFirstPostDate: string | null;
  LastUpdatePostDate: string | null;
  PointOfContactOrganization: string;
  ResponsiblePartyInvestigatorAffiliation: string;
  ResponsiblePartyInvestigatorFullName: string;
  ResponsiblePartyInvestigatorTitle: string;
  ResponsiblePartyOldNameTitle: string;
  ResponsiblePartyOldOrganization: string;
  ResponsiblePartyType: string;
  WhyStopped: string | null;
  StudyType: string;
}

//// Helper functions ///

const returnFirstOrNull = <T>(arr: T[] | undefined) => {
  if (arr == undefined) return null;
  if (Array.isArray(arr)) return arr.length == 0 ? null : arr[0];
  return arr; // most likley a string
}

const textTransform = (t: string) => t.toLowerCase().trim();

export const ageTransformer = (arr: string[]) => {
  let age = returnFirstOrNull(arr);
  if (age != null) {
    age = age.toLowerCase();
    if (age.includes("month")) {
      let num = age.replaceAll(/\D/g, "").trim();
      return parseInt(num) / 12;
    } else if (age.includes("year")) {
      let num = age.replaceAll(/\D/g, "").trim();
      return parseInt(num);
    }
  }

  return null;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
function transformDateString(d: string) {
  if (d.includes(",")) {
    let [monthDay, year] = d.split(", ");
    let [month, day] = monthDay.split(" ");
    if (month == undefined || year == undefined || day == undefined) {
      return "";
    }
    return `${year}-${(MONTHS.indexOf(month) + 1)
      .toString()
      .padStart(2, "0")}-${day.padStart(2, "0")}`;
  } else {
    let [month, year] = d.split(" ");
    if (month == undefined || year == undefined) {
      return "";
    }
    return `${year}-${(MONTHS.indexOf(month) + 1)
      .toString()
      .padStart(2, "0")}-01`;
  }
}

export const dateTransformer = (arr: string[]) => {
  let date = returnFirstOrNull(arr);
  if (date != null) {
    return transformDateString(date);
  }

  return null;
};

const dictionaryBuilderFunction = (idOffset = 0, checkExistingIdFun?: (term: string) => number) => {
  let dict: { term: string; id: number; count: number }[] = [];

  let fun = (term: string) => {
    let t = textTransform(term);
    let index = dict.findIndex((e) => e.term == t);
    if (index == -1) {
      dict.push({
        term: t,
        id: dict.length + idOffset,
        count: 1,
      });
    } else {
      dict[index].count = dict[index].count + 1;
    }
  };

  return [dict, fun] as const;
};


const main = async () => {


  const biggestMeshId = (await prisma.meshTerm.findFirstOrThrow({
    orderBy: {
      id: 'desc'
    }
  })).id;

  const biggestLocationId = (await prisma.location.findFirstOrThrow({
    orderBy: {
      id: 'desc'
    }
  })).id;

  const biggestEntryId = (await prisma.entry.findFirstOrThrow({
    orderBy: {
      id: 'desc'
    }
  })).id;



  console.log({ biggestMeshId, biggestLocationId, biggestEntryId });


  // Variables to store data temporarily during processing
  let entries: PDataEntry[] = [];
  const [meshTerms, meshTermCollectorFn] = dictionaryBuilderFunction(biggestMeshId + 1);
  const [collaborators, collabortorsCollectorFn] = dictionaryBuilderFunction();
  const [stdAge, stdAgeCollFn] = dictionaryBuilderFunction();
  const [phases, phasesCollFn] = dictionaryBuilderFunction();
  const [designWhoMasked, designWhoMaskedCollFn] = dictionaryBuilderFunction();
  const [OverallOfficialAffiliation, OverallOfficialAffiliationCollFn] =
    dictionaryBuilderFunction();

  let CityCountryFacilityDictionary: {
    city: string;
    country: string;
    facility: string | null;
    id: number;
    count: number;
  }[] = [];

  // First run to build single field values and collect array values 
  for (let d of data) {
    //console.log(d);

    // These keys may contain more than one element in the array
    const arrayKeys: (keyof typeof d)[] = [
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

    // Assert length of one for
    let singleLengthKeys: (keyof typeof d)[] = [
      "NCTId",
      "OfficialTitle",
      "BriefTitle",
      "OverallStatus",
      "BriefSummary",
      "LeadSponsorName",
      "LeadSponsorClass",
      "Gender",
      "MaximumAge",
      "MinimumAge",
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
      "DetailedDescription",
      "StartDate",
      "PrimaryCompletionDate",
      "CompletionDate",
      "StudyFirstPostDate",
      "ResultsFirstPostDate",
      "LastUpdatePostDate",
      "PointOfContactOrganization",
      "ResponsiblePartyInvestigatorAffiliation",
      "ResponsiblePartyInvestigatorFullName",
      "ResponsiblePartyInvestigatorTitle",
      "ResponsiblePartyOldNameTitle",
      "ResponsiblePartyOldOrganization",
      "ResponsiblePartyType",
      "WhyStopped",
      "StudyType",
    ];

    // Check if all downloaded Keys will be processed

    downloadedFields.forEach((k) => {
      if (![...arrayKeys, ...singleLengthKeys].includes(k as any)) {
        // TODO
        //console.warn(`Downloaded key "${k}" is missing in processing keys.`);
        //process.exit();
      }
    });

    // Temp holding for data
    let entry: PDataEntry = {} as any;

    /////////////////////////////////
    ///// Single Entries ///////////
    ////////////////////////////////

    // Assert that the length is really 0 or 1
    for (let k of singleLengthKeys) {
      //console.log(k);

      //assert((d[k] as any).length <= 1, k, d[k]);

      // Set the values in temp holding
      (entry as any)[k] = returnFirstOrNull(d[k] as string[]);
    }

    // Process age

    entry.MaximumAge = ageTransformer(d.MaximumAge);
    entry.MinimumAge = ageTransformer(d.MinimumAge);

    // Process dates, if no day is given, it defaults to the 1st

    //console.log(d);


    entry.StartDate = dateTransformer(d.StartDate);
    entry.CompletionDate = dateTransformer(d.CompletionDate);
    entry.LastUpdatePostDate = dateTransformer(d.LastUpdatePostDate);
    entry.StudyFirstPostDate = dateTransformer(d.StudyFirstPostDate);
    entry.ResultsFirstPostDate = dateTransformer(d.ResultsFirstPostDate);
    entry.PrimaryCompletionDate = dateTransformer(d.PrimaryCompletionDate);

    // Transform anticipated numbers

    let enrollmentRaw = returnFirstOrNull(d.EnrollmentCount);

    entry.EnrollmentCount =
      enrollmentRaw != null ? parseInt(enrollmentRaw) : null;

    // Save into dict
    entries.push(entry);

    /////////////////////////////////
    ///// Array Entries ///////////
    ////////////////////////////////

    /// Build Map of unique values ///

    d.ConditionMeshTerm.forEach(meshTermCollectorFn);
    d.InterventionMeshTerm.forEach(meshTermCollectorFn);
    d.CollaboratorName.forEach(collabortorsCollectorFn);

    d.StdAge.forEach(stdAgeCollFn);
    d.Phase.forEach(phasesCollFn);
    d.DesignWhoMasked.forEach(designWhoMaskedCollFn);

    //   d.LocationCity.forEach(LocationCityCollFn);
    //   d.LocationCountry.forEach(LocationCountryCollFn);

    // Save locations as a triplet of city, country and facility
    d.LocationCity.forEach((_city, i) => {
      {
        let city = textTransform(_city);
        let country = textTransform(d.LocationCountry[i]);
        let facility = d.LocationFacility[i]
          ? textTransform(d.LocationFacility[i])
          : null;

        let index = CityCountryFacilityDictionary.findIndex(
          (e) => e.city == city && e.country == country && e.facility == facility
        );
        if (index == -1) {
          CityCountryFacilityDictionary.push({
            city,
            country,
            facility,
            id: CityCountryFacilityDictionary.length + 1 + biggestLocationId,
            count: 1,
          });
        } else {
          CityCountryFacilityDictionary[index].count =
            CityCountryFacilityDictionary[index].count + 1;
        }
      }
    });

    d.OverallOfficialAffiliation.forEach(OverallOfficialAffiliationCollFn);
  }


  // Define Interfaces for the final data structure
  interface ILegacyData {
    nct: string;
    drug_role: string;
    search_term: string;
    usecase: string;
    repurpose: number;
    import_date: string;
    notes: string | null;
  }

  interface PDataEntryWithArrays extends PDataEntry {
    drug_role: string;
    legacy_search_term: string;
    usecase: string;
    repurpose: number;
    legacy_import_date: string;
    notes: string | null;
    //// Legacy Fields above ////
    conditionMeshTermsIds: number[];
    interventionMeshTermsIds: number[];
    collaboratorIds: number[];
    conditions: string[];
    locationIds: number[];
  }

  let finalEntries: PDataEntryWithArrays[] = [];

  const legacyData: ILegacyData[] = [];


  // Loop over all the collected and processed entries (at least processed for single values)
  await Promise.all(entries.map(async (e, i) => {
    // Save the corresponding entry from the raw data
    let d = data[i];

    let finalEntry: PDataEntryWithArrays = { ...(e as any) };

    // Map Array fields that were collected previously
    finalEntry.conditionMeshTermsIds = await Promise.all(d.ConditionMeshTerm.map(
      async (t) => {
        const prismaId = await prisma.meshTerm.findFirst({ where: { term: textTransform(t) } });
        if (prismaId) {
          return prismaId.id;
        } else {
          return meshTerms.find((e) => e.term == textTransform(t))!.id
        }
      }
    ));

    finalEntry.interventionMeshTermsIds = await Promise.all(d.InterventionMeshTerm.map(
      async (t) => {
        const prismaId = await prisma.meshTerm.findFirst({ where: { term: textTransform(t) } });
        if (prismaId) {
          return prismaId.id;
        } else {
          return meshTerms.find((e) => e.term == textTransform(t))!.id
        }
      }
    ));

    finalEntry.collaboratorIds = d.CollaboratorName.map(
      (t) => collaborators.find((c) => c.term == textTransform(t))!.id
    );

    finalEntry.locationIds = await Promise.all(d.LocationCity.map(async (_city, i) => {
      let city = textTransform(_city);
      let country = textTransform(d.LocationCountry[i]);
      let facility = d.LocationFacility[i]
        ? textTransform(d.LocationFacility[i])
        : null;

      const prismaLocation = await prisma.location.findFirst({
        where: {
          city, country, facility
        }
      });

      if (prismaLocation) {
        //console.log('Found location id');

        return prismaLocation.id
      } else {
        let id = CityCountryFacilityDictionary.find(
          (e) => e.city == city && e.country == country && e.facility == facility
        )!.id;
        return id;
      }
    }));

    finalEntry.conditions = d.Condition.map((c) => textTransform(c));


    ////////////////////////////////
    ///// Import legacy data ///////
    ///////////////////////////////

    // Find legacy data
    let legacyDataFilter = legacyData.filter((d) => d.nct == e.NCTId);

    const mergeLegacyData = (dataNode: ILegacyData) => {
      finalEntry = {
        ...finalEntry,
        drug_role: dataNode.drug_role,
        legacy_search_term: dataNode.search_term,
        usecase: dataNode.usecase,
        repurpose: dataNode.repurpose,
        legacy_import_date: dataNode.import_date,
        notes: dataNode.notes,
      };
    };

    if (legacyDataFilter.length == 1) {
      // All good
      mergeLegacyData(legacyDataFilter[0]);
    } else if (legacyDataFilter.length == 0) {
      // Not found
      //console.warn(`Found no legacy data for ${e.NCTId}`);
    } else {
      // Found too many
      console.warn(`Found multiple legacy nodes for ${e.NCTId}`);
      mergeLegacyData(legacyDataFilter[0]);
    }

    finalEntries.push(finalEntry);


  }));

  console.log('Final Entries to be added:' + finalEntries.length);



  /// Push it into the database if empty ///

  const dataPush = async () => {

    // if (count > 0) {
    //   console.error("Database has already values in it!");
    //   process.exit();
    // }

    // Insert array maps first


    console.log('Locations before: ', await prisma.location.count())

    await Promise.all(CityCountryFacilityDictionary.map(async (c) => {
      const { city, country, facility } = c;
      const prismaLocation = await prisma.location.findFirst({
        where: {
          city, country, facility
        }
      });
      if (!prismaLocation) {
        await prisma.location.create({
          data: {
            city: c.city,
            country: c.country,
            facility: c.facility,
            id: c.id,
          }
        })
      }
    }))

    console.log('Locations after: ', await prisma.location.count())

    console.log('meshTerms before: ', await prisma.meshTerm.count())

    await Promise.all(meshTerms.map(async t => {
      const prismaMeshTerm = await prisma.meshTerm.findFirst({
        where: {
          term: t.term
        }
      });

      if (!prismaMeshTerm) {
        await prisma.meshTerm.create({
          data: {
            term: t.term,
            id: t.id
          }
        })
      }
    }))

    console.log('meshTerms after: ', await prisma.meshTerm.count())



    console.log('Entries before: ', await prisma.entry.count())

    await Promise.all(finalEntries.map(async (e, i) => {

      


      // Check if entry already exists

      let dbEntry = await prisma.entry.findFirst({
        where: {
          NCTId: e.NCTId
        }
      });

      if (dbEntry) {
        console.warn(`${e.NCTId} already exists in database and is therefore skipped! Please check manually.`);
        return;
      }


      let res = await prisma.entry.create({
        data: {
          NCTId: e.NCTId!,
          OfficialTitle: e.OfficialTitle,
          BriefTitle: e.BriefTitle,
          OverallStatus: e.OverallStatus,
          BriefSummary: e.BriefSummary,
          DesignInterventionModel: e.DesignInterventionModel,
          LeadSponsorName: e.LeadSponsorName,
          LeadSponsorClass: e.LeadSponsorClass,
          Gender: e.Gender,
          MaximumAge: e.MaximumAge,
          MinimumAge: e.MinimumAge,
          EnrollmentCount: e.EnrollmentCount!,
          EnrollmentType: e.EnrollmentType,
          OrgClass: e.OrgClass,
          OrgFullName: e.OrgFullName,
          DesignAllocation: e.DesignAllocation,
          DesignInterventionModelDescription:
            e.DesignInterventionModelDescription,
          DesignMasking: e.DesignMasking,
          DesignMaskingDescription: e.DesignMaskingDescription,
          DesignObservationalModel: e.DesignObservationalModel,
          DesignPrimaryPurpose: e.DesignPrimaryPurpose,
          DesignTimePerspective: e.DesignTimePerspective,
          DetailedDescription: e.DetailedDescription,
          StartDate: e.StartDate,
          PrimaryCompletionDate: e.PrimaryCompletionDate,
          ResultsFirstPostDate: e.ResultsFirstPostDate,
          CompletionDate: e.CompletionDate,
          StudyFirstPostDate: e.StudyFirstPostDate,
          LastUpdatePostDate: e.LastUpdatePostDate,
          PointOfContactOrganization: e.PointOfContactOrganization,
          ResponsiblePartyInvestigatorAffiliation:
            e.ResponsiblePartyInvestigatorAffiliation,
          ResponsiblePartyInvestigatorFullName:
            e.ResponsiblePartyInvestigatorFullName,
          ResponsiblePartyInvestigatorTitle:
            e.ResponsiblePartyInvestigatorTitle,
          ResponsiblePartyOldNameTitle: e.ResponsiblePartyOldNameTitle,
          ResponsiblePartyOldOrganization: e.ResponsiblePartyOldOrganization,
          ResponsiblePartyType: e.ResponsiblePartyType,
          WhyStopped: e.WhyStopped,
          StudyType: e.StudyType,
          AgeCategories: data[i].StdAge,
          Phases: data[i].Phase,
          conditions: data[i].Condition,
          ReferenceCitation: data[i].ReferenceCitation,

          ///// Legacy Data /////

          drug_role: e.drug_role,
          legacy_search_term: LEGACY_SEARCH_TERM,
          usecase: e.usecase,
          repurpose: Boolean(e.repurpose),
          legacy_import_date: new Date(),
          notes: e.notes,
        },
      });

      // ID of the newly inserted entry
      const entryId = res.id;

      e.locationIds.forEach(
        async (id) =>
          await prisma.locationOnEntries.create({
            data: {
              entryId,
              locationId: id,
            },
          })
      );

      e.conditionMeshTermsIds.forEach(
        async (id, i) =>
          await prisma.conditionMeshTermOnEntries.create({
            data: {
              entryId,
              meshId: id,
            },
          })
      );

      e.interventionMeshTermsIds.forEach(
        async (id, index) =>
          await prisma.interventionMeshTermOnEntries.create({
            data: {
              entryId,
              meshId: id,
              description: data[i].InterventionDescription[index],
            },
          })
      );
    }));


    console.log('Entries after: ', await prisma.entry.count())
  };

  dataPush();
}

main();
