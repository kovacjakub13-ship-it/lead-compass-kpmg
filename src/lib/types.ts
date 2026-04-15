export type LeadStatus =
  | "1.1 Target Identified"
  | "1.2 Approach"
  | "2.1 Yes"
  | "2.2 No Response"
  | "2.3 Declined"
  | "2.4 Follow Up Later"
  | "3.1 Yes - Proposal"
  | "4.1 Client Mandate";

export type ManagerDecision = "Yes" | "No" | "On hold" | "";
export type ApproachType = "Email" | "Phone" | "Linkedin" | "Personal" | "";
export type ApproachResponse = "Yes" | "No response" | "No" | "Follow-up later" | "";

export interface Lead {
  id: string;
  companyName: string;
  ico: string;
  sector: string;
  sourceType: string;
  date: string;
  website: string;
  finstatLink: string;
  reasoning: string;
  addedBy: string;
  status: LeadStatus;
  contact: string;
  manager: string;
  managerFeedback: string;
  managerAcronym: string;
  managerDecision: ManagerDecision;
  approachType: ApproachType;
  approachDate: string;
  approachResponse: ApproachResponse;
  approachFeedback: string;
}
