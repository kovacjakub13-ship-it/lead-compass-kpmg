import { Lead } from "./types";

const STORAGE_KEY = "kpmg-busde-leads";

export function getLeads(): Lead[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveLeads(leads: Lead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function addLead(lead: Lead) {
  const leads = getLeads();
  leads.push(lead);
  saveLeads(leads);
}

export function updateLead(id: string, updates: Partial<Lead>) {
  const leads = getLeads().map((l) => (l.id === id ? { ...l, ...updates } : l));
  saveLeads(leads);
}

export function deleteLead(id: string) {
  const leads = getLeads().filter((l) => l.id !== id);
  saveLeads(leads);
}

export function duplicateLead(id: string): Lead | undefined {
  const leads = getLeads();
  const original = leads.find((l) => l.id === id);
  if (!original) return undefined;
  const copy: Lead = { ...original, id: crypto.randomUUID() };
  leads.push(copy);
  saveLeads(leads);
  return copy;
}
