import { useState, useMemo, useRef, useCallback } from "react";
import { Lead, LeadStatus, ManagerDecision, ApproachType, ApproachResponse, FollowUpResponse } from "@/lib/types";
import { updateLead, deleteLead, duplicateLead } from "@/lib/leads-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Filter, CalendarIcon, MoreVertical, Trash2, Copy, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  leads: Lead[];
  activeTab: string;
  onUpdate: () => void;
}

function exportLeadsToExcel(leads: Lead[]) {
  const headers = ["Company Name", "IČO", "Sector", "Source Type", "Date", "Website", "FinStat", "Originator", "Reasoning", "Status", "Contact", "Manager Feedback", "Manager", "Approach Type", "Approach Date", "Response", "Client Feedback", "Response Date"];
  const rows = leads.map(l => [l.companyName, l.ico, l.sector, l.sourceType, l.date, l.website, l.finstatLink, l.addedBy, l.reasoning, l.status, l.contact, l.managerFeedback, l.managerAcronym, l.approachType, l.approachDate, l.approachResponse, l.approachFeedback, l.responseDate || ""]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join("\t")).join("\n");
  const blob = new Blob([csv], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads_export.xls";
  a.click();
  URL.revokeObjectURL(url);
}

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

function RowActions({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => { duplicateLead(lead.id); toast.success("Lead duplicated"); onUpdate(); }}>
          <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportLeadsToExcel([lead])}>
          <Download className="h-3.5 w-3.5 mr-2" /> Export
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => { deleteLead(lead.id); toast.success("Lead deleted"); onUpdate(); }}>
          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  return differenceInDays(new Date(), new Date(dateStr));
}

/* ---- Resizable column header ---- */
function ResizableHead({ children, minWidth = 60 }: { children: React.ReactNode; minWidth?: number }) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = ref.current?.offsetWidth || 100;
    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(minWidth, startWidth + ev.clientX - startX);
      setWidth(newW);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [minWidth]);

  return (
    <TableHead ref={ref} style={width ? { width, minWidth: width } : {}} className="relative">
      {children}
      <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 bg-border"
      />
    </TableHead>
  );
}

/* ===================== TARGET IDENTIFIED ===================== */
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
          <TableHead className="w-10"></TableHead>
          <ResizableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Date Added" values={leads.map(l => l.date)} filter={filters.date || ""} setFilter={(v) => setFilter("date", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="FinStat" values={leads.map(l => l.finstatLink ? "Has link" : "")} filter={filters.finstatLink || ""} setFilter={(v) => setFilter("finstatLink", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Website" values={leads.map(l => l.website ? "Has link" : "")} filter={filters.website || ""} setFilter={(v) => setFilter("website", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Originator" values={leads.map(l => l.addedBy)} filter={filters.addedBy || ""} setFilter={(v) => setFilter("addedBy", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Reasoning" values={leads.map(l => l.reasoning)} filter={filters.reasoning || ""} setFilter={(v) => setFilter("reasoning", v)} /></ResizableHead>
          <ResizableHead minWidth={120}><FilterHeader label="Mgr Feedback" values={leads.map(l => l.managerFeedback)} filter={filters.managerFeedback || ""} setFilter={(v) => setFilter("managerFeedback", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Decision" values={leads.map(l => l.managerDecision)} filter={filters.managerDecision || ""} setFilter={(v) => setFilter("managerDecision", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Manager" values={leads.map(l => l.managerAcronym)} filter={filters.managerAcronym || ""} setFilter={(v) => setFilter("managerAcronym", v)} /></ResizableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TargetRow key={lead.id} lead={lead} onAction={handleManagerAction} onUpdate={onUpdate} />
        ))}
      </TableBody>
    </Table>
  );
}

function TargetRow({ lead, onAction, onUpdate }: { lead: Lead; onAction: (lead: Lead, decision: ManagerDecision, feedback: string, acronym: string) => void; onUpdate: () => void }) {
  const [feedback, setFeedback] = useState(lead.managerFeedback);
  const [decision, setDecision] = useState<ManagerDecision>(lead.managerDecision || "");
  const [acronym, setAcronym] = useState(lead.managerAcronym || "");

  const save = () => onAction(lead, decision, feedback, acronym);

  return (
    <TableRow>
      <TableCell><RowActions lead={lead} onUpdate={onUpdate} /></TableCell>
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
        <Input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Manager feedback..."
          className="text-xs h-7 min-w-[120px]"
        />
      </TableCell>
      <TableCell>
        <Select value={decision} onValueChange={(v) => setDecision(v as ManagerDecision)}>
          <SelectTrigger className="h-7 text-xs min-w-[80px]"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
            <SelectItem value="On hold">On hold</SelectItem>
          </SelectContent>
        </Select>
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

/* ===================== APPROACH ===================== */
function ApproachTable({ leads, filters, setFilter, onUpdate }: {
  leads: Lead[]; filters: Record<string, string>; setFilter: (k: string, v: string) => void; onUpdate: () => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <ResizableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Date Added" values={leads.map(l => l.date)} filter={filters.date || ""} setFilter={(v) => setFilter("date", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Mgr Feedback" values={leads.map(l => l.managerFeedback)} filter={filters.managerFeedback || ""} setFilter={(v) => setFilter("managerFeedback", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Contact" values={leads.map(l => l.contact)} filter={filters.contact || ""} setFilter={(v) => setFilter("contact", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Approach Type" values={leads.map(l => l.approachType)} filter={filters.approachType || ""} setFilter={(v) => setFilter("approachType", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Approach Date" values={leads.map(l => l.approachDate)} filter={filters.approachDate || ""} setFilter={(v) => setFilter("approachDate", v)} /></ResizableHead>
          <TableHead className="w-[2px] p-0"><div className="w-[3px] h-full bg-primary/30 mx-auto" /></TableHead>
          <ResizableHead><FilterHeader label="Response" values={leads.map(l => l.approachResponse)} filter={filters.approachResponse || ""} setFilter={(v) => setFilter("approachResponse", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Response Date" values={leads.map(l => l.responseDate || "")} filter={filters.responseDate || ""} setFilter={(v) => setFilter("responseDate", v)} /></ResizableHead>
          <ResizableHead minWidth={180}><FilterHeader label="Client Feedback" values={leads.map(l => l.approachFeedback)} filter={filters.approachFeedback || ""} setFilter={(v) => setFilter("approachFeedback", v)} /></ResizableHead>
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

  const saveField = useCallback((field: string, value: string) => {
    updateLead(lead.id, { [field]: value });
    onUpdate();
  }, [lead.id, onUpdate]);

  const savePostResponse = () => {
    const statusMap: Record<string, LeadStatus> = {
      "Yes": "2.1 Yes - Proposal",
      "No response": "2.2 No Response",
      "Declined": "2.3 Declined",
      "Follow-up later": "2.4 Follow Up Later",
    };
    const today = new Date().toISOString().split("T")[0];
    const updates: Partial<Lead> = {
      contact, approachType, approachDate, approachResponse: response, approachFeedback: feedback,
      responseDate: today,
    };
    if (response && statusMap[response]) {
      updates.status = statusMap[response];
    }
    updateLead(lead.id, updates);
    onUpdate();
  };

  return (
    <TableRow>
      <TableCell><RowActions lead={lead} onUpdate={onUpdate} /></TableCell>
      <TableCell className="font-medium text-xs">{lead.companyName}</TableCell>
      <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
      <TableCell className="text-xs">{lead.sector}</TableCell>
      <TableCell className="text-xs">{lead.date}</TableCell>
      <TableCell className="text-xs max-w-[120px] truncate" title={lead.managerFeedback}>{lead.managerFeedback || "—"}</TableCell>
      <TableCell>
        <Input
          value={contact}
          onChange={(e) => {
            const nextValue = e.target.value;
            setContact(nextValue);
            saveField("contact", nextValue);
          }}
          placeholder="Contact..."
          className="h-7 text-xs min-w-[100px] bg-muted/50"
        />
      </TableCell>
      <TableCell>
        <Select value={approachType} onValueChange={(v) => {
          const at = v as ApproachType;
          setApproachType(at);
          saveField("approachType", at);
        }}>
          <SelectTrigger className="h-7 text-xs min-w-[90px] bg-muted/50"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Email">Email</SelectItem>
            <SelectItem value="Phone">Phone</SelectItem>
            <SelectItem value="Linkedin">LinkedIn</SelectItem>
            <SelectItem value="Personal">Personal</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="bg-muted/50 rounded">
          <DatePickerCell value={approachDate} onChange={(v) => {
            setApproachDate(v);
            saveField("approachDate", v);
          }} />
        </div>
      </TableCell>
      <TableCell className="w-[2px] p-0"><div className="w-[3px] h-full bg-primary/30 mx-auto min-h-[40px]" /></TableCell>
      <TableCell>
        <Select value={response} onValueChange={(v) => setResponse(v as ApproachResponse)}>
          <SelectTrigger className="h-7 text-xs min-w-[110px]"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No response">No response</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
            <SelectItem value="Follow-up later">Follow-up later</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{lead.responseDate || "—"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Client feedback..." className="h-7 text-xs min-w-[180px]" />
          <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={savePostResponse}>Save</Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ===================== NO RESPONSE ===================== */
function NoResponseTable({ leads, filters, setFilter, onUpdate }: {
  leads: Lead[]; filters: Record<string, string>; setFilter: (k: string, v: string) => void; onUpdate: () => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <ResizableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Date Added" values={leads.map(l => l.date)} filter={filters.date || ""} setFilter={(v) => setFilter("date", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Contact" values={leads.map(l => l.contact)} filter={filters.contact || ""} setFilter={(v) => setFilter("contact", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Approach Type" values={leads.map(l => l.approachType)} filter={filters.approachType || ""} setFilter={(v) => setFilter("approachType", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Time Since Approach" values={leads.map(l => `${daysSince(l.approachDate)} days`)} filter={filters.timeSince || ""} setFilter={(v) => setFilter("timeSince", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Followed Up?" values={leads.map(l => l.followedUp || "")} filter={filters.followedUp || ""} setFilter={(v) => setFilter("followedUp", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Follow-up Response" values={leads.map(l => l.followUpResponse || "")} filter={filters.followUpResponse || ""} setFilter={(v) => setFilter("followUpResponse", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Client Feedback" values={leads.map(l => l.followUpFeedback || "")} filter={filters.followUpFeedback || ""} setFilter={(v) => setFilter("followUpFeedback", v)} /></ResizableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <NoResponseRow key={lead.id} lead={lead} onUpdate={onUpdate} />
        ))}
      </TableBody>
    </Table>
  );
}

function NoResponseRow({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [followedUp, setFollowedUp] = useState<"Yes" | "No" | "">(lead.followedUp || "");
  const [followUpResponse, setFollowUpResponse] = useState<FollowUpResponse>(lead.followUpResponse || "");
  const [followUpFeedback, setFollowUpFeedback] = useState(lead.followUpFeedback || "");

  const handleFollowUpChange = (val: "Yes" | "No") => {
    setFollowedUp(val);
    updateLead(lead.id, { followedUp: val });
    if (val === "No") {
      setFollowUpResponse("");
      setFollowUpFeedback("");
      updateLead(lead.id, { followedUp: val, followUpResponse: "", followUpFeedback: "" });
    }
  };

  const handleFollowUpResponse = (val: FollowUpResponse) => {
    setFollowUpResponse(val);
    const statusMap: Record<string, LeadStatus> = {
      "Yes": "2.1 Yes - Proposal",
      "No response": "2.2 No Response",
      "Follow-up later": "2.4 Follow Up Later",
      "No": "2.3 Declined",
    };
    const updates: Partial<Lead> = { followUpResponse: val, followUpFeedback };
    if (val && statusMap[val] && statusMap[val] !== "2.2 No Response") {
      updates.status = statusMap[val];
    }
    updateLead(lead.id, updates);
    onUpdate();
  };

  const saveFeedback = () => {
    updateLead(lead.id, { followUpFeedback });
  };

  return (
    <TableRow>
      <TableCell><RowActions lead={lead} onUpdate={onUpdate} /></TableCell>
      <TableCell className="font-medium text-xs">{lead.companyName}</TableCell>
      <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
      <TableCell className="text-xs">{lead.sector}</TableCell>
      <TableCell className="text-xs">{lead.date}</TableCell>
      <TableCell className="text-xs">{lead.contact || "—"}</TableCell>
      <TableCell className="text-xs">{lead.approachType || "—"}</TableCell>
      <TableCell className="text-xs font-mono">{lead.approachDate ? `${daysSince(lead.approachDate)} days` : "—"}</TableCell>
      <TableCell>
        <Select value={followedUp} onValueChange={(v) => handleFollowUpChange(v as "Yes" | "No")}>
          <SelectTrigger className="h-7 text-xs min-w-[70px]"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {followedUp === "Yes" ? (
          <Select value={followUpResponse} onValueChange={(v) => handleFollowUpResponse(v as FollowUpResponse)}>
            <SelectTrigger className="h-7 text-xs min-w-[110px]"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No response">No response</SelectItem>
              <SelectItem value="Follow-up later">Follow-up later</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        {followedUp === "Yes" && followUpResponse ? (
          <div className="flex items-center gap-1">
            <Input value={followUpFeedback} onChange={(e) => setFollowUpFeedback(e.target.value)} placeholder="Client feedback..." className="h-7 text-xs min-w-[150px]" />
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={saveFeedback}>Save</Button>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </TableCell>
    </TableRow>
  );
}

/* ===================== DECLINED ===================== */
function DeclinedTable({ leads, filters, setFilter, onUpdate }: {
  leads: Lead[]; filters: Record<string, string>; setFilter: (k: string, v: string) => void; onUpdate: () => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <ResizableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Date Added" values={leads.map(l => l.date)} filter={filters.date || ""} setFilter={(v) => setFilter("date", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Contact" values={leads.map(l => l.contact)} filter={filters.contact || ""} setFilter={(v) => setFilter("contact", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Client Feedback" values={leads.map(l => l.approachFeedback)} filter={filters.approachFeedback || ""} setFilter={(v) => setFilter("approachFeedback", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Time Since Last Communication" values={leads.map(l => `${daysSince(l.responseDate || l.date)} days`)} filter={filters.timeSince || ""} setFilter={(v) => setFilter("timeSince", v)} /></ResizableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell><RowActions lead={lead} onUpdate={onUpdate} /></TableCell>
            <TableCell className="font-medium text-xs">{lead.companyName}</TableCell>
            <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
            <TableCell className="text-xs">{lead.sector}</TableCell>
            <TableCell className="text-xs">{lead.date}</TableCell>
            <TableCell className="text-xs">{lead.contact || "—"}</TableCell>
            <TableCell className="text-xs">{lead.approachFeedback || "—"}</TableCell>
            <TableCell className="text-xs font-mono">{daysSince(lead.responseDate || lead.date)} days</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ===================== GENERIC / ALL ===================== */
function GenericTable({ leads, filters, setFilter, onUpdate, activeTab }: {
  leads: Lead[]; filters: Record<string, string>; setFilter: (k: string, v: string) => void; onUpdate: () => void; activeTab: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <ResizableHead><FilterHeader label="Company" values={leads.map(l => l.companyName)} filter={filters.companyName || ""} setFilter={(v) => setFilter("companyName", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="IČO" values={leads.map(l => l.ico)} filter={filters.ico || ""} setFilter={(v) => setFilter("ico", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Sector" values={leads.map(l => l.sector)} filter={filters.sector || ""} setFilter={(v) => setFilter("sector", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Date Added" values={leads.map(l => l.date)} filter={filters.date || ""} setFilter={(v) => setFilter("date", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Originator" values={leads.map(l => l.addedBy)} filter={filters.addedBy || ""} setFilter={(v) => setFilter("addedBy", v)} /></ResizableHead>
          {activeTab === "All" && (
            <ResizableHead><FilterHeader label="Status" values={leads.map(l => l.status)} filter={filters.status || ""} setFilter={(v) => setFilter("status", v)} /></ResizableHead>
          )}
          <ResizableHead><FilterHeader label="Contact" values={leads.map(l => l.contact)} filter={filters.contact || ""} setFilter={(v) => setFilter("contact", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label="Feedback" values={leads.map(l => l.approachFeedback || l.managerFeedback)} filter={filters.feedback || ""} setFilter={(v) => setFilter("feedback", v)} /></ResizableHead>
          <ResizableHead><FilterHeader label={activeTab === "All" ? "Time Since Lead" : "Time Since Lead"} values={leads.map(l => `${daysSince(l.date)} days`)} filter={filters.timeSince || ""} setFilter={(v) => setFilter("timeSince", v)} /></ResizableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell><RowActions lead={lead} onUpdate={onUpdate} /></TableCell>
            <TableCell className="font-medium text-xs">{lead.companyName}</TableCell>
            <TableCell className="font-mono text-xs">{lead.ico}</TableCell>
            <TableCell className="text-xs">{lead.sector}</TableCell>
            <TableCell className="text-xs">{lead.date}</TableCell>
            <TableCell><Badge variant="outline" className="text-xs">{lead.addedBy}</Badge></TableCell>
            {activeTab === "All" && (
              <TableCell><Badge variant="outline" className="text-xs">{lead.status}</Badge></TableCell>
            )}
            <TableCell className="text-xs">{lead.contact || "—"}</TableCell>
            <TableCell className="text-xs">{lead.approachFeedback || lead.managerFeedback || "—"}</TableCell>
            <TableCell className="text-xs font-mono">{daysSince(lead.date)} days</TableCell>
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
        if (key === "feedback") {
          const field = lead.approachFeedback || lead.managerFeedback || "";
          return field.toLowerCase().includes(val.toLowerCase());
        }
        if (key === "timeSince") {
          return `${daysSince(lead.date)} days`.includes(val);
        }
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
  const isNoResponse = activeTab === "No Response";
  const isDeclined = activeTab === "Declined";

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      {isTargetIdentified ? (
        <TargetIdentifiedTable leads={filtered} filters={filters} setFilter={setFilter} onUpdate={onUpdate} />
      ) : isApproach ? (
        <ApproachTable leads={filtered} filters={filters} setFilter={setFilter} onUpdate={onUpdate} />
      ) : isNoResponse ? (
        <NoResponseTable leads={filtered} filters={filters} setFilter={setFilter} onUpdate={onUpdate} />
      ) : isDeclined ? (
        <DeclinedTable leads={filtered} filters={filters} setFilter={setFilter} onUpdate={onUpdate} />
      ) : (
        <GenericTable leads={filtered} filters={filters} setFilter={setFilter} onUpdate={onUpdate} activeTab={activeTab} />
      )}
    </div>
  );
}
