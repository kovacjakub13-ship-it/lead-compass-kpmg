import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { addLead } from "@/lib/leads-store";
import { Lead } from "@/lib/types";
import { toast } from "sonner";
import { Send, Sparkles } from "lucide-react";
import thwapImg from "@/assets/thwap.png";

const SECTORS = [
  "Agriculture", "Automotive", "Biotechnology", "Chemicals and materials",
  "Computer & software", "Consumer FMCG", "Consumers retail", "Construction",
  "Defense", "Energy", "Financial services", "Industrials", "Manufacturing",
  "Medical & pharma", "Mining", "Real estate", "Security", "Services",
  "Telco", "Transportation", "Waste management", "Wholesale distribution", "Other",
];

const SOURCE_TYPES = ["Research", "News", "Intercompany", "Personal contact"];

interface LeadFormProps {
  onSubmitted: () => void;
}

export default function LeadForm({ onSubmitted }: LeadFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    companyName: "",
    ico: "",
    sector: "",
    customSector: "",
    sourceType: "",
    date: today,
    website: "",
    finstatLink: "",
    reasoning: "",
    addedBy: "",
  });

  const [celebrate, setCelebrate] = useState<{ open: boolean; company: string }>({ open: false, company: "" });

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSector = form.sector === "Other" ? form.customSector : form.sector;
    if (!form.companyName || !form.ico || !finalSector || !form.addedBy) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const lead: Lead = {
      id: crypto.randomUUID(),
      companyName: form.companyName,
      ico: form.ico,
      sector: finalSector,
      sourceType: form.sourceType,
      date: form.date,
      website: form.website,
      finstatLink: form.finstatLink,
      reasoning: form.reasoning,
      addedBy: form.addedBy.toUpperCase(),
      status: "1.1 Target Identified",
      contact: "",
      manager: "",
      managerFeedback: "",
      managerAcronym: "",
      managerDecision: "",
      approachType: "",
      approachDate: "",
      approachResponse: "",
      approachFeedback: "",
      responseDate: "",
      followedUp: "",
      followUpResponse: "",
      followUpFeedback: "",
    };

    addLead(lead);
    setCelebrate({ open: true, company: form.companyName });
    setForm({ companyName: "", ico: "", sector: "", customSector: "", sourceType: "", date: today, website: "", finstatLink: "", reasoning: "", addedBy: "" });
    onSubmitted();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>IČO</Label>
            <Input value={form.ico} onChange={(e) => set("ico", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sector</Label>
            <Select value={form.sector} onValueChange={(v) => set("sector", v)}>
              <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
              <SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.sector === "Other" && (
            <div className="space-y-1.5">
              <Label>Custom Sector</Label>
              <Input value={form.customSector} onChange={(e) => set("customSector", e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Source Type</Label>
            <Select value={form.sourceType} onValueChange={(v) => set("sourceType", v)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>{SOURCE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Originator (Initials)</Label>
            <Input value={form.addedBy} onChange={(e) => set("addedBy", e.target.value.toUpperCase())} maxLength={5} />
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>FinStat Link</Label>
            <Input value={form.finstatLink} onChange={(e) => set("finstatLink", e.target.value)} placeholder="https://finstat.sk/..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Case Reasoning</Label>
          <Textarea value={form.reasoning} onChange={(e) => set("reasoning", e.target.value)} rows={3} />
        </div>
        <Button type="submit" className="w-full sm:w-auto gap-2">
          <Send className="h-4 w-4" /> Submit Lead
        </Button>
      </form>

      <Dialog open={celebrate.open} onOpenChange={(o) => setCelebrate((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-2xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary to-accent shadow-2xl">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-accent/30 blur-3xl" />

            <div className="relative grid grid-cols-1 sm:grid-cols-[auto,1fr] items-center gap-4 p-6 sm:p-8">
              <img
                src={thwapImg}
                alt="Thwap!"
                className="h-44 w-44 sm:h-52 sm:w-52 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] animate-in zoom-in-50 duration-500"
              />
              <div className="text-primary-foreground space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Lead added
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                  Ty finančný žralok!
                </h2>
                <p className="text-base sm:text-lg text-primary-foreground/90 leading-snug">
                  Chceš rovno buchnúť ďalšiu?
                </p>
                {celebrate.company && (
                  <p className="text-xs text-primary-foreground/70 italic pt-1">
                    {celebrate.company} added to pipeline
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-3">
                  <Button
                    onClick={() => setCelebrate({ open: false, company: "" })}
                    variant="secondary"
                    className="gap-2 font-semibold"
                  >
                    <Send className="h-4 w-4" /> Buchnúť ďalšiu
                  </Button>
                  <Button
                    onClick={() => setCelebrate({ open: false, company: "" })}
                    variant="ghost"
                    className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                  >
                    Hotovo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
