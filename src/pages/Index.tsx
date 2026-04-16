import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLeads } from "@/lib/leads-store";
import { Lead, LeadStatus } from "@/lib/types";
import LeadForm from "@/components/LeadForm";
import LeadTable from "@/components/LeadTable";
import { PlusCircle, Target, Phone, CheckCircle, XCircle, Clock, FileText, Award, LayoutDashboard } from "lucide-react";

const PIPELINE_TABS: { label: string; statuses: LeadStatus[]; icon: React.ReactNode; color: string; outline?: boolean; checkmark?: boolean }[] = [
  { label: "All", statuses: [], icon: <LayoutDashboard className="h-4 w-4" />, color: "#00338D" },
  { label: "Target Identified", statuses: ["1.1 Target Identified"], icon: <Target className="h-4 w-4" />, color: "#00B8F5" },
  { label: "Approach", statuses: ["1.2 Approach"], icon: <Phone className="h-4 w-4" />, color: "#1E49E2" },
  { label: "Yes - Proposal", statuses: ["3.1 Yes - Proposal"], icon: <CheckCircle className="h-4 w-4" />, color: "#FD349C" },
  { label: "No Response", statuses: ["2.2 No Response"], icon: <Clock className="h-4 w-4" />, color: "#FFC000" },
  { label: "Declined", statuses: ["2.3 Declined"], icon: <XCircle className="h-4 w-4" />, color: "#C00000" },
  { label: "Follow Up", statuses: ["2.4 Follow Up Later"], icon: <Clock className="h-4 w-4" />, color: "#7213EA" },
  { label: "Client Mandate", statuses: ["4.1 Client Mandate"], icon: <Award className="h-4 w-4" />, color: "transparent", outline: true, checkmark: true },
];

export default function Index() {
  const [leads, setLeads] = useState<Lead[]>(getLeads);
  const refresh = useCallback(() => setLeads(getLeads()), []);

  const filter = (statuses: LeadStatus[]) =>
    statuses.length === 0 ? leads : leads.filter((l) => statuses.includes(l.status));

  return (
    <div className="min-h-screen">
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
            <TabsTrigger value="new" className="gap-1.5"><PlusCircle className="h-4 w-4" /> Lead Input</TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5"><LayoutDashboard className="h-4 w-4" /> Targets</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Lead Input</h2>
              <LeadForm onSubmitted={refresh} />
            </div>
          </TabsContent>

          <TabsContent value="pipeline">
            <Tabs defaultValue="All">
              <div className="overflow-x-auto pb-1">
                <TabsList className="inline-flex w-auto gap-1 bg-transparent p-1">
                  {PIPELINE_TABS.map((t) => (
                    <TabsTrigger
                      key={t.label}
                      value={t.label}
                      className="gap-1.5 text-xs text-white border-0 data-[state=active]:shadow-md data-[state=active]:scale-105 transition-all"
                      style={{
                        backgroundColor: t.outline ? "transparent" : t.color,
                        border: t.outline ? `2px solid #00338D` : "none",
                        color: t.outline ? "#00338D" : "#fff",
                      }}
                    >
                      {t.icon} {t.label}
                      {t.checkmark && <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-0.5" />}
                      <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]" style={t.outline ? { backgroundColor: "rgba(0,51,141,0.1)" } : {}}>
                        {filter(t.statuses).length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {PIPELINE_TABS.map((t) => (
                <TabsContent key={t.label} value={t.label}>
                  <LeadTable leads={filter(t.statuses)} activeTab={t.label} onUpdate={refresh} />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
