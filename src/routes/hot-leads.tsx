import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/hot-leads")({
  head: () => ({
    meta: [
      { title: "Hot Leads | OmniSales AI" },
      { name: "description", content: "High probability leads ready for immediate action." },
    ],
  }),
  component: HotLeadsPage,
});

function HotLeadsPage() {
  const { data: hotLeads, isLoading } = useQuery({
    queryKey: ["hot-leads"],
    queryFn: () => fetch("https://aisalesagent-cxre.onrender.com/api/poc/hot-leads").then(res => res.json()),
  });

  const handleCall = (lead: any) => {
    toast.success(`Initializing AI Voice Agent to call ${lead.company_name}...`);
    // Redirect to calls page or open calling modal
  };

  return (
    <AppShell>
      <section className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-label-md font-semibold text-error uppercase tracking-widest mb-1">
              Priority Actions
            </p>
            <h1 className="text-display-lg font-bold text-primary flex items-center gap-3">
              <span className="text-error">🔥</span> Hot Leads
            </h1>
            <p className="text-on-surface-variant text-body-lg max-w-2xl mt-2">
              These leads have exceptionally high ICP scores and have recently engaged with your outreach. 
              The AI recommends immediate action to maximize conversion probability.
            </p>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-label-md font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Icon name="bolt" /> Auto-Dial All
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-surface-container-low h-64 rounded-xl border border-outline-variant"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotLeads?.hot_leads?.map((lead: any) => (
            <div key={lead.id} className="bg-surface-container-lowest border-2 border-error/20 hover:border-error/50 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-headline-sm font-bold text-primary">{lead.company_name}</h3>
                    <p className="text-label-md text-on-surface-variant">{lead.name}</p>
                  </div>
                  <div className="bg-error-container text-error px-2 py-1 rounded font-bold text-label-sm border border-error/20 flex flex-col items-center">
                    <span className="text-[10px] uppercase">Score</span>
                    <span className="text-title-md">{lead.score}</span>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon name="history" className="text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">Engagement</p>
                      <p className="text-body-md text-primary font-medium">{lead.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="psychology" className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">AI Recommendation</p>
                      <p className="text-body-md text-primary font-medium">{lead.recommended_action}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low border-t border-error/10">
                <button 
                  onClick={() => handleCall(lead)}
                  className="w-full bg-primary text-white py-3 rounded-lg text-title-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                >
                  <Icon name="record_voice_over" /> Start AI Call
                </button>
              </div>
            </div>
          ))}
          {(!hotLeads?.hot_leads || hotLeads.hot_leads.length === 0) && (
            <div className="col-span-full p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant">
              <Icon name="search_off" className="text-on-surface-variant text-[48px] mb-4 opacity-50" />
              <h3 className="text-headline-sm font-bold text-primary mb-2">No Hot Leads Found</h3>
              <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
                Keep running your AI campaigns. Once a prospect scores &gt; 80 and engages with your emails, they will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
