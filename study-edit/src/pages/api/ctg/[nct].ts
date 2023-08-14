import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

import { load } from "cheerio";
import { readdirSync, readFileSync } from "fs";

export const CACHED_STYLES = [
  "https://clinicaltrials.gov/ct2/html/css/trial-record.css?v=48",
  "https://clinicaltrials.gov/ct2/html/css/base.css?v=48",
  "https://clinicaltrials.gov/ct2/html/css/glossary.css?v=48",
  "https://clinicaltrials.gov/ct2/html/css/w3-ct.css?v=48",
  "https://clinicaltrials.gov/ct2/html/jquery/css/superfish.css?v=48",
  "https://clinicaltrials.gov/ct2/html/jquery/css/superfish-vertical.css?v=48",
];

export const getTrialHtml = async (nct: string) => {
  const result = await axios.get(`https://clinicaltrials.gov/ct2/show/${nct}`);
  let html = result.data as string;
  html = html
    .replace("history.replaceState(null,null,theURL);", "")
    .replaceAll("&nbsp;", "");
  const $ = load(html);

  CACHED_STYLES.forEach((url) => {
    $("head").append(
      `<link rel="stylesheet" href="/api/ctg/proxy/${encodeURIComponent(
        url
      )}" type="text/css">`
    );
  });

  $("img").map((i, img) => {
    const $img = $(img);
    $img.attr("src", `https://clinicaltrials.gov/${$img.attr("src")!}`);
    return $img;
  });
  return $.html();
};

const CACHE_DIR = `${process.cwd()}/proxy_cached_content/html/`;

const CACHE = readdirSync(CACHE_DIR)
  .filter((e) => e.endsWith(".html"))
  .map((e) => e.replace(".html", ""));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const nct = req.query.nct as string;
  const nocache = req.query.nocache == "true" ? true : false;

  if (CACHE.includes(nct) && !nocache) {
    // Serve from cache
    console.log(`Serving ${nct} from cache...`);
    res.end(readFileSync(`${CACHE_DIR}/${nct}.html`));
  } else {
    console.log(`Serving ${nct} !! LIVE !!...`);
    res.end(await getTrialHtml(nct));
  }

  //res.status(200).json({ name: "John Doe", body: req.query });
}
