import axios from "axios";
import { readFileSync } from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { CACHED_STYLES } from "../[nct]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = req.query.url as string;

  if (CACHED_STYLES.includes(url)) {
    
    let lastPart = url.split('/').at(-1);

    if(lastPart){
      lastPart = lastPart.replace(/\?.+/, '');
      res.end(readFileSync(`${process.cwd()}/proxy_cached_content/styles/${lastPart}`));
      
    }else{
       return res.status(404).end();
    }
  } else {
    const result = await axios.get(url);
    res.end(result.data);
  }

  
}
