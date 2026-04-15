export type LeadStatus =
  | "1.1 Target Identified"
  | "1.2 Approach"
  | "Yes"
  | "No Response"
  | "Declined"
  | "Follow Up Later"
  | "Proposal"
  | "Client Mandate";

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
}
