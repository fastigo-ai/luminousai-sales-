import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads | OmniSales AI" },
      { name: "description", content: "Manage Indian sales leads with GST verification, regional segmentation, and AI scoring." },
    ],
  }),
  component: LeadsPage,
});

type Lead = {
  initials: string;
  name: string;
  company: string;
  region: string;
  gst: "Registered" | "Pending";
  score: number;
  status?: string;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || "https://aisalesagent-cxre.onrender.com") + "";

import { useLeadDrawer } from "@/contexts/LeadDrawerContext";

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useLeadDrawer();

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/leads`); // from the chat router
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) {
      toast.error("Failed to load leads from backend.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    // Auto-refresh the Kanban board every 5 seconds to show real-time workflow progression
    const intervalId = setInterval(() => {
      // Fetch quietly without setting loading to true to avoid UI flickering
      fetch(`${BACKEND_URL}/api/chat/leads`)
        .then(res => res.json())
        .then(data => setLeads(data.leads || []))
        .catch(() => {}); // silently fail on network errors during polling
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <AppShell searchPlaceholder="Search leads by name or GSTIN...">
      <div className="space-y-4">
        {/* Filters */}
        <section className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end bg-surface-container-low p-6 rounded-xl border border-outline-variant">
          <FilterSelect label="GST Status" options={["All Statuses", "Registered (Active)", "Unregistered", "Composite", "Suspended"]} />
          <FilterSelect label="State/Region" options={["All Regions", "North (Delhi, UP, PB)", "South (KA, TN, KL)", "West (MH, GJ)", "East (WB, OD)", "Central (MP, CH)"]} />
          <FilterSelect label="Lead Quality" options={["All Grades", "Grade A (Hot)", "Grade B (Warm)", "Grade C (Cold)"]} />
          <div className="md:col-span-1 lg:col-span-2 flex items-center gap-2">
            <button className="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-lg text-body-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <Icon name="filter_alt" style={{ fontSize: 18 }} />
              Apply Filters
            </button>
            <button onClick={fetchLeads} className="px-3 py-2.5 border border-outline text-primary rounded-lg hover:bg-surface-container-high transition-all">
              <Icon name="refresh" className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="lg:col-span-1">
            <button className="w-full border-2 border-primary text-primary font-bold py-2.5 rounded-lg text-body-md hover:bg-primary hover:text-on-primary transition-all">
              Export CSV
            </button>
          </div>
        </section>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 min-w-max">
            {[
              "Discovered", "Mail Sent", "Mail Opened", 
              "Voice AI Calling", "Call Completed", "Hot Lead", "Meeting Booked"
            ].map(stage => {
              const stageLeads = leads.filter(l => (l.status || "Discovered") === stage);
              return (
                <div key={stage} className="w-[300px] flex-shrink-0 flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
                  <div className="p-3 bg-surface-container-high border-b border-outline-variant flex justify-between items-center">
                    <h3 className="text-label-sm font-bold uppercase text-on-surface-variant">{stage}</h3>
                    <span className="bg-surface-container-highest text-on-surface px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px] bg-surface-container-lowest/50">
                    {loading && leads.length === 0 ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="p-3 bg-surface rounded-lg border border-outline-variant shadow-sm animate-pulse">
                          <div className="flex justify-between items-start mb-2">
                            <div className="h-4 bg-surface-container-highest rounded w-24"></div>
                            <div className="h-4 bg-surface-container-highest rounded w-8"></div>
                          </div>
                          <div className="h-3 bg-surface-container-highest rounded w-32 mb-2"></div>
                          <div className="flex gap-2 mt-3 border-t border-outline-variant pt-2">
                            <div className="h-6 bg-surface-container-highest rounded flex-1"></div>
                            <div className="h-6 bg-surface-container-highest rounded flex-1"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      stageLeads.map(l => (
                        <div 
                          key={l.name} 
                          onClick={() => openDrawer({ id: l.name, name: l.name, company: l.company, score: l.score, status: l.status })}
                          className="p-3 bg-surface rounded-lg border border-outline-variant shadow-sm hover:border-primary transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-label-md text-on-surface">{l.name}</span>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {l.score}
                            </span>
                          </div>
                          <div className="text-body-sm text-on-surface-variant mb-2">{l.company}</div>
                          <div className="flex gap-2 mt-3 border-t border-outline-variant pt-2">
                             <button className="flex-1 flex justify-center py-1 text-on-surface-variant hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Drafting email..."); }}><Icon name="mail" style={{ fontSize: 16 }}/></button>
                             <button className="flex-1 flex justify-center py-1 text-on-surface-variant hover:text-whatsapp transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Initiating AI Call..."); }}><Icon name="call" style={{ fontSize: 16 }}/></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-md font-semibold text-on-surface-variant">{label}</label>
      <select className="border border-outline bg-surface rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const isRegistered = lead.gst === "Registered";
  const scoreBarColor = isRegistered ? "bg-on-tertiary-container" : "bg-secondary-container";
  const scoreText = isRegistered ? "text-on-tertiary-container" : "text-secondary";
  const gstClass = isRegistered
    ? "border-on-tertiary-container text-on-tertiary-container bg-tertiary-fixed-dim/10"
    : "border-secondary-container text-on-secondary-container bg-secondary-container/10";
  return (
    <tr className="hover:bg-surface-container-low transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold text-primary text-sm">{lead.initials}</div>
          <div>
            <div className="font-bold text-on-surface">{lead.name}</div>
            <div className="text-body-sm text-on-surface-variant">{lead.company}</div>
          </div>
        </div>
      </td>
      <td className="p-4 text-body-md">{lead.region}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${gstClass}`}>{lead.gst}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className={`h-full ${scoreBarColor}`} style={{ width: `${lead.score}%` }} />
          </div>
          <span className={`text-data-numeric font-medium ${scoreText}`}>{lead.score}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-whatsapp hover:text-white transition-all whatsapp-green" title="WhatsApp">
            <Icon name="chat" filled />
          </button>
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all text-primary" title="Email">
            <Icon name="mail" />
          </button>
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container-high transition-all text-on-surface-variant">
            <Icon name="more_vert" />
          </button>
        </div>
      </td>
    </tr>
  );
}
