import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "Call Intelligence | OmniSales AI" },
      { name: "description", content: "AI-generated call summaries, sentiment, pain points, and next actions for sales calls." },
      { property: "og:title", content: "Call Intelligence | OmniSales AI" },
      { property: "og:description", content: "Sentiment, pain points, and AI next actions for every call." },
    ],
  }),
  component: CallsPage,
});

function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCallId, setSelectedCallId] = useState<string | number | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_BACKEND_URL || "https://aisalesagent-cxre.onrender.com") + "/api/poc/calls/list");
        if (res.ok) {
          const data = await res.json();
          setCalls(data.calls || []);
          if (data.calls && data.calls.length > 0) {
            setSelectedCallId(data.calls[0].id);
          }
        }
      } catch (e) {
        toast.error("Failed to fetch call intelligence.");
      } finally {
        setLoading(false);
      }
    };
    fetchCalls();
  }, []);

  const activeCall = calls.find(c => c.id === selectedCallId) || calls[0];

  if (loading) {
    return (
      <AppShell searchPlaceholder="Search call records..." showAiBadge>
        <div className="flex items-center justify-center h-64 text-on-surface-variant animate-pulse">Loading Call Intelligence...</div>
      </AppShell>
    );
  }

  if (!activeCall) {
    return (
      <AppShell searchPlaceholder="Search call records..." showAiBadge>
        <div className="flex items-center justify-center h-64 text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant">
          No voice call records found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell searchPlaceholder="Search call records..." showAiBadge>
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
        
        {/* Sidebar Call List */}
        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4 h-auto lg:h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                <Icon name="history" />
              </div>
              Call History
            </h2>
            <span className="bg-surface-container-high text-on-surface px-2.5 py-1 rounded-full text-label-sm font-bold shadow-sm">
              {calls.length} logs
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {calls.map((call, idx) => {
              const isSelected = selectedCallId === call.id;
              return (
                <button 
                  key={call.id} 
                  onClick={() => setSelectedCallId(call.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ease-out flex flex-col gap-3 relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-gradient-to-br from-primary/10 to-transparent border-primary/40 shadow-md ring-1 ring-primary/20 scale-[1.02]' 
                      : 'bg-surface border-outline-variant hover:border-primary/30 hover:bg-surface-container-lowest hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-2xl" />}
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col">
                      <p className={`font-bold text-body-lg truncate leading-tight ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {call.title}
                      </p>
                      <p className="text-body-sm text-on-surface-variant font-medium mt-1 truncate">
                        {call.company_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center w-full mt-2 pt-3 border-t border-outline-variant/50">
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5 font-medium">
                      <Icon name="schedule" style={{fontSize: 14}}/> {call.date?.split(' ')[0]}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                      call.is_hot_lead || call.sentiment?.toUpperCase() === 'POSITIVE' 
                        ? 'bg-secondary/10 text-secondary border border-secondary/20' 
                        : 'bg-surface-variant text-on-surface-variant border border-outline-variant'
                    }`}>
                      {call.sentiment || 'NEUTRAL'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Detailed View */}
        <div className="flex-1 flex flex-col gap-8 max-w-5xl">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface p-6 md:p-8 rounded-3xl border border-outline-variant shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            
            <div className="space-y-3 relative z-10">
              <nav className="flex items-center gap-2 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
                <span className="hover:text-primary cursor-pointer transition-colors">Call Logs</span>
                <Icon name="chevron_right" style={{ fontSize: 16 }} />
                <span className="text-primary">Intelligence Report</span>
              </nav>
              <h2 className="text-display-sm font-bold text-on-surface leading-tight">{activeCall.title}</h2>
              
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {activeCall.is_hot_lead ? (
                  <span className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 text-orange-600 px-3 py-1.5 rounded-lg text-label-md font-bold flex items-center gap-1.5 shadow-sm">
                    <Icon name="local_fire_department" style={{ fontSize: 16 }} /> Hot Lead
                  </span>
                ) : (
                  <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-label-md font-bold flex items-center gap-1.5 shadow-sm">
                    <Icon name="update" style={{ fontSize: 16 }} /> Follow-up Required
                  </span>
                )}
                <span className="text-body-sm font-medium text-on-surface-variant flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/50">
                  <Icon name="calendar_today" style={{ fontSize: 16 }} /> {activeCall.date}
                </span>
                {activeCall.duration && (
                  <span className="text-body-sm font-medium text-on-surface-variant flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/50">
                    <Icon name="timer" style={{ fontSize: 16 }} /> {activeCall.duration}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
              <button 
                onClick={() => toast.info("Share functionality coming soon", { id: "share" })}
                className="flex-1 md:flex-none bg-surface border-2 border-outline-variant px-5 py-2.5 rounded-xl text-label-md text-on-surface font-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all shadow-sm"
              >
                <Icon name="share" /> Share
              </button>
              <button 
                onClick={() => toast.info("PDF Export coming soon", { id: "export" })}
                className="flex-1 md:flex-none bg-primary text-white px-5 py-2.5 rounded-xl text-label-md font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                <Icon name="download" /> Export PDF
              </button>
            </div>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* AI Sentiment & Summary */}
              <section className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant shadow-sm relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 text-secondary flex items-center justify-center shadow-inner">
                    <Icon name="psychology" style={{ fontSize: 24 }} />
                  </div>
                  <div>
                    <h3 className="text-title-lg font-bold text-on-surface">AI Summary & Sentiment</h3>
                    <p className="text-body-sm text-on-surface-variant">Automatically extracted by OmniSales AI</p>
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 mb-6 shadow-sm">
                  <p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap font-medium">
                    {activeCall.voice_summary}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-gradient-to-br from-surface to-surface-container-low border border-outline-variant/60 rounded-2xl shadow-sm hover:border-primary/30 transition-colors">
                    <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Lead Sentiment</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeCall.sentiment === 'POSITIVE' ? 'bg-green-500/10 text-green-600' : 'bg-surface-variant text-on-surface-variant'}`}>
                        <Icon name={activeCall.sentiment === 'POSITIVE' ? 'sentiment_very_satisfied' : 'sentiment_neutral'} />
                      </div>
                      <span className="text-title-lg font-extrabold text-on-surface truncate">
                        {activeCall.sentiment}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-surface to-surface-container-low border border-outline-variant/60 rounded-2xl shadow-sm hover:border-secondary/30 transition-colors">
                    <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Procurement Urgency</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeCall.is_hot_lead ? 'bg-orange-500/10 text-orange-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        <Icon name="trending_up" />
                      </div>
                      <span className="text-title-lg font-extrabold text-on-surface">
                        {activeCall.is_hot_lead ? "High" : "Medium"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Pain Points */}
              <section className="bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 text-error flex items-center justify-center shadow-inner">
                      <Icon name="priority_high" style={{ fontSize: 24 }} />
                    </div>
                    <div>
                      <h3 className="text-title-lg font-bold text-on-surface">Pain Points</h3>
                      <p className="text-body-sm text-on-surface-variant">Friction areas identified in call</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <PainPoint icon="timer_off" title="Manual Workflows" body="Lead mentioned severe bottlenecks caused by current manual processes." />
                  <PainPoint icon="account_balance_wallet" title="Budgetary Concerns" body="Lead expressed hesitation regarding the total cost of ownership." />
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Next Actions Card (Premium Gradient) */}
              <section className="bg-gradient-to-br from-primary to-primary-fixed-dim text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-primary/20 relative overflow-hidden isolate">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 -z-10" />
                
                <h3 className="text-title-lg font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Icon name="check_circle" />
                  </div>
                  Suggested Actions
                </h3>
                
                <div className="space-y-4">
                  <div className="group flex flex-col bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md p-4 rounded-2xl transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-title-md font-bold">Follow-up Call</span>
                      <span className="bg-secondary-fixed text-on-secondary-fixed px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform">Soon</span>
                    </div>
                    <p className="text-white/80 text-body-sm">Schedule a follow up to address budgetary concerns.</p>
                  </div>
                  <div className="group flex flex-col bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md p-4 rounded-2xl transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-title-md font-bold text-white/90">Draft Proposal</span>
                      <span className="bg-white/20 text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider">ASAP</span>
                    </div>
                    <p className="text-white/70 text-body-sm">Generate a customized pricing proposal.</p>
                  </div>
                </div>
              </section>

              {/* Call Transcript */}
              <section className="bg-surface rounded-3xl border border-outline-variant shadow-sm flex flex-col flex-1 h-full min-h-[500px] overflow-hidden">
                <div className="p-5 md:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest/50 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Icon name="forum" />
                    </div>
                    <h3 className="text-title-md font-bold text-on-surface">Call Transcript</h3>
                  </div>
                  <button className="text-primary font-bold text-label-sm hover:underline hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                    Expand View
                  </button>
                </div>
                
                {activeCall.recording_url && activeCall.recording_url !== "No recording" && (
                  <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-lowest/80 flex flex-col gap-3">
                    <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                      <Icon name="mic" style={{ fontSize: 16 }} /> Original Recording
                    </span>
                    <audio controls className="w-full h-10 rounded-lg custom-audio" src={activeCall.recording_url}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar bg-surface-container-lowest/30">
                  {activeCall.raw_transcript && activeCall.raw_transcript !== "No transcript available." ? (
                    activeCall.raw_transcript.split(/<br\/>|\n/).map((line: string, idx: number) => {
                      const isAgent = line.toLowerCase().startsWith('agent') || line.toLowerCase().startsWith('llm') || line.toLowerCase().includes('agent:');
                      const text = line.replace(/^(Agent|User|Client|Lead|LLM):\s*/i, '');
                      const speakerName = isAgent ? 'OmniSales AI' : activeCall.lead_name.split(' ')[0];
                      
                      if (!text.trim()) return null;
                      return (
                        <Bubble 
                          key={idx} 
                          side={isAgent ? 'right' : 'left'} 
                          speaker={speakerName} 
                          speakerClass={isAgent ? "text-primary" : "text-secondary"} 
                          time=" " 
                          text={text.trim()} 
                        />
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-3 opacity-60">
                      <Icon name="speaker_notes_off" style={{fontSize: 48}} />
                      <p>Transcript not available</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PainPoint({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex gap-4 p-4 hover:bg-surface-container-lowest transition-all duration-300 rounded-2xl border border-outline-variant/40 hover:border-error/30 hover:shadow-sm group">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-container border border-outline-variant group-hover:bg-error/10 group-hover:border-error/20 group-hover:text-error text-on-surface-variant flex items-center justify-center transition-colors">
        <Icon name={icon} />
      </div>
      <div className="flex flex-col justify-center">
        <h4 className="font-bold text-on-surface text-body-lg mb-0.5">{title}</h4>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function Bubble({ side, speaker, speakerClass, time, text }: { side: "left" | "right"; speaker: string; speakerClass: string; time: string; text: string }) {
  const isLeft = side === "left";
  return (
    <div className={`flex flex-col gap-1.5 max-w-[85%] ${isLeft ? "items-start" : "items-end ml-auto"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex items-center gap-2 ${isLeft ? "" : "flex-row-reverse"} px-1`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${isLeft ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
          {speaker.charAt(0)}
        </div>
        <span className={`text-label-sm font-bold ${speakerClass}`}>{speaker}</span>
      </div>
      <div
        className={`px-5 py-3.5 text-body-md shadow-sm relative ${
          isLeft
            ? "bg-surface-container-low rounded-2xl rounded-tl-sm border border-outline-variant/60 text-on-surface"
            : "bg-gradient-to-br from-primary to-primary-fixed-dim text-white rounded-2xl rounded-tr-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
