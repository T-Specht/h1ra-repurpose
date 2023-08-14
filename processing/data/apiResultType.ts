// TypeScript types for expected API results

export interface APIResultType {
  date: Date;
  data: DataPoint[];
}

export interface DataPoint {
  Rank: number;
  OfficialTitle: string[];
  BriefTitle: string[];
  OverallStatus: Status[];
  BriefSummary: string[];
  Condition: string[];
  ConditionMeshTerm: string[];
  DesignInterventionModel: DesignInterventionModel[];
  LeadSponsorName: string[];
  LeadSponsorClass: Class[];
  CollaboratorName: string[];
  CollaboratorClass: Class[];
  Gender: Gender[];
  MaximumAge: string[];
  MinimumAge: string[];
  StdAge: StdAge[];
  Phase: Phase[];
  EnrollmentCount: string[];
  EnrollmentType: EnrollmentType[];
  OrgClass: Class[];
  NCTId: string[];
  OrgFullName: string[];
  DesignAllocation: DesignAllocation[];
  DesignInterventionModelDescription: string[];
  DesignMasking: DesignMasking[];
  DesignMaskingDescription: string[];
  DesignObservationalModel: string[];
  DesignPrimaryPurpose: DesignPrimaryPurpose[];
  DesignTimePerspective: DesignTimePerspective[];
  DesignWhoMasked: DesignWhoMasked[];
  DetailedDescription: string[];
  StartDate: string[];
  PrimaryCompletionDate: string[];
  CompletionDate: string[];
  StudyFirstPostDate: string[];
  ResultsFirstPostDate: string[];
  LastUpdatePostDate: string[];
  LocationCity: string[];
  LocationContactEMail: string[];
  LocationContactName: string[];
  LocationContactPhone: string[];
  LocationContactPhoneExt: string[];
  LocationContactRole: LocationContactRole[];
  LocationCountry: string[];
  LocationFacility: string[];
  LocationState: string[];
  LocationStatus: Status[];
  LocationZip: string[];
  InterventionMeshTerm: string[];
  InterventionDescription: string[];
  InterventionBrowseLeafRelevance: InterventionBrowseLeafRelevance[];
  InterventionBrowseLeafName: string[];
  ConditionBrowseLeafName: string[];
  ConditionAncestorTerm: string[];
  OverallOfficialAffiliation: string[];
  PointOfContactOrganization: string[];
  ReferenceCitation: string[];
  ResponsiblePartyInvestigatorAffiliation: string[];
  ResponsiblePartyInvestigatorFullName: string[];
  ResponsiblePartyInvestigatorTitle: string[];
  ResponsiblePartyOldNameTitle: string[];
  ResponsiblePartyOldOrganization: string[];
  ResponsiblePartyType: ResponsiblePartyType[];
  WhyStopped: string[];
  StudyType: string[];
}

export enum Class {
  Fed = "FED",
  Industry = "INDUSTRY",
  Network = "NETWORK",
  Nih = "NIH",
  Other = "OTHER",
  OtherGov = "OTHER_GOV",
  Unknown = "UNKNOWN",
}

export enum DesignAllocation {
  NA = "N/A",
  NonRandomized = "Non-Randomized",
  Randomized = "Randomized",
}

export enum DesignInterventionModel {
  CrossoverAssignment = "Crossover Assignment",
  FactorialAssignment = "Factorial Assignment",
  ParallelAssignment = "Parallel Assignment",
  SequentialAssignment = "Sequential Assignment",
  SingleGroupAssignment = "Single Group Assignment",
}

export enum DesignMasking {
  Double = "Double",
  NoneOpenLabel = "None (Open Label)",
  Quadruple = "Quadruple",
  Single = "Single",
  Triple = "Triple",
}

export enum DesignPrimaryPurpose {
  BasicScience = "Basic Science",
  Diagnostic = "Diagnostic",
  Other = "Other",
  Prevention = "Prevention",
  SupportiveCare = "Supportive Care",
  Treatment = "Treatment",
}

export enum DesignTimePerspective {
  CrossSectional = "Cross-Sectional",
  Prospective = "Prospective",
  Retrospective = "Retrospective",
}

export enum DesignWhoMasked {
  CareProvider = "Care Provider",
  Investigator = "Investigator",
  OutcomesAssessor = "Outcomes Assessor",
  Participant = "Participant",
}

export enum EnrollmentType {
  Actual = "Actual",
  Anticipated = "Anticipated",
}

export enum Gender {
  All = "All",
  Female = "Female",
  Male = "Male",
}

export enum InterventionBrowseLeafRelevance {
  High = "high",
  Low = "low",
}

export enum LocationContactRole {
  Contact = "Contact",
  PrincipalInvestigator = "Principal Investigator",
  SubInvestigator = "Sub-Investigator",
}

export enum Status {
  ActiveNotRecruiting = "Active, not recruiting",
  Available = "Available",
  Completed = "Completed",
  EnrollingByInvitation = "Enrolling by invitation",
  NotYetRecruiting = "Not yet recruiting",
  Recruiting = "Recruiting",
  Suspended = "Suspended",
  Terminated = "Terminated",
  UnknownStatus = "Unknown status",
  Withdrawn = "Withdrawn",
}

export enum Phase {
  EarlyPhase1 = "Early Phase 1",
  NotApplicable = "Not Applicable",
  Phase1 = "Phase 1",
  Phase2 = "Phase 2",
  Phase3 = "Phase 3",
  Phase4 = "Phase 4",
}

export enum ResponsiblePartyType {
  PrincipalInvestigator = "Principal Investigator",
  Sponsor = "Sponsor",
  SponsorInvestigator = "Sponsor-Investigator",
}

export enum StdAge {
  Adult = "Adult",
  Child = "Child",
  OlderAdult = "Older Adult",
}
