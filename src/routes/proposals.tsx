import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/layout/Icon";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/proposals")({
  component: ProposalsComponent,
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || "https://aisalesagent-cxre.onrender.com") + "";

function ProposalsComponent() {
  const { data: eligibleData, isLoading: isLoadingEligible } = useQuery({
    queryKey: ["proposals-eligible"],
    queryFn: () => fetch(`${BACKEND_URL}/api/proposals/eligible`).then((res) => res.json()),
  });

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalMarkdown, setProposalMarkdown] = useState<string | null>(null);

  const leads = eligibleData?.leads || [];
  
  // Find currently selected lead for display
  const selectedLead = leads.find((l: any) => l.id === selectedLeadId);

  const generateProposal = async () => {
    if (!selectedLeadId) return;
    
    setIsGenerating(true);
    setProposalMarkdown(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/proposals/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: selectedLeadId })
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        toast.error(data.markdown);
      } else {
        setProposalMarkdown(data.markdown);
        toast.success("AI Proposal generated successfully!");
      }
    } catch (error) {
      toast.error("Failed to generate proposal");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-2">
          <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-label-md uppercase tracking-wider font-semibold">
            <Icon name="arrow_back" style={{ fontSize: 16 }} /> Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-display-sm font-bold text-primary flex items-center gap-3">
            <Icon name="description" /> AI Proposals
          </h1>
          <p className="text-on-surface-variant text-body-lg mt-1">
            Instantly draft tailored enterprise proposals using AI context.
          </p>
        </div>
        {proposalMarkdown && (
          <div className="flex gap-2">
            <button 
              className="flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed px-5 py-2.5 rounded-full font-bold hover:bg-secondary-fixed/90 transition-colors shadow-sm"
              onClick={async () => {
                try {
                  // Dynamically import html2pdf to avoid SSR issues
                  const html2pdf = (await import('html2pdf.js')).default;
                  const element = document.getElementById('proposal-pdf-content');
                  if (element) {
                    toast.loading("Generating PDF...", { id: "pdf" });
                    html2pdf().from(element).set({
                      margin: 10,
                      filename: `${selectedLead?.company_name}_Proposal.pdf`,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    }).save().then(() => toast.success("PDF Downloaded!", { id: "pdf" }));
                  }
                } catch (e) {
                  toast.error("Failed to generate PDF");
                }
              }}
            >
              <Icon name="picture_as_pdf" /> Download PDF
            </button>
            <button 
              className="flex items-center gap-2 bg-surface-container-high text-on-surface px-5 py-2.5 rounded-full font-bold hover:bg-surface-container-highest transition-colors shadow-sm border border-outline-variant"
              onClick={() => {
                navigator.clipboard.writeText(proposalMarkdown);
                toast.success("Copied to clipboard!");
              }}
            >
              <Icon name="content_copy" /> Copy Markdown
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Lead Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-6 rounded-xl border border-outline-variant">
            <h3 className="text-headline-sm font-bold text-on-surface mb-4">Select Lead</h3>
            
            {isLoadingEligible ? (
              <div className="flex justify-center p-4"><Icon name="refresh" className="animate-spin text-primary" /></div>
            ) : leads.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">No highly qualified leads available for proposals yet.</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {leads.map((l: any) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLeadId(l.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedLeadId === l.id
                        ? 'border-primary bg-primary/10'
                        : 'border-outline-variant hover:border-primary/30 bg-surface-container-lowest'
                    }`}
                  >
                    <div className="font-bold text-on-surface">{l.company_name}</div>
                    <div className="text-body-sm text-on-surface-variant">{l.name}</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">
                      {l.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {selectedLeadId && (
            <button
              onClick={generateProposal}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                isGenerating 
                  ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' 
                  : 'bg-primary text-on-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--color-primary),0.3)]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Icon name="refresh" className="animate-spin text-3xl" />
                  <span>Drafting Proposal...</span>
                </>
              ) : (
                <>
                  <Icon name="auto_awesome" className="text-3xl" />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column: Document Preview */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-xl border border-outline-variant min-h-[600px] flex flex-col overflow-hidden">
            <div className="bg-surface-container-low border-b border-outline-variant px-6 py-4 flex items-center gap-3">
              <Icon name="edit_document" className="text-on-surface-variant" />
              <h3 className="font-semibold text-on-surface">
                {selectedLead ? `Proposal for ${selectedLead.company_name}` : 'Document Preview'}
              </h3>
            </div>
            
            <div className="flex-1 p-8 bg-white text-black overflow-y-auto max-h-[700px] custom-scrollbar">
              {!selectedLeadId ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Icon name="description" className="text-6xl mb-4 opacity-30" />
                  <p>Select a lead to generate a proposal</p>
                </div>
              ) : isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-primary space-y-4">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-semibold text-lg text-gray-500 animate-pulse">AI is writing the proposal...</p>
                </div>
              ) : proposalMarkdown ? (
                <div id="proposal-pdf-content" className="prose prose-sm max-w-none prose-headings:text-black prose-p:text-gray-800 prose-a:text-blue-600 prose-strong:text-black">
                  <ReactMarkdown>{proposalMarkdown}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p>Ready to generate. Click the button on the left.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
