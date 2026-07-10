import React, { createContext, useContext, useState } from "react";

type Lead = {
  id: string | number;
  name: string;
  company: string;
  score: number;
  status: string;
  email?: string;
  phone?: string;
  pitch?: string;
  company_summary?: string;
  business_model?: string;
  pain_points?: string[];
};

type LeadDrawerContextType = {
  isOpen: boolean;
  selectedLead: Lead | null;
  openDrawer: (lead: Lead) => void;
  closeDrawer: () => void;
};

const LeadDrawerContext = createContext<LeadDrawerContextType | undefined>(undefined);

export function LeadDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setSelectedLead(null);
  };

  return (
    <LeadDrawerContext.Provider value={{ isOpen, selectedLead, openDrawer, closeDrawer }}>
      {children}
    </LeadDrawerContext.Provider>
  );
}

export function useLeadDrawer() {
  const context = useContext(LeadDrawerContext);
  if (context === undefined) {
    throw new Error("useLeadDrawer must be used within a LeadDrawerProvider");
  }
  return context;
}
