import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLeads } from "@/lib/leads-store";
import { Lead, LeadStatus } from "@/lib/types";
import LeadForm from "@/components/LeadForm";
import LeadTable from "@/components/LeadTable";
import { PlusCircle, Target, Phone, CheckCircle, XCircle, Clock, FileText, Award, LayoutDashboard } from "lucide-react";

const PIPELINE_TABS: { label: string; statuses: LeadStatus[]; icon: React.ReactNode }[] = [
  { label: "All", statuses: [], icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Target Identified", statuses: ["1.1 Target Identified"], icon: <Target className="h-4 w-4" /> },
  { label: "Approach", statuses: ["1.2 Approach"], icon: <Phone className="h-4 w-4" /> },
  { label: "Yes", statuses: ["Yes"], icon: <CheckCircle className="h-4 w-4" /> },
  { label: "No Response", statuses: ["No Response"], icon: <Clock className="h-4 w-4" /> },
  { label: "Declined", statuses: ["Declined"], icon: <XCircle className="h-4 w-4" /> },
  { label: "Follow Up", statuses: ["Follow Up Later"], icon: <Clock className="h-4 w-4" /> },
  { label: "Proposal", statuses: ["Proposal"], icon: <FileText className="h-4 w-4" /> },
  { label: "Client Mandate", statuses: ["Client Mandate"], icon: <Award className="h-4 w-4" /> },
];

export default function Index() {
  const [leads, setLeads] = useState<Lead[]>(getLeads);
  const refresh = useCallback(() => setLeads(getLeads()), []);

  const filter = (statuses: LeadStatus[]) =>
    statuses.length === 0 ? leads : leads.filter((l) => statuses.includes(l.status));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">KPMG</span>
            <span className="text-sm font-medium opacity-80">Deal Advisory — BUSDE Tracker</span>
          </div>
          <span className="text-xs opacity-60">{leads.length} leads</span>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <Tabs defaultValue="pipeline">
          <TabsList className="mb-4">
            <TabsTrigger value="new" className="gap-1.5"><PlusCircle className="h-4 w-4" /> New Lead</TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5"><LayoutDashboard className="h-4 w-4" /> Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Lead</h2>
              <LeadForm onSubmitted={refresh} />
            </div>
          </TabsContent>

          <TabsContent value="pipeline">
            <Tabs defaultValue="All">
              <div className="overflow-x-auto pb-1">
                <TabsList className="inline-flex w-auto">
                  {PIPELINE_TABS.map((t) => (
                    <TabsTrigger key={t.label} value={t.label} className="gap-1.5 text-xs">
                      {t.icon} {t.label}
                      <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                        {filter(t.statuses).length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {PIPELINE_TABS.map((t) => (
                <TabsContent key={t.label} value={t.label}>
                  <LeadTable leads={filter(t.statuses)} onUpdate={refresh} />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
