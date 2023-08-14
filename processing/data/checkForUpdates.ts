import { APIResultType } from "./apiResultType";
import { apiDownload } from "./api_download";
import { createHash } from "crypto";
import _ from "lodash";

function getObjectDiff(obj1: any, obj2: any) {
  const diff = Object.keys(obj1).reduce((result, key) => {
    if (!obj2.hasOwnProperty(key)) {
      result.push(key);
    } else if (_.isEqual(obj1[key], obj2[key])) {
      const resultKeyIndex = result.indexOf(key);
      result.splice(resultKeyIndex, 1);
    }
    return result;
  }, Object.keys(obj2));

  return diff;
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const date = new Date().toISOString().split("T")[0];
const saveFileName = `api_results_update_${date}.json`;

let main = async () => {
  await apiDownload(true, `./${saveFileName}`);

  const {
    data: oldData,
    date: oldCrawlDate,
  }: APIResultType = require("../api_results.json");
  const {
    data: newData,
    date: newCrawlDate,
  }: APIResultType = require(`../${saveFileName}`);

  // Check length

  console.log("old", oldData.length);
  console.log("New", newData.length);

  let newEntries = newData.filter((d) => {
    const nct = d.NCTId[0];
    let res = !oldData.find((e) => e.NCTId[0] == nct);
    return res;
  });

  let changedEntries = newData.filter((d) => {
    const nct = d.NCTId[0];
    let correspondingOldEntry = oldData.find((e) => e.NCTId[0] == nct);

    if (!correspondingOldEntry) {
      return false;
    } else {
      let lastUpdateOld = correspondingOldEntry.LastUpdatePostDate[0];
      let lastUpdateNew = d.LastUpdatePostDate[0];
      return lastUpdateOld != lastUpdateNew;
    }
  });

  console.log("New entries:", newEntries.length);

  console.table(
    newEntries.map((e) => ({
      nct: e.NCTId,
      title: e.BriefTitle[0].slice(0, 100) + "...",
      startDate: e.StartDate,
    }))
  );

  console.log("Updated entries:", changedEntries.length);

  console.log(
    await Promise.all(
      changedEntries.map(async (e) => {
        let entryInDb = await prisma.entry.findFirst({
          where: {
            NCTId: {
              equals: e.NCTId[0],
            },
          },
        });

        let correspondingOldEntry = oldData.find(
          (e) => e.NCTId[0] == e.NCTId[0]
        )!;

        let diff = (Object.keys(e) as Array<keyof typeof e>).filter((k) => {
          let str = (obj: any) => {
            let r = JSON.stringify(obj).trim().toLowerCase();
            //console.log(r);

            return r;
          };
          return str(e[k]) != str(correspondingOldEntry[k]);
        });

        return {
          nct: e.NCTId[0],
          title: e.BriefTitle[0],
          update: e.LastUpdatePostDate[0],
          repurpose: entryInDb?.repurpose,
          usecase: entryInDb?.usecase,
          role: entryInDb?.drug_role,
          linkToCompare: `https://clinicaltrials.gov/ct2/history/${e.NCTId[0]}`,
        };
      })
    )
  );
};

main();
