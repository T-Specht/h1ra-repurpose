## Repurposing of H1-receptor antagonists (levo)cetirizine, (des)loratadine and fexofenadine as a case study for systematic analysis of trials on clinicaltrials.gov using semi-automated processes with custom-coded software

This repository includes the custom coded software corresponding to the paper with the title above. The software is split into three main components in individual directories (`./processing`, `./study-edit`, `./analysis`) which is explained in detail in the paper.

![Overview of sotfware components and composition](./overview.png)

## Prerequisites

All components use a **PostgresSQL** database for data storage which needs to be installed. The database connection string needs to be added in every component folder by creating a `.env` file in *each* folder and adding `DATABASE_URL="postgresql://[...]"` to the file.

For `./processing` and `./study-edit`, **NodeJS** is required.

For `./analysis`, Python is required. Addionally the following libraries need to be installed, if not included with the python installation: `jupyter, pandas, seaborn, matplotlib, numpy, sqlalchemy, geopandas, pycountry, python-dotenv`


## Components

### ./processing: TypeScript scritps for data download, processing and database management

Install requirements using:
```
cd ./processing
yarn install
yarn prisma generate
```

- `data/api_download.ts`: downloads the newest study data to a temporary .json automatically named based on the current date
- `data/processing.ts`: processes the downloaded data after reading it from the .json file (needs to be adjusted to read the correct file)
- `data/processing.ts`: processes the downloaded data after reading it from the .json file (needs to be adjusted to read the correct file)
- `data/checkForUpdates.ts`: compares two .json files of downloaded data and references data stored in database
- `create-backup.ts`: writes a backup of the database to file
- `delete_all_data.ts`: removes all data from database, use with caution

### ./study-edit: A next.js (t3) web app for editing and annotating the study data stored in a database

Install requirements using:
```
cd ./study-edit
yarn install
yarn prisma-generate
```

Start the web application using `yarn dev` and access it via http://localhost:3000/

ℹ️ We intially embedded the clinicaltrials.gov website for a given trial using a simple iframe but this is no longer possible due to changed X-Frame-Options headers, most likely added during the transition to the updated clinicaltrials.gov website. Therefore, we request the given HTML document through the local api endpoint `/api/ctg/[NctId]`. If required, this could be circumvented by converting the application to an [Electron](https://www.electronjs.org/) app and using the <webview> tag for embedding. The api directory also includes tools for caching this HTML data.


### ./analysis

See the prerequisites above.

The Jupyter notebook automatically exports the data as .csv files to the `./analysis/pvt/` directory. This data can then be imported into other software solutions like GraphPad Prism for more advanced graphical anaylsis.