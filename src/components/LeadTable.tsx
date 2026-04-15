import { useState, useMemo } from "react";
import { Lead, LeadStatus, ManagerDecision, ApproachType, ApproachResponse } from "@/lib/types";
import { updateLead } from "@/lib/leads-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Filter, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  leads: Lead[];
  activeTab: string;
  onUpdate: () => void;
}

// Filterable column header
function FilterHeader({ label, values, filter, setFilter }: {
  label: string; values: string[]; filter: string; setFilter: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const unique = useMemo(() => [...new Set(values)].filter(Boolean).sort(), [values]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-xs hover:bg-transparent gap-1">
          {label}
          {filter && <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">{filter}</Badge>}
          <Filter className="h-3 w-3 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 text-xs mb-2"
        />
        <div className="max-h-40 overflow-y-auto space-y-0.5">
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => { setFilter(""); setOpen(false); }}>
            All
          </Button>
          {unique.map((v) => (
            <Button key={v} variant="ghost" size="sm" className="w-full justify-start text-xs h-7 truncate" onClick={() => { setFilter(v); setOpen(false); }}>
              {v}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Inline editable cell
function InlineInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-7 text-xs min-w-[100px]"
    />
  );
}

function DatePickerCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-7 text-xs min-w-[110px] justify-start", !value && "text-muted-foreground")}>
          <CalendarIcon className="h-3 w-3 mr-1" />
          {date ? format(date, "dd.MM.yyyy") : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { if (d) onChange(d.toISOString().split("T")[0]); setOpen(false); }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

function TargetIdentifiedTable({ leads, filters, setFilter, onUpdate }: {
  leads: Lead[]; filters: Record<string, string>; setFilter: (k: string, v: string) => void; onUpdate: () => void;
}) {
  const handleManagerAction = (lead: Lead, decision: ManagerDecision, feedback: string, acronym: string) => {
    const updates: Partial<Lead> = { managerDecision: decision, managerFeedback: feedback, managerAcronym: acronym };
    if (decision === "Yes") {
      updates.status = "1.2 Approach";
    }
    updateLead(lead.id, updates);
    onUpdate();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></TableHead>
          <TableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></TableHead>
          <TableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></TableHead>
          <TableHead><FilterHeader label="Date Added" values={leads.map(l => l.date)} filter={filters.date || ""} setFilter={(v) => setFilter("date", v)} /></TableHead>
          <TableHead>FinStat</TableHead>
          <TableHead>Website</TableHead>
          <TableHead><FilterHeader label="Originator" values={leads.map(l => l.addedBy)} filter={filters.addedBy || ""} setFilter={(v) => setFilter("addedBy", v)} /></TableHead>
          <TableHead>Case Reasoning</TableHead>
          <TableHead>Manager Feedback</TableHead>
          <TableHead>Decision</TableHead>
          <TableHead>Manager</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TargetRow key={lead.id} lead={lead} onAction={handleManagerAction} />
        ))}
      </TableBody>
    </Table>
  );
}

function TargetRow({ lead, onAction }: { lead: Lead; onAction: (lead: Lead, decision: ManagerDecision, feedback: string, acronym: string) => void }) {
  const [feedback, setFeedback] = useState(lead.managerFeedback);
  const [decision, setDecision] = useState<ManagerDecision>(lead.managerDecision || "");
  const [acronym, setAcronym] = useState(lead.managerAcronym || "");

  const save = () => onAction(lead, decision, feedback, acronym);

  return (
    <TableRow>
      <TableCell className="font-medium text-xs">{lead.companyName}</TableCell>
      <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
      <TableCell className="text-xs">{lead.sector}</TableCell>
      <TableCell className="text-xs">{lead.date}</TableCell>
      <TableCell>
        {lead.finstatLink ? <a href={lead.finstatLink} target="_blank" rel="noreferrer" className="text-accent inline-flex items-center gap-1 text-xs"><ExternalLink className="h-3 w-3" />Link</a> : "—"}
      </TableCell>
      <TableCell>
        {lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="text-accent inline-flex items-center gap-1 text-xs"><ExternalLink className="h-3 w-3" />Link</a> : "—"}
      </TableCell>
      <TableCell><Badge variant="outline" className="text-xs">{lead.addedBy}</Badge></TableCell>
      <TableCell className="text-xs max-w-[150px] truncate" title={lead.reasoning}>{lead.reasoning || "—"}</TableCell>
      <TableCell>
        <InlineInput value={feedback} onChange={setFeedback} placeholder="Feedback..." />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Select value={decision} onValueChange={(v) => setDecision(v as ManagerDecision)}>
            <SelectTrigger className="h-7 text-xs min-w-[80px]"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="On hold">On hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input value={acronym} onChange={(e) => setAcronym(e.target.value.toUpperCase())} placeholder="MG" className="h-7 text-xs w-14" maxLength={5} />
          <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={save}>Save</Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ApproachTable({ leads, filters, setFilter, onUpdate }: {
  leads: Lead[]; filters: Record<string, string>; setFilter: (k: string, v: string) => void; onUpdate: () => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></TableHead>
          <TableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></TableHead>
          <TableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></TableHead>
          <TableHead>Date Added</TableHead>
          <TableHead>Mgr Feedback</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Approach Type</TableHead>
          <TableHead>Approach Date</TableHead>
          <TableHead>Response</TableHead>
          <TableHead>Feedback</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <ApproachRow key={lead.id} lead={lead} onUpdate={onUpdate} />
        ))}
      </TableBody>
    </Table>
  );
}

function ApproachRow({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [contact, setContact] = useState(lead.contact || "");
  const [approachType, setApproachType] = useState<ApproachType>(lead.approachType || "");
  const [approachDate, setApproachDate] = useState(lead.approachDate || "");
  const [response, setResponse] = useState<ApproachResponse>(lead.approachResponse || "");
  const [feedback, setFeedback] = useState(lead.approachFeedback || "");

  const save = () => {
    const statusMap: Record<string, LeadStatus> = {
      "Yes": "Yes",
      "No response": "No Response",
      "No": "Declined",
      "Follow-up later": "Follow Up Later",
    };
    const updates: Partial<Lead> = {
      contact, approachType, approachDate, approachResponse: response, approachFeedback: feedback,
    };
    if (response && statusMap[response]) {
      updates.status = statusMap[response];
    }
    updateLead(lead.id, updates);
    onUpdate();
  };

  return (
    <TableRow>
      <TableCell className="font-medium text-xs">{lead.companyName}</TableCell>
      <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
      <TableCell className="text-xs">{lead.sector}</TableCell>
      <TableCell className="text-xs">{lead.date}</TableCell>
      <TableCell className="text-xs max-w-[120px] truncate" title={lead.managerFeedback}>{lead.managerFeedback || "—"}</TableCell>
      <TableCell><InlineInput value={contact} onChange={setContact} placeholder="Contact..." /></TableCell>
      <TableCell>
        <Select value={approachType} onValueChange={(v) => setApproachType(v as ApproachType)}>
          <SelectTrigger className="h-7 text-xs min-w-[90px]"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Email">Email</SelectItem>
            <SelectItem value="Phone">Phone</SelectItem>
            <SelectItem value="Linkedin">LinkedIn</SelectItem>
            <SelectItem value="Personal">Personal</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell><DatePickerCell value={approachDate} onChange={setApproachDate} /></TableCell>
      <TableCell>
        <Select value={response} onValueChange={(v) => setResponse(v as ApproachResponse)}>
          <SelectTrigger className="h-7 text-xs min-w-[110px]"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No response">No response</SelectItem>
            <SelectItem value="No">No</SelectItem>
            <SelectItem value="Follow-up later">Follow-up later</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <InlineInput value={feedback} onChange={setFeedback} placeholder="Feedback..." />
          <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={save}>Save</Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function GenericTable({ leads, filters, setFilter }: {
  leads: Lead[]; filters: Record<string, string>; setFilter: (k: string, v: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></TableHead>
          <TableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></TableHead>
          <TableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></TableHead>
          <TableHead>Date Added</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Feedback</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium text-xs">{lead.companyName}</TableCell>
            <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
            <TableCell className="text-xs">{lead.sector}</TableCell>
            <TableCell className="text-xs">{lead.date}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">{lead.status}</Badge>
            </TableCell>
            <TableCell className="text-xs">{lead.contact || "—"}</TableCell>
            <TableCell className="text-xs">{lead.approachFeedback || lead.managerFeedback || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function LeadTable({ leads, activeTab, onUpdate }: Props) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const setFilter = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value }));

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      return Object.entries(filters).every(([key, val]) => {
        if (!val) return true;
        const field = (lead as any)[key] as string;
        return field?.toLowerCase().includes(val.toLowerCase());
      });
    });
  }, [leads, filters]);

  if (leads.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">No leads in this category yet.</p>;
  }

  const isTargetIdentified = activeTab === "Target Identified";
  const isApproach = activeTab === "Approach";

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      {isTargetIdentified ? (
        <TargetIdentifiedTable leads={filtered} filters={filters} setFilter={setFilter} onUpdate={onUpdate} />
      ) : isApproach ? (
        <ApproachTable leads={filtered} filters={filters} setFilter={setFilter} onUpdate={onUpdate} />
      ) : (
        <GenericTable leads={filtered} filters={filters} setFilter={setFilter} />
      )}
    </div>
  );
}
