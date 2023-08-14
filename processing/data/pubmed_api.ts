import axios from 'axios';

//const searchTerm = 'cetirizine AND AU:Smith John';
const searchTerm = 'cetirizine';
const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&term=${searchTerm}&retmax=10`;

axios.get(searchUrl)
  .then(response => {
    const ids = response.data.esearchresult.idlist;
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
    axios.get(fetchUrl)
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.log(`Error: ${error}`);
      });
  })
  .catch(error => {
    console.log(`Error: ${error}`);
  });
