import { PrismaClient } from "@prisma/client";
import { random } from "lodash";
import rl from "readline";
import { createBackup } from "./create-backup";


const prisma = new PrismaClient();

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout,
});


let randomNumber = random(10, 99, false);

let keyphrase = `Confirm ${randomNumber}`

readline.question(`Do you really want to delete the whole database? If so, please enter "${keyphrase}"\n> `, async (input) => {
  

    if(input.trim() == keyphrase){
        
        console.log("Alright, deleting data...")
        //createBackup();
        await prisma.$executeRawUnsafe(`TRUNCATE "ConditionMeshTermOnEntries", "Entry", "InterventionMeshTermOnEntries", "LocationOnEntries", "Location", "MeshTerm" RESTART IDENTITY`);
        console.log("!!! Data has been deleted !!!")
    }else{
        console.log("Abort. NOT deleting data.")
    }

  readline.close();
});

