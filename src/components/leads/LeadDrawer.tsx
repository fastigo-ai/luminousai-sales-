import React from "react";
import { useLeadDrawer } from "@/contexts/LeadDrawerContext";

export function LeadDrawer() {
  const { isOpen, closeDrawer, selectedLead } = useLeadDrawer();

  if (!isOpen || !selectedLead) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-xl border-l border-outline-variant flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <h2 className="text-xl font-bold text-on-surface">Lead Details</h2>
          <button 
            onClick={closeDrawer}
            className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-primary">{selectedLead.name}</h3>
              <p className="text-lg text-on-surface-variant">{selectedLead.company}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-variant p-4 rounded-xl">
                <p className="text-sm text-on-surface-variant">ICP Score</p>
                <p className="text-xl font-bold text-on-surface">{selectedLead.score}/100</p>
              </div>
              <div className="bg-surface-variant p-4 rounded-xl">
                <p className="text-sm text-on-surface-variant">Status</p>
                <p className="text-xl font-bold text-on-surface">{selectedLead.status}</p>
              </div>
            </div>

            {selectedLead.email && (
              <div className="bg-surface-variant p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-on-surface-variant">Email</p>
                  <p className="text-on-surface font-medium">{selectedLead.email}</p>
                </div>
                <button className="text-primary hover:text-primary-hover">
                  <span className="material-symbols-outlined">content_copy</span>
                </button>
              </div>
            )}
            
            {selectedLead.phone && (
              <div className="bg-surface-variant p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-on-surface-variant">Phone</p>
                  <p className="text-on-surface font-medium">{selectedLead.phone}</p>
                </div>
              </div>
            )}
            
            {(selectedLead.company_summary || selectedLead.pain_points || selectedLead.pitch) && (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl space-y-4">
                <h4 className="text-label-lg font-bold text-primary flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  AI Insights
                </h4>
                
                {selectedLead.company_summary && (
                  <div>
                    <p className="text-[11px] font-bold text-primary/70 uppercase tracking-wider mb-1">Company Summary</p>
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{selectedLead.company_summary}</p>
                  </div>
                )}
                
                {selectedLead.business_model && (
                  <div>
                    <p className="text-[11px] font-bold text-primary/70 uppercase tracking-wider mb-1">Business Model</p>
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{selectedLead.business_model}</p>
                  </div>
                )}
                
                {selectedLead.pain_points && selectedLead.pain_points.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-primary/70 uppercase tracking-wider mb-1">Pain Points</p>
                    <ul className="text-sm text-on-surface list-disc pl-4 space-y-1">
                      {selectedLead.pain_points.map((point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedLead.pitch && (
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-[11px] font-bold text-primary/70 uppercase tracking-wider mb-2">Generated Pitch</p>
                    <div className="bg-surface-container-lowest p-3 rounded-lg text-sm text-on-surface whitespace-pre-wrap border border-outline-variant/50">
                      {selectedLead.pitch}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-6 border-t border-outline-variant space-y-3">
              <button className="w-full py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">mail</span>
                Send Pitch
              </button>
              <button className="w-full py-3 bg-surface text-primary border border-primary rounded-lg font-medium hover:bg-surface-variant transition-colors">
                View Company Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
