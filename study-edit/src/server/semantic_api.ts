export interface SemanticAPIResponse {
    total:  number;
    offset: number;
    data:   Datum[];
}

export interface Datum {
    paperId:       string;
    externalIds:   ExternalIDS;
    url:           string;
    title:         string;
    abstract:      null | string;
    year:          number;
    openAccessPdf: OpenAccessPDF | null;
    fieldsOfStudy: string[];
    tldr:          Tldr;
    journal:       Journal;
    authors:       Author[];
}

export interface Author {
    authorId: string;
    name:     string;
}

export interface ExternalIDS {
    MAG:            string;
    PubMedCentral?: string;
    DOI:            string;
    CorpusId:       number;
    PubMed?:        string;
}

export interface Journal {
    name:   string;
    pages:  string;
    volume: string;
}

export interface OpenAccessPDF {
    url:    string;
    status: string;
}

export interface Tldr {
    model: string;
    text:  string;
}
