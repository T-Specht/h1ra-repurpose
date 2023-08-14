import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getTrialHtml } from "./[nct]";

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Content-Encoding", "none");

  const printLine = (str: string) => res.write(str + "\n");

  const ncts = (
    await prisma.entry.findMany({
      distinct: "NCTId",
      select: {
        NCTId: true,
      },
    })
  );

  const cwd = process.cwd();

  printLine(cwd);

  for (const [i, { NCTId }] of ncts.entries()) {
    const timeout = randomIntFromInterval(500, 1500);

    printLine(
      `Downloading ${NCTId} (${i + 1}/${ncts.length} [${
        Math.round((i / ncts.length) * 1000) / 10
      }%])...`
    );

    const filepath = `${cwd}/proxy_cached_content/html/${NCTId}.html`;
    const html = await getTrialHtml(NCTId);

    printLine(`Writing file ${filepath}`);

    writeFileSync(filepath, html);

    printLine(`Sleeping ${timeout} ms...`);
    await sleep(timeout);
  }

  res.end("Done.");
}
