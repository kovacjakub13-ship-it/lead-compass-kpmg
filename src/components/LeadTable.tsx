import { useState } from "react";
import { Lead, LeadStatus } from "@/lib/types";
import { updateLead } from "@/lib/leads-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye } from "lucide-react";

const STATUS_OPTIONS: LeadStatus[] = [
  "1.1 Target Identified",
  "1.2 Approach",
  "Yes",
  "No Response",
  "Declined",
  "Follow Up Later",
  "Proposal",
  "Client Mandate",
];

const statusColor: Record<LeadStatus, string> = {
  "1.1 Target Identified": "bg-muted text-muted-foreground",
  "1.2 Approach": "bg-accent text-accent-foreground",
  "Yes": "bg-success text-success-foreground",
  "No Response": "bg-warning text-warning-foreground",
  "Declined": "bg-destructive text-destructive-foreground",
  "Follow Up Later": "bg-secondary text-secondary-foreground",
  "Proposal": "bg-primary text-primary-foreground",
  "Client Mandate": "bg-success text-success-foreground",
};

interface Props {
  leads: Lead[];
  onUpdate: () => void;
}

function LeadDetailDialog({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [contact, setContact] = useState(lead.contact);
  const [manager, setManager] = useState(lead.manager);
  const [feedback, setFeedback] = useState(lead.managerFeedback);
  const [status, setStatus] = useState<LeadStatus>(lead.status);

  const save = () => {
    updateLead(lead.id, { contact, manager, managerFeedback: feedback, status });
    onUpdate();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{lead.companyName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><span className="text-muted-foreground">IČO:</span> {lead.ico}</div>
          <div><span className="text-muted-foreground">Sector:</span> {lead.sector}</div>
          <div><span className="text-muted-foreground">Source:</span> {lead.sourceType || "—"}</div>
          <div><span className="text-muted-foreground">Date:</span> {lead.date}</div>
          <div><span className="text-muted-foreground">Added by:</span> {lead.addedBy}</div>
        </div>
        {lead.reasoning && <div><span className="text-muted-foreground">Reasoning:</span> {lead.reasoning}</div>}
        <div className="flex gap-3">
          {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="text-accent underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />Website</a>}
          {lead.finstatLink && <a href={lead.finstatLink} target="_blank" rel="noreferrer" className="text-accent underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />FinStat</a>}
        </div>
        <hr />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact person / email" />
          </div>
          <div className="space-y-1.5">
            <Label>Manager</Label>
            <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Assigned manager" />
          </div>
          <div className="space-y-1.5">
            <Label>Manager Feedback</Label>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Manager notes..." rows={3} />
          </div>
        </div>
        <Button onClick={save} className="w-full">Save Changes</Button>
      </div>
    </DialogContent>
  );
}

export default function LeadTable({ leads, onUpdate }: Props) {
  if (leads.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">No leads in this category yet.</p>;
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>IČO</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.companyName}</TableCell>
              <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
              <TableCell>{lead.sector}</TableCell>
              <TableCell className="text-xs">{lead.date}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{lead.addedBy}</Badge></TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[lead.status]}`}>
                  {lead.status}
                </span>
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <LeadDetailDialog lead={lead} onUpdate={onUpdate} />
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
