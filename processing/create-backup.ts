import { execSync } from "child_process";
import { copyFileSync } from "fs";
require("dotenv").config();

export const createBackup = () => {
  let dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    let date = new Date().toISOString().replace(".", "_").replaceAll(":", "_");
    let filename = `./backups/data_dump_${date}.sql`;

    execSync(`pg_dump ${dbUrl} > ${filename}`);
    execSync(`pg_dump ${dbUrl} > data_dump.sql`);

    console.log("Backing up data.");

    console.log("Sucessful.", filename);
    console.log("Sucessfully overwritten data_dump.sql in root.");
  } else {
    console.error("No database url, backup NOT successful.");
  }
};


if(require.main === module){
    createBackup();
}