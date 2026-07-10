import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useLeadDrawer } from "@/contexts/LeadDrawerContext";
import { Icon } from "@/components/layout/Icon";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/lead-lists")({
  head: () => ({
    meta: [
      { title: "Lead Lists | Fastigo AI Copilot" },
    ],
  }),
  component: LeadListsPage,
});

function LeadListsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useLeadDrawer();

  useEffect(() => {
    fetchSpreadsheetData();
  }, []);

  const fetchSpreadsheetData = async () => {
    try {
      const res = await fetch("https://aisalesagent-cxre.onrender.com/api/automation/spreadsheet");
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load spreadsheet data.");
    } finally {
      setLoading(false);
    }
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isDirectPitchOpen, setIsDirectPitchOpen] = useState(false);
  const [directSearchForm, setDirectSearchForm] = useState({
    domain: "",
    company_name: "",
    industry: "",
    description: "",
    apollo_organization_id: "",
    linkedin_url: "",
    target_first_name: "",
    target_last_name: "",
    target_title: "",
    target_email: "",
    force_recheck: false
  });
  const [isDirectSearching, setIsDirectSearching] = useState(false);

  const [apolloSearchQuery, setApolloSearchQuery] = useState("");
  const [apolloSearchResults, setApolloSearchResults] = useState<any[]>([]);
  const [isApolloSearching, setIsApolloSearching] = useState(false);
  const [apolloPeople, setApolloPeople] = useState<any[]>([]);
  const [isPeopleSearching, setIsPeopleSearching] = useState(false);

  const handleApolloSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apolloSearchQuery) return;
    setIsApolloSearching(true);
    try {
      const res = await fetch("https://aisalesagent-cxre.onrender.com/api/automation/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: { search: apolloSearchQuery, limit: 5 } })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setApolloSearchResults(data.data || []);
        } else {
          toast.error("Failed to search Apollo.");
        }
      }
    } catch (e) {
      toast.error("Network error.");
    } finally {
      setIsApolloSearching(false);
    }
  };

  const selectApolloCompany = async (company: any) => {
    const website = company.website_url || company.website || "";
    setDirectSearchForm({
      ...directSearchForm,
      domain: website,
      company_name: company.name || "",
      industry: company.industry || "",
      description: company.short_description || company.seo_description || company.desc || "",
      apollo_organization_id: company.id ? String(company.id) : "",
      linkedin_url: company.linkedin_url || "",
      target_first_name: "",
      target_last_name: "",
      target_title: "",
      target_email: "",
      force_recheck: false
    });
    setApolloSearchResults([]);
    setApolloPeople([]);
    
    if (website) {
      setIsPeopleSearching(true);
      try {
        const res = await fetch("https://aisalesagent-cxre.onrender.com/api/automation/search_people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: website, limit: 15, target_titles: "" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success") {
            setApolloPeople(data.data || []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsPeopleSearching(false);
      }
    }
    setApolloSearchQuery("");
  };

  const selectApolloPerson = (person: any) => {
    setDirectSearchForm({
      ...directSearchForm,
      target_first_name: person.first_name || "",
      target_last_name: person.last_name || "",
      target_title: person.title || "",
      target_email: person.email || ""
    });
  };

  const handleDirectPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSearchForm.domain || !directSearchForm.company_name) {
      toast.error("Domain and Company Name are required.");
      return;
    }
    setIsDirectSearching(true);
    toast.loading("AI is researching and pitching this company...", { id: "direct-pitch" });
    try {
      const res = await fetch("https://aisalesagent-cxre.onrender.com/api/automation/enrich_and_pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directSearchForm)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" || data.status === "skipped_duplicate_fresh") {
          toast.success("Lead successfully added and pitched!", { id: "direct-pitch" });
          setIsDirectPitchOpen(false);
          setDirectSearchForm({ domain: "", company_name: "", industry: "", description: "", apollo_organization_id: "", linkedin_url: "", target_first_name: "", target_last_name: "", target_title: "", target_email: "", force_recheck: false });
          setApolloSearchResults([]);
          setApolloPeople([]);
          await fetchSpreadsheetData();
        } else {
          toast.error(data.message || "Failed to add lead.", { id: "direct-pitch" });
        }
      } else {
        toast.error("Error from server.", { id: "direct-pitch" });
      }
    } catch (e) {
      toast.error("Network error.", { id: "direct-pitch" });
    } finally {
      setIsDirectSearching(false);
    }
  };

  const handleEnrichAll = async () => {
    setIsEnriching(true);
    toast.loading("AI Researcher is crawling and enriching leads...", { id: "enrich" });
    try {
      const res = await fetch("https://aisalesagent-cxre.onrender.com/api/automation/enrich_leads", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message, { id: "enrich" });
        await fetchSpreadsheetData(); // Refresh UI to show AI results
      } else {
        toast.error("Enrichment failed.", { id: "enrich" });
      }
    } catch (e) {
      toast.error("Failed to connect to AI engine.", { id: "enrich" });
    } finally {
      setIsEnriching(false);
    }
  };

  const [copilotLoadingId, setCopilotLoadingId] = useState<number | null>(null);

  const handleCopilotSuggest = async (leadId: number) => {
    setCopilotLoadingId(leadId);
    toast.loading("AI Copilot is drafting a reply...", { id: "copilot" });
    try {
      const res = await fetch(`https://aisalesagent-cxre.onrender.com/api/copilot/suggest/${leadId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          toast.error(data.error, { id: "copilot" });
        } else {
          toast.success("Reply generated!", { id: "copilot" });
          // We can show it in a larger persistent toast or alert for now
          toast.message("AI Suggested Reply", {
            description: (
              <div className="flex flex-col gap-2 mt-2">
                <div className="bg-surface-variant/50 p-2 rounded text-xs whitespace-pre-wrap">{data.suggested_reply}</div>
                <div className="text-[10px] text-secondary font-bold">Rationale: {data.rationale}</div>
                <button className="bg-primary text-white text-xs px-2 py-1 rounded mt-1 shadow self-start" onClick={() => navigator.clipboard.writeText(data.suggested_reply)}>Copy Reply</button>
              </div>
            ),
            duration: 15000,
          });
        }
      } else {
        toast.error("Failed to get suggestion.", { id: "copilot" });
      }
    } catch (e) {
      toast.error("Network error.", { id: "copilot" });
    } finally {
      setCopilotLoadingId(null);
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
    toast.loading("Deleting lead...", { id: "delete-lead" });
    try {
      const res = await fetch(`https://aisalesagent-cxre.onrender.com/api/automation/leads/${leadId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Lead deleted successfully!", { id: "delete-lead" });
        await fetchSpreadsheetData();
      } else {
        toast.error("Failed to delete lead.", { id: "delete-lead" });
      }
    } catch (e) {
      toast.error("Network error while deleting.", { id: "delete-lead" });
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 lg:-m-8 bg-surface-container-lowest">
        {/* Header */}
        <header className="shrink-0 border-b border-outline-variant px-8 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              <Icon name="folder" style={{ fontSize: 16 }} /> Workspaces / Fastigo Outbound
            </div>
            <h1 className="text-display-sm font-bold text-primary flex items-center gap-3">
              Master Lead List
              <span className="bg-surface-container-highest text-on-surface px-3 py-1 rounded-lg text-headline-sm">{rows.length} Rows</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 ${isFilterOpen ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface'} hover:bg-surface-container-high px-4 py-2 rounded-lg text-label-md font-bold transition-colors`}
            >
              <Icon name="filter_list" /> Filter
            </button>

            {/* Filter Popover */}
            {isFilterOpen && (
              <div className="absolute top-full right-32 mt-2 w-80 bg-surface border border-outline-variant shadow-xl rounded-xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest rounded-t-xl">
                  <span className="text-label-md font-bold text-on-surface">Filters</span>
                  <button onClick={() => setIsFilterOpen(false)} className="text-on-surface-variant hover:text-primary"><Icon name="close" style={{ fontSize: 18 }} /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Column</label>
                    <select className="w-full border border-outline-variant rounded-md px-3 py-1.5 text-body-sm focus:border-primary outline-none bg-surface">
                      <option>Industry</option>
                      <option>Employees</option>
                      <option>Decision Maker</option>
                      <option>Verified Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Condition</label>
                    <select className="w-full border border-outline-variant rounded-md px-3 py-1.5 text-body-sm focus:border-primary outline-none bg-surface">
                      <option>Contains</option>
                      <option>Equals</option>
                      <option>Is Not Empty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Value</label>
                    <input type="text" placeholder="e.g. Software" className="w-full border border-outline-variant rounded-md px-3 py-1.5 text-body-sm focus:border-primary outline-none bg-transparent" />
                  </div>
                </div>
                <div className="p-3 border-t border-outline-variant bg-surface-container-lowest rounded-b-xl flex justify-between">
                  <button className="text-primary text-label-sm font-bold hover:underline">+ Add rule</button>
                  <button onClick={() => setIsFilterOpen(false)} className="bg-primary text-white px-4 py-1.5 rounded-md text-label-sm font-bold shadow-sm hover:opacity-90">Apply</button>
                </div>
              </div>
            )}

            <button className="flex items-center gap-2 bg-surface-variant text-on-surface hover:bg-surface-container-high px-4 py-2 rounded-lg text-label-md font-bold transition-colors">
              <Icon name="sort" /> Sort
            </button>
            <div className="w-px h-8 bg-outline-variant mx-2" />
            <button
              onClick={() => setIsDirectPitchOpen(true)}
              className="flex items-center gap-2 bg-surface-container-high text-on-surface hover:bg-surface-variant px-5 py-2 rounded-lg text-label-md font-bold transition-colors"
            >
              <Icon name="add" /> Direct Add Lead
            </button>
            <button
              onClick={handleEnrichAll}
              disabled={isEnriching || rows.length === 0}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-label-md font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Icon name="bolt" /> {isEnriching ? "Enriching..." : "Enrich All"}
            </button>
          </div>

        </header>

        {/* Massive Horizontal Scrollable Spreadsheet */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              <table className="w-max text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-20 bg-surface-container-low">
                  <tr className="border-b border-outline-variant shadow-sm">
                    {/* Fixed Columns */}
                    <th className="sticky left-0 z-30 bg-surface-container-low px-4 py-2 border-r border-outline-variant/50 w-[40px] text-center">
                      <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
                    </th>
                    <th className="sticky left-[40px] z-30 bg-surface-container-low px-4 py-2 border-r border-outline-variant/50 min-w-[200px] text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                      Company
                    </th>

                    {/* Standard Data Columns */}
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[150px] text-label-sm font-bold text-on-surface-variant uppercase tracking-wider"><Icon name="language" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Website</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[150px] text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Industry</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[120px] text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Employees</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[200px] text-label-sm font-bold text-on-surface-variant uppercase tracking-wider"><Icon name="person" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Decision Maker</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[220px] text-label-sm font-bold text-on-surface-variant uppercase tracking-wider"><Icon name="lock" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Verified Email</th>

                    {/* Copilot AI Columns */}
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[300px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> AI Pitch</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[200px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Business Model</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[300px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Company Summary</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[250px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Pain Points</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[250px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Products</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[250px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> AI Opportunities</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[250px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Recent News</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[150px] bg-primary/5 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="auto_awesome" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> ICP Score</th>

                    {/* Tracking & Interaction Columns */}
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[200px] bg-secondary/5 text-secondary text-label-sm font-bold uppercase tracking-wider"><Icon name="timeline" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Engagement Status</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[300px] bg-secondary/5 text-secondary text-label-sm font-bold uppercase tracking-wider"><Icon name="record_voice_over" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Voice AI Summary</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[300px] bg-secondary/5 text-secondary text-label-sm font-bold uppercase tracking-wider"><Icon name="history" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Interaction History</th>
                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[150px] bg-primary/10 text-primary text-label-sm font-bold uppercase tracking-wider"><Icon name="smart_toy" style={{ fontSize: 14 }} className="mr-1 mb-0.5 inline" /> Copilot</th>

                    <th className="px-4 py-2 border-r border-outline-variant/50 min-w-[150px] text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50 text-body-sm text-on-surface">
                  {rows.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-surface-container-low transition-colors group">
                      <td className="sticky left-0 z-10 bg-surface-container-lowest group-hover:bg-surface-container-low px-4 py-2.5 border-r border-outline-variant/50 text-center">
                        <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
                      </td>
                      <td className="sticky left-[40px] z-10 bg-surface-container-lowest group-hover:bg-surface-container-low px-4 py-2.5 border-r border-outline-variant/50 font-semibold text-primary truncate max-w-[200px]">
                        <button
                          onClick={() => openDrawer({ 
                            id: r.id, 
                            name: r.decision_maker, 
                            company: r.company, 
                            score: r.icp_score, 
                            status: r.status, 
                            email: r.email, 
                            phone: r.phone,
                            pitch: r.pitch,
                            company_summary: r.company_summary,
                            business_model: r.business_model,
                            pain_points: r.pain_points
                          })}
                          className="hover:underline flex items-center gap-1 text-left"
                        >
                          {r.company} <Icon name="open_in_new" style={{ fontSize: 14 }} />
                        </button>
                      </td>

                      <td className="px-4 py-2.5 border-r border-outline-variant/50 truncate max-w-[150px] text-secondary">{r.website}</td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50 truncate max-w-[150px]">{r.industry}</td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50">{r.employees}</td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50 truncate max-w-[200px]">{r.decision_maker}</td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50 truncate max-w-[220px]">
                        {r.email ? (
                          <span className="flex items-center gap-1"><Icon name="check_circle" className="text-secondary" style={{ fontSize: 14 }} /> {r.email}</span>
                        ) : (
                          <button className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-outline-variant flex items-center gap-1 hover:bg-surface-variant transition-colors"><Icon name="lock_open" style={{ fontSize: 12 }} /> Reveal Email</button>
                        )}
                      </td>

                      {/* Copilot AI Cells */}
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[300px]">
                        <AICell content={r.pitch || "No pitch generated yet."} />
                      </td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[200px]">
                        <AICell content={r.business_model || "Detecting business model..."} />
                      </td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[300px]">
                        <AICell content={r.company_summary || "Click to generate summary..."} />
                      </td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]">
                        <AICell content={Array.isArray(r.pain_points) && r.pain_points.length > 0 ? r.pain_points.map((p: string) => `• ${p}`).join('\n') : "No pain points detected."} />
                      </td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]">
                        <AICell content={Array.isArray(r.products) && r.products.length > 0 ? r.products.map((p: string) => `• ${p}`).join('\n') : "Detecting products..."} />
                      </td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]">
                        <AICell content={Array.isArray(r.ai_opportunities) && r.ai_opportunities.length > 0 ? r.ai_opportunities.map((p: string) => `• ${p}`).join('\n') : "Detecting opportunities..."} />
                      </td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]">
                        <AICell content={Array.isArray(r.recent_news) && r.recent_news.length > 0 ? r.recent_news.map((p: string) => `• ${p}`).join('\n') : "No recent signals."} />
                      </td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[150px]">
                        <div className="h-full w-full px-4 py-2.5 flex items-center justify-between">
                          <span className={`font-bold ${r.icp_score > 80 ? 'text-secondary' : r.icp_score > 50 ? 'text-primary' : 'text-on-surface-variant'}`}>{r.icp_score || "N/A"}</span>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10 p-1 rounded"><Icon name="refresh" style={{ fontSize: 16 }} /></button>
                        </div>
                      </td>

                      {/* Tracking & Interaction Data */}
                      <td className="px-4 py-2.5 min-w-[200px] border-r border-outline-variant/50 bg-secondary/5">
                        {(() => {
                          const hasOpens = r.open_count > 0;
                          const latest = r.interactions && r.interactions.length > 0 ? r.interactions[0] : null;
                          if (hasOpens) {
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-secondary font-bold text-label-md flex items-center gap-1"><Icon name="visibility" style={{ fontSize: 16 }} /> Opened ({r.open_count}x)</span>
                                <span className="text-[10px] text-on-surface-variant">First: {new Date(r.first_opened_at).toLocaleString()}</span>
                              </div>
                            );
                          }
                          if (latest?.type === "Email Sent") {
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-primary font-bold text-label-md flex items-center gap-1"><Icon name="mark_email_read" style={{ fontSize: 16 }} /> Sent</span>
                                <span className="text-[10px] text-on-surface-variant">{new Date(latest.timestamp).toLocaleString()}</span>
                              </div>
                            );
                          }
                          return <span className="text-on-surface-variant text-label-sm italic">No engagement yet</span>;
                        })()}
                      </td>

                      <td className="px-0 py-0 min-w-[300px] border-r border-outline-variant/50 bg-secondary/5">
                        <div className="relative h-full w-full">
                          <AICell content={r.latest_call_summary || "No voice calls yet."} />
                          {r.is_hot_lead && (
                            <div className="absolute top-1 right-1 bg-[#ff4d4f] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse flex items-center gap-1">
                              <Icon name="local_fire_department" style={{ fontSize: 10 }} /> HOT LEAD
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-0 py-0 min-w-[300px] border-r border-outline-variant/50 bg-secondary/5">
                        <AICell content={
                          r.interactions && r.interactions.length > 0
                            ? r.interactions.map((i: any) => `[${new Date(i.timestamp).toLocaleDateString()}] ${i.type}${i.details?.summary ? ': ' + i.details.summary : ''}`).join('\n')
                            : "No history."
                        } />
                      </td>

                      <td className="px-4 py-2.5 min-w-[150px] border-r border-outline-variant/50 bg-primary/10">
                        <button
                          onClick={() => handleCopilotSuggest(r.id)}
                          disabled={copilotLoadingId === r.id}
                          className="flex items-center gap-1.5 w-full justify-center bg-primary text-white text-xs font-bold py-1.5 px-2 rounded hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Icon name="tips_and_updates" style={{ fontSize: 14 }} />
                          {copilotLoadingId === r.id ? "Drafting..." : "Copilot Reply"}
                        </button>
                      </td>

                      <td className="px-4 py-2.5 min-w-[150px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-outline-variant">{r.status}</span>
                          <button
                            onClick={() => handleDeleteLead(r.id)}
                            className="p-1.5 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 rounded-md"
                            title="Delete Lead"
                          >
                            <Icon name="delete" style={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && Array.from({ length: 25 }).map((_, i) => (
                    <tr key={`empty-${i}`} className="hover:bg-surface-container-low transition-colors h-[41px]">
                      <td className="sticky left-0 z-10 bg-surface-container-lowest px-4 py-2.5 border-r border-outline-variant/50 text-center">
                        <div className="w-4 h-4 rounded border border-outline-variant/30 bg-surface-variant/20 mx-auto" />
                      </td>
                      <td className="sticky left-[40px] z-10 bg-surface-container-lowest px-4 py-2.5 border-r border-outline-variant/50"></td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50"></td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50"></td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50"></td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50"></td>
                      <td className="px-4 py-2.5 border-r border-outline-variant/50"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[300px]"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[200px]"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[300px]"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[250px]"></td>
                      <td className="px-0 py-0 border-r border-outline-variant/50 bg-primary/5 min-w-[150px]"></td>

                      <td className="px-0 py-0 min-w-[200px] border-r border-outline-variant/50 bg-secondary/5"></td>
                      <td className="px-0 py-0 min-w-[300px] border-r border-outline-variant/50 bg-secondary/5"></td>
                      <td className="px-0 py-0 min-w-[300px] border-r border-outline-variant/50 bg-secondary/5"></td>
                      <td className="px-0 py-0 min-w-[150px] border-r border-outline-variant/50 bg-primary/10"></td>

                      <td className="px-4 py-2.5 min-w-[150px]"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="bg-surface-container-low border-t border-outline-variant p-2 flex justify-between items-center text-label-sm text-on-surface-variant">
            <span>Powered by Fastigo AI Copilot</span>
            <div className="flex gap-4">
              <span>{rows.length} records</span>
              <span>10 AI Enrichments Active</span>
            </div>
          </div>
        </div>
      </div>

      {isDirectPitchOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl p-6 w-[450px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-title-lg font-bold text-primary flex items-center gap-2">
                <Icon name="rocket_launch" /> Direct Add & Pitch
              </h2>
              <button onClick={() => setIsDirectPitchOpen(false)} className="text-on-surface-variant hover:text-primary">
                <Icon name="close" style={{ fontSize: 24 }} />
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Search Apollo for a company or manually enter their details. Fastigo AI will scrape, research, discover the best decision maker, and draft an outbound pitch instantly.
            </p>

            {/* Apollo Search Section */}
            <div className="mb-6 pb-6 border-b border-outline-variant">
              <form onSubmit={handleApolloSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search Apollo (e.g. Fastigo)"
                  value={apolloSearchQuery}
                  onChange={e => setApolloSearchQuery(e.target.value)}
                  className="flex-1 bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <button
                  type="submit"
                  disabled={isApolloSearching || !apolloSearchQuery}
                  className="bg-surface-variant text-on-surface hover:bg-surface-container-high px-4 py-2 rounded-lg text-label-md font-bold transition-colors disabled:opacity-50"
                >
                  {isApolloSearching ? "Searching..." : "Search"}
                </button>
              </form>

              {/* Apollo Search Results */}
              {apolloSearchResults.length > 0 && (
                <div className="mt-2 bg-surface border border-outline rounded-lg shadow-sm overflow-hidden divide-y divide-outline-variant max-h-[200px] overflow-y-auto">
                  {apolloSearchResults.map(c => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => selectApolloCompany(c)}
                      className="w-full text-left p-3 hover:bg-primary/5 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-label-md text-on-surface">{c.name}</div>
                        <div className="text-[11px] text-on-surface-variant">{c.website_url} • {c.industry}</div>
                      </div>
                      <Icon name="chevron_right" className="text-outline group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* People Search Results */}
              {isPeopleSearching && (
                <div className="mt-4 p-4 flex items-center justify-center bg-surface-container-lowest border border-outline rounded-lg">
                  <div className="flex items-center gap-2 text-primary font-bold text-label-md">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Finding decision makers...
                  </div>
                </div>
              )}
              {apolloPeople.length > 0 && (
                <div className="mt-4">
                  <div className="text-label-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Select a Decision Maker</div>
                  <div className="bg-surface border border-outline rounded-lg shadow-sm overflow-hidden divide-y divide-outline-variant max-h-[200px] overflow-y-auto">
                    {apolloPeople.map((p, i) => (
                      <button
                        key={p.id || i}
                        type="button"
                        onClick={() => selectApolloPerson(p)}
                        className={`w-full text-left p-3 transition-colors flex items-center justify-between group ${
                          directSearchForm.target_first_name === (p.first_name || "") && directSearchForm.target_last_name === (p.last_name || "")
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "hover:bg-surface-container-low"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-label-md text-on-surface flex items-center gap-2">
                            {p.first_name} {p.last_name}
                            {p.email && <Icon name="mark_email_read" className="text-secondary" style={{ fontSize: 14 }} />}
                            {p.linkedin_url && (
                              <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:text-secondary-fixed transition-colors" onClick={(e) => e.stopPropagation()}>
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-on-surface-variant">{p.title}</div>
                        </div>
                        <Icon name="check_circle" className={
                          directSearchForm.target_first_name === (p.first_name || "") && directSearchForm.target_last_name === (p.last_name || "")
                            ? "text-primary"
                            : "text-outline/30 group-hover:text-outline"
                        } />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleDirectPitch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface mb-1">Company Website Domain <span className="text-error">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. fastigo.co"
                    value={directSearchForm.domain}
                    onChange={e => setDirectSearchForm({ ...directSearchForm, domain: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface mb-1">Company Name <span className="text-error">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Fastigo Technology"
                    value={directSearchForm.company_name}
                    onChange={e => setDirectSearchForm({ ...directSearchForm, company_name: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-outline-variant pt-4 mt-2">
                <div className="text-label-sm font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Target Decision Maker (Optional)</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface mb-1">First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John"
                      value={directSearchForm.target_first_name}
                      onChange={e => setDirectSearchForm({ ...directSearchForm, target_first_name: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Doe"
                      value={directSearchForm.target_last_name}
                      onChange={e => setDirectSearchForm({ ...directSearchForm, target_last_name: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. CEO"
                      value={directSearchForm.target_title}
                      onChange={e => setDirectSearchForm({ ...directSearchForm, target_title: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="e.g. john@fastigo.co"
                      value={directSearchForm.target_email}
                      onChange={e => setDirectSearchForm({ ...directSearchForm, target_email: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="forceRecheck"
                  checked={directSearchForm.force_recheck}
                  onChange={e => setDirectSearchForm({ ...directSearchForm, force_recheck: e.target.checked })}
                  className="w-4 h-4 text-primary bg-surface-container border-outline rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="forceRecheck" className="text-body-sm text-on-surface">
                  Force AI to re-research company (Ignores cached data)
                </label>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDirectPitchOpen(false)}
                  className="px-4 py-2 text-label-md font-bold text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDirectSearching}
                  className="px-5 py-2 bg-primary text-white text-label-md font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDirectSearching ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching...</>
                  ) : (
                    <><Icon name="auto_awesome" style={{ fontSize: 18 }} /> Pitch Company</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function AICell({ content }: { content: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
    <div
      className="relative h-full w-full min-h-[44px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`p-2.5 h-full whitespace-pre-wrap line-clamp-3 ${isHovered ? 'opacity-30' : 'opacity-100'} transition-opacity`}>
        {content}
      </div>

      {/* Cell-Level AI Actions Popover */}
      {isHovered && (
        <div className="absolute inset-0 z-40 bg-surface/90 backdrop-blur-sm flex items-center justify-center gap-1 px-1 border border-primary/20 shadow-lg shadow-primary/5 animate-in fade-in duration-100">
          <button title="View Full" onClick={() => setIsModalOpen(true)} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors flex flex-col items-center gap-0.5">
            <Icon name="visibility" style={{ fontSize: 16 }} />
            <span className="text-[9px] font-bold uppercase leading-none">View</span>
          </button>
          <button title="Regenerate" onClick={() => toast.success("Regenerating cell...")} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors flex flex-col items-center gap-0.5">
            <Icon name="bolt" filled style={{ fontSize: 16 }} />
            <span className="text-[9px] font-bold uppercase leading-none">Regen</span>
          </button>
          <button title="Copy" onClick={() => { navigator.clipboard.writeText(content); toast.success("Copied!"); }} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-md transition-colors flex flex-col items-center gap-0.5">
            <Icon name="content_copy" style={{ fontSize: 16 }} />
            <span className="text-[9px] font-bold uppercase leading-none">Copy</span>
          </button>
        </div>
      )}
    </div>
    
    {/* Full View Modal */}
    {isModalOpen && (
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in p-4" onClick={() => setIsModalOpen(false)}>
        <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-3">
            <h3 className="text-title-md font-bold text-on-surface flex items-center gap-2">
              <Icon name="auto_awesome" className="text-primary" /> AI Generated Insight
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-primary">
              <Icon name="close" />
            </button>
          </div>
          <div className="overflow-y-auto whitespace-pre-wrap text-body-md text-on-surface-variant flex-1 custom-scrollbar pr-2 pb-4">
            {content}
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant flex justify-end gap-2">
            <button onClick={() => { navigator.clipboard.writeText(content); toast.success("Copied!"); }} className="px-4 py-2 bg-surface-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2">
              <Icon name="content_copy" style={{ fontSize: 18 }} /> Copy
            </button>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
