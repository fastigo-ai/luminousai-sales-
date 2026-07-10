import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/automations")({
  head: () => ({ meta: [{ title: "Find Companies | Clay Replica" }] }),
  component: ClayFindCompaniesReplica,
});



function ClayFindCompaniesReplica() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<any>({
    includedIndustries: [],
    excludedIndustries: [],
    companySizes: [],
    includedLocations: [],
    includedKeywords: "",
    excludedKeywords: "",
    limit: "100"
  });

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch("http://localhost:8000/api/automation/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters })
      });
      const data = await response.json();
      if (data.status === "success") {
        setCompanies(data.data);
      }
    } catch (error) {
      console.error("Failed to search companies:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleContinue = async () => {
    setIsEnriching(true);
    try {
      const payload = {
        companies: companies.map(c => ({ 
          domain: c.website,
          company_name: c.name,
          industry: c.industry,
          description: c.desc,
          apollo_organization_id: c.id ? String(c.id) : null,
          linkedin_url: c.linkedin || null
        }))
      };
      const response = await fetch("http://localhost:8000/api/automation/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.status === "success") {
        const enrichedResults = data.data; // Dictionary keyed by domain
        const updatedCompanies = companies.map(c => {
          const enriched = enrichedResults[c.website];
          if (enriched) {
            return { ...c, phone: enriched.phone, email: enriched.email, isUnlocked: true };
          }
          return { ...c, isUnlocked: false };
        });
        setCompanies(updatedCompanies as any);
      }
    } catch (error) {
      console.error("Failed to enrich companies:", error);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <AppShell>
      <div className="-mx-6 lg:-mx-8 -my-6 lg:-my-8 lg:-mb-8 h-[calc(100vh-64px)] bg-white flex flex-col font-sans text-[#1c1c1c]">
      {/* Top Header */}
      <header className="h-12 border-b border-gray-200 flex items-center px-4 shrink-0 bg-white shadow-sm z-20">
        <button onClick={() => router.history.back()} className="p-1 text-gray-500 hover:bg-gray-100 rounded mr-2">
          <Icon name="arrow_back" style={{ fontSize: 18 }} />
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 text-gray-500 hover:bg-gray-100 rounded mr-4" title="Toggle Sidebar">
          <Icon name={sidebarOpen ? "keyboard_double_arrow_left" : "keyboard_double_arrow_right"} style={{ fontSize: 18 }} />
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="domain" style={{ fontSize: 18 }} className="text-gray-500" />
          <span>Find Companies</span>
          <Icon name="unfold_more" style={{ fontSize: 16 }} className="text-gray-400" />
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden relative pb-16">
        
        {/* Left Sidebar (Filters) */}
        {sidebarOpen && (
          <aside className="w-[320px] shrink-0 border-r border-gray-200 bg-white flex flex-col z-10">
            
            {/* Sidebar Header */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">Find companies with filters</h2>
              <button onClick={handleSearch} disabled={isSearching} className="flex items-center gap-1 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm py-1.5 flex justify-center items-center gap-1 hover:bg-gray-50">
                See past searches <Icon name="expand_more" style={{ fontSize: 16 }} />
              </button>
              <button className="flex-1 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm py-1.5 hover:bg-gray-50">
                Save search
              </button>
            </div>
          </div>

          {/* Scrollable Filters */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
            
            {/* Company Attributes Accordion */}
            <Accordion title="Company attributes" icon="domain" defaultOpen>
              <SelectField label="Industries to include" placeholder="e.g. Software development" options={INDUSTRY_OPTIONS} value={filters.includedIndustries} onChange={(val) => setFilters((prev: any) => ({ ...prev, includedIndustries: val }))} />
              <SelectField label="Industries to exclude" placeholder="e.g. Advertising services" options={INDUSTRY_OPTIONS} value={filters.excludedIndustries} onChange={(val) => setFilters((prev: any) => ({ ...prev, excludedIndustries: val }))} />
              <SelectField label="Company sizes" placeholder="e.g. 11-50 employees" options={COMPANY_SIZE_OPTIONS} value={filters.companySizes} onChange={(val) => setFilters((prev: any) => ({ ...prev, companySizes: val }))} />
              <SelectField label="Annual revenue" placeholder="e.g. $1M - $5M" options={REVENUE_OPTIONS} />
              <SelectField label="Funding raised" placeholder="e.g. $5M - $10M" options={FUNDING_OPTIONS} />
              
              <div className="mb-4">
                <label className="block text-[13px] font-bold text-gray-800 mb-1">Estimated employee count</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Min" className="w-1/2 border border-gray-300 rounded py-1.5 px-3 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400" />
                  <input type="text" placeholder="Max" className="w-1/2 border border-gray-300 rounded py-1.5 px-3 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400" />
                </div>
              </div>

              <SelectField label="Company types" placeholder="e.g. Privately held" options={COMPANY_TYPE_OPTIONS} />
              <InputField 
                label="Description keywords to include" 
                placeholder="e.g. sales, data, outbound" 
                value={filters.includedKeywords} 
                onChange={(e) => setFilters((prev: any) => ({ ...prev, includedKeywords: e.target.value }))} 
              />
              <InputField 
                label="Description keywords to exclude" 
                placeholder="e.g. provider, platform, apna college" 
                value={filters.excludedKeywords} 
                onChange={(e) => setFilters((prev: any) => ({ ...prev, excludedKeywords: e.target.value }))} 
              />
              <InputField label="Minimum estimated audience size" placeholder="e.g. 10" />
            </Accordion>

            {/* Location Accordion */}
            <Accordion title="Location" defaultOpen={false}>
              <SelectField label="Countries to include" placeholder="e.g. United States, Canada" options={COUNTRY_OPTIONS} value={filters.includedLocations} onChange={(val) => setFilters((prev: any) => ({ ...prev, includedLocations: val }))} />
              <SelectField label="Countries to exclude" placeholder="e.g. France, Spain" options={COUNTRY_OPTIONS} />
              <SelectField label="Regions to include" placeholder="e.g. NAM, EMEA" options={REGION_OPTIONS} />
              <SelectField label="Regions to exclude" placeholder="e.g. APAC, LATAM" options={REGION_OPTIONS} />
              <SelectField label="Cities to include" placeholder="e.g. San Francisco, London" options={CITY_OPTIONS} />
              <SelectField label="Cities to exclude" placeholder="e.g. New York, Paris" options={CITY_OPTIONS} />
              <SelectField label="States, provinces, or municipalities to include" placeholder="e.g. California, New York" options={STATE_OPTIONS} />
              <SelectField label="States, provinces, or municipalities to exclude" placeholder="" options={STATE_OPTIONS} />
            </Accordion>

            {/* Limit Results Accordion */}
            <Accordion title="Limit results" icon="speed" defaultOpen={false}>
              <p className="text-[13px] text-gray-600 mb-3 leading-relaxed">
                You can import up to 1K results to tables and up to 1M to Audiences. For a higher table row limit, <a href="#" className="text-blue-600 font-semibold hover:underline">upgrade your plan</a>.
              </p>
              <InputField 
                label="" 
                placeholder="e.g. 100" 
                value={filters.limit}
                onChange={(e) => setFilters((prev: any) => ({ ...prev, limit: e.target.value }))}
              />
            </Accordion>
          </div>
        </aside>
        )}

        {/* Right Preview Panel */}
        <main className="flex-1 bg-white overflow-hidden flex flex-col relative z-0">
          
          {/* Table Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-[#f9fafb]">
            <h3 className="text-sm font-bold text-gray-800">Preview</h3>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-white sticky top-0 z-10 shadow-sm shadow-gray-200/50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 w-12 border-r border-gray-200">#</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="text_fields" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Name</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="text_fields" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Description</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="text_fields" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Primary Industry</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="text_fields" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Size</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="text_fields" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Type</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="text_fields" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Location</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="text_fields" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Country</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="link" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> LinkedIn URL</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="language" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Website</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="call" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Phone</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="mail" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Email</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="event" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Founded Year</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600 border-r border-gray-200"><Icon name="attach_money" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Annual Revenue</th>
                  <th className="px-4 py-2 text-[13px] font-bold text-gray-600"><Icon name="label" style={{fontSize: 14}} className="inline mr-1 text-gray-400" /> Keywords</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 text-[13px] text-gray-800">
                    <td className="px-4 py-2 border-r border-gray-100 text-gray-500 text-center">{row.id}</td>
                    <td className="px-4 py-2 border-r border-gray-100 font-semibold">{row.name}</td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.desc}</td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.industry}</td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.size}</td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.type}</td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.location}</td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.country}</td>
                    <td className="px-4 py-2 border-r border-gray-100 text-blue-600 hover:underline cursor-pointer"><a href={row.linkedin?.startsWith('http') ? row.linkedin : `https://${row.linkedin}`} target="_blank" rel="noreferrer">{row.linkedin?.replace(/^https?:\/\//, '')}</a></td>
                    <td className="px-4 py-2 border-r border-gray-100 text-blue-600 hover:underline cursor-pointer"><a href={row.website?.startsWith('http') ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer">{row.website?.replace(/^https?:\/\//, '')}</a></td>
                    <td className="px-4 py-2 border-r border-gray-100 whitespace-nowrap">
                      {row.isUnlocked ? (
                        <span className="font-medium text-gray-800">{row.phone}</span>
                      ) : (
                        <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 w-full justify-center">
                          <Icon name="lock" style={{fontSize: 12}} /> Unlock (1)
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-100 whitespace-nowrap">
                      {row.isUnlocked ? (
                        <span className="font-medium text-gray-800">{row.email}</span>
                      ) : (
                        <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 w-full justify-center">
                          <Icon name="lock" style={{fontSize: 12}} /> Unlock (1)
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.founded}</td>
                    <td className="px-4 py-2 border-r border-gray-100">{row.revenue}</td>
                    <td className="px-4 py-2">{row.keywords}</td>
                  </tr>
                ))}
                {/* Empty Rows Fill */}
                {Array.from({length: 20}).map((_, i) => (
                   <tr key={`empty-${i}`} className="h-8 hover:bg-gray-50">
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td className="border-r border-gray-100"></td>
                      <td></td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* Sticky Action Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 z-50">
          <div className="text-[13px] text-gray-600 font-medium">
            Showing <strong className="text-gray-900 font-bold">{companies.length}</strong> results
          </div>
          <button 
            onClick={handleContinue}
            disabled={isEnriching}
            className={`bg-[#0070f3] text-white px-4 py-2 rounded-md text-[13px] font-bold flex items-center gap-1 transition-colors shadow-sm ${isEnriching ? "opacity-70 cursor-not-allowed" : "hover:bg-[#0060df]"}`}
          >
            {isEnriching ? "AI is Enriching & Pitching..." : "Continue"} {!isEnriching && <Icon name="expand_more" style={{fontSize: 16}} />}
          </button>
        </div>
      </div>
    </div>
    </AppShell>
  );
}

/* UI Subcomponents matching Clay exactly */

function Accordion({ title, icon, defaultOpen = false, children }: { title: string; icon?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 bg-[#f9fafb] hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <span className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
          {icon && <Icon name={icon} style={{fontSize: 18}} className="text-gray-700" />}
          {title}
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} className="text-gray-500" />
      </button>
      {open && (
        <div className="p-3 border-t border-gray-200 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Dummy Options for the dropdowns
const INDUSTRY_OPTIONS = [
  "Software Development", "Advertising Services", "Financial Services", 
  "Healthcare", "Manufacturing", "Retail", "Telecommunications", "Education",
  "Non-profit Organizations", "Business Consulting and Services", "Computers and Electronics",
  "Food and Beverage Services", "Book and Periodical Publishing"
];
const COMPANY_SIZE_OPTIONS = ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "501-1000 employees", "1001-5000 employees", "5001-10,000 employees", "10,001+ employees"];
const REVENUE_OPTIONS = ["$0 - $1M", "$1M - $10M", "$10M - $50M", "$50M - $100M", "$100M - $250M", "$250M - $1B", "$1B+"];
const FUNDING_OPTIONS = ["$0 - $1M", "$1M - $5M", "$5M - $20M", "$20M - $50M", "$50M - $100M", "$100M+"];
const COMPANY_TYPE_OPTIONS = ["Public Company", "Privately Held", "Non Profit", "Educational Institution", "Government Agency"];
const COUNTRY_OPTIONS = ["United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France", "Japan", "Brazil", "Switzerland"];
const REGION_OPTIONS = ["North America (NAM)", "Europe, Middle East, Africa (EMEA)", "Asia-Pacific (APAC)", "Latin America (LATAM)"];
const CITY_OPTIONS = ["San Francisco", "New York", "London", "Paris", "Berlin", "Tokyo", "Sydney", "Mumbai", "Toronto"];
const STATE_OPTIONS = ["California", "New York", "Texas", "London", "Île-de-France", "Ontario"];

function SelectField({ label, placeholder, options = [], value, onChange }: { label: string; placeholder: string; options?: string[]; value?: string[]; onChange?: (val: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  
  const selected = onChange ? (value || []) : localSelected;

  const toggleOption = (opt: string) => {
    const newVal = selected.includes(opt) ? selected.filter(p => p !== opt) : [...selected, opt];
    if (onChange) onChange(newVal);
    else setLocalSelected(newVal);
  };

  const removeOption = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    const newVal = selected.filter(p => p !== opt);
    if (onChange) onChange(newVal);
    else setLocalSelected(newVal);
  };

  const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mb-4 relative">
      <label className="block text-[13px] font-bold text-gray-800 mb-1">{label}</label>
      
      {/* Input / Chip Container */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[34px] w-full border border-gray-300 rounded px-2 py-1 flex items-center flex-wrap gap-1 bg-white cursor-text focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
      >
        {selected.map(sel => (
          <span key={sel} className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
            {sel}
            <button onClick={(e) => removeOption(e, sel)} className="hover:text-blue-900"><Icon name="close" style={{fontSize: 12}}/></button>
          </span>
        ))}
        
        <input 
          type="text" 
          placeholder={selected.length === 0 ? placeholder : ""} 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="flex-1 min-w-[50px] outline-none text-[13px] bg-transparent placeholder:text-gray-400"
        />
        <Icon name="expand_more" style={{fontSize: 16}} className="text-gray-400" />
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md z-[100] max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    toggleOption(opt);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] flex items-center justify-between hover:bg-gray-50 ${isSelected ? 'bg-blue-50/50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                >
                  {opt}
                  {isSelected && <Icon name="check" style={{fontSize: 16}} className="text-blue-600" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-[13px] text-gray-500 text-center">No options found.</div>
          )}
        </div>
      )}
      
      {/* Invisible backdrop to close popover */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

function InputField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-[13px] font-bold text-gray-800 mb-1">{label}</label>}
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value !== undefined ? value : ""}
        onChange={onChange}
        readOnly={!onChange}
        className="w-full border border-gray-300 rounded py-1.5 px-3 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
      />
    </div>
  );
}
