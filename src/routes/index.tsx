import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GodModeStats } from "@/components/dashboard/GodModeStats";
import { GodModeChat } from "@/components/dashboard/GodModeChat";
import { AiRecommendationCard } from "@/components/dashboard/AiRecommendationCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | OmniSales AI" },
      { name: "description", content: "Sales intelligence dashboard with pipeline metrics, live AI feed, and today's schedule." },
      { property: "og:title", content: "Dashboard | OmniSales AI" },
      { property: "og:description", content: "Pipeline value, win rate, live intelligence feed, and AI-prioritized follow-ups." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const { data: recommendations } = useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: () => fetch("https://aisalesagent-cxre.onrender.com/api/dashboard/ai_recommendations").then(res => res.json()),
    refetchInterval: 10000,
  });

  const queryClient = useQueryClient();
  const { data: autopilotStatus } = useQuery({
    queryKey: ["autopilot-status"],
    queryFn: () => fetch("https://aisalesagent-cxre.onrender.com/api/god-mode/autopilot").then(res => res.json()),
  });

  const toggleAutopilot = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch("https://aisalesagent-cxre.onrender.com/api/god-mode/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["autopilot-status"], data);
      if (data.enabled) {
        toast.success("Autopilot Engaged: AI is now handling replies autonomously", { id: "autopilot" });
      } else {
        toast.info("Autopilot Disengaged: AI returned to manual Copilot mode", { id: "autopilot" });
      }
    }
  });

  const isAutopilotEnabled = autopilotStatus?.enabled || false;

  return (
    <AppShell>
      {/* Calendar Modal */}
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      
      {/* Launch Campaign Modal */}
      <LaunchCampaignModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} />

      {/* Header */}
      <section className="mb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-label-md font-semibold text-secondary uppercase tracking-widest mb-1">
              God Mode
            </p>
            <h1 className="text-display-lg font-bold text-primary">AI Revenue Command Center</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant">
               <span className={`text-label-md font-bold uppercase tracking-wider ${isAutopilotEnabled ? 'text-primary' : 'text-on-surface-variant'}`}>
                 Autopilot
               </span>
               <button 
                 onClick={() => toggleAutopilot.mutate(!isAutopilotEnabled)}
                 className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isAutopilotEnabled ? 'bg-primary' : 'bg-surface-variant'}`}
               >
                 <span className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-300 flex items-center justify-center ${isAutopilotEnabled ? 'translate-x-7 bg-white text-primary' : 'translate-x-0 bg-on-surface-variant text-surface-variant'}`}>
                   <Icon name={isAutopilotEnabled ? "bolt" : "power_settings_new"} style={{ fontSize: 14 }} />
                 </span>
               </button>
            </div>
            
            <button 
              onClick={() => setIsCampaignModalOpen(true)}
              className="bg-primary text-white px-4 py-2 h-11 rounded-lg text-label-md font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Icon name="rocket_launch" /> Launch AI Campaign
            </button>
            <button className="bg-surface-container-high text-primary px-4 py-2 h-11 rounded-lg text-label-md font-semibold flex items-center gap-2 border border-outline-variant">
              <Icon name="download" /> Export
            </button>
          </div>
        </div>
      </section>

      {/* God Mode Stats */}
      <GodModeStats />

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[600px]">
        
        {/* Left Column: Recommendations */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-headline-md font-bold text-error uppercase tracking-wider">🔥 Hot Leads</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {recommendations?.recommendations?.map((rec: any) => (
              <AiRecommendationCard
                key={rec.id}
                companyName={rec.company_name}
                type={rec.type}
                probability={rec.probability}
                reason={rec.reason}
                suggestedAction={rec.suggested_action}
                actionButton={rec.action_button}
                onAction={() => toast.success(`Executing: ${rec.action_button} for ${rec.company_name}`)}
              />
            ))}
            {!recommendations?.recommendations?.length && (
              <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded-xl">
                Analyzing pipeline for new opportunities...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chatbot */}
        <div className="lg:col-span-5 h-full">
          <GodModeChat />
        </div>
        
      </div>
    </AppShell>
  );
}

function CalendarModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface border border-outline-variant rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container text-primary rounded-lg flex items-center justify-center">
              <Icon name="calendar_month" />
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-primary">March 2024</h2>
              <p className="text-label-md text-on-surface-variant">Your Schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
            <Icon name="close" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-surface-container-lowest">
          <div className="grid grid-cols-7 gap-px bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="bg-surface-container-low py-3 text-center text-label-md font-bold text-on-surface-variant">
                {day}
              </div>
            ))}
            
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 4; // Start a few days in
              const isCurrentMonth = dayNum > 0 && dayNum <= 31;
              const isToday = dayNum === 14; // Arbitrary today
              
              return (
                <div key={i} className={`min-h-[120px] p-2 bg-surface hover:bg-surface-container-low transition-colors ${!isCurrentMonth ? "opacity-30" : ""}`}>
                  <div className={`text-label-md font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? "bg-primary text-white" : "text-primary"}`}>
                    {isCurrentMonth ? dayNum : (dayNum <= 0 ? 29 + dayNum : dayNum - 31)}
                  </div>
                  
                  {isCurrentMonth && dayNum === 14 && (
                    <div className="space-y-1.5">
                      <div className="bg-secondary-container/80 text-secondary-fixed-dim border border-secondary/20 px-2 py-1 rounded text-[10px] font-bold truncate">
                        11:00 Demo with Mahindra
                      </div>
                      <div className="bg-primary-container/80 text-primary border border-primary/20 px-2 py-1 rounded text-[10px] font-bold truncate">
                        14:30 Pipeline Review
                      </div>
                      <div className="bg-surface-container-high text-on-surface-variant border border-outline-variant px-2 py-1 rounded text-[10px] font-bold truncate">
                        17:00 Closing Call
                      </div>
                    </div>
                  )}
                  {isCurrentMonth && dayNum === 16 && (
                    <div className="space-y-1.5">
                      <div className="bg-tertiary-container/80 text-on-tertiary-container border border-on-tertiary-container/20 px-2 py-1 rounded text-[10px] font-bold truncate">
                        10:00 Strategy Sync
                      </div>
                    </div>
                  )}
                  {isCurrentMonth && dayNum === 21 && (
                    <div className="space-y-1.5">
                      <div className="bg-error-container/80 text-error border border-error/20 px-2 py-1 rounded text-[10px] font-bold truncate">
                        13:00 Urgent Escalation
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LaunchCampaignModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [companyName, setCompanyName] = useState("");
  const [targetCriteria, setTargetCriteria] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !targetCriteria.trim()) {
      toast.error("Company Name and Target Criteria are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://aisalesagent-cxre.onrender.com/api/automation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          target_criteria: targetCriteria,
          website: website || null,
          linkedin_url: linkedinUrl || null,
        }),
      });

      if (!res.ok) throw new Error("API failed");

      toast.success(`AI Campaign launched for ${companyName}!`);
      setCompanyName("");
      setTargetCriteria("");
      setWebsite("");
      setLinkedinUrl("");
      onClose();
    } catch (error) {
      toast.error("Failed to launch campaign. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface border border-outline-variant rounded-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container text-primary rounded-lg flex items-center justify-center">
              <Icon name="rocket_launch" />
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-primary">New AI Campaign</h2>
              <p className="text-label-md text-on-surface-variant">Automated Research & Outreach</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
            <Icon name="close" />
          </button>
        </div>
        
        <div className="p-6 bg-surface-container-lowest">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface-variant mb-1">Target Company Name *</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Reliance Retail" 
                required
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface-variant mb-1">Company Website (Optional but Recommended)</label>
              <input 
                type="url" 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://reliance.com" 
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface-variant mb-1">Target Decision Maker Criteria *</label>
              <textarea 
                value={targetCriteria}
                onChange={(e) => setTargetCriteria(e.target.value)}
                placeholder="e.g. Looking for VP of Sales or Operations Director based in Mumbai" 
                rows={2}
                required
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar"
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface-variant mb-1">Specific Target LinkedIn URL (Optional Enrichment)</label>
              <input 
                type="url" 
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="e.g. https://linkedin.com/in/target-person" 
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name="bolt" filled /> Deploy AI Agents
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
