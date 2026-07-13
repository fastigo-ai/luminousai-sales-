import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/layout/Icon";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import * as Dialog from '@radix-ui/react-dialog';
import { AppShell } from "@/components/layout/AppShell";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/campaigns")({
  component: CampaignsComponent,
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || "https://aisalesagent-cxre.onrender.com") + "";

function CampaignsComponent() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetch(`${BACKEND_URL}/api/campaigns`).then((res) => res.json()),
  });

  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Flash effect state mapping campaign ID to event type
  const [flashing, setFlashing] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const connectWs = () => {
      const ws = new WebSocket(`${(import.meta.env.VITE_BACKEND_URL || "wss://aisalesagent-cxre.onrender.com").replace("http", "ws")}/api/campaigns/stream`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log("Campaigns WebSocket connected");
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.event === "email_opened" || msg.event === "email_replied") {
          // Trigger a re-fetch of the data to get fresh numbers
          refetch();
          
          // Trigger the flash animation on the specific campaign
          if (msg.campaign_id) {
             setFlashing(prev => ({ ...prev, [msg.campaign_id]: msg.event }));
             toast.success(`New activity: ${msg.event.replace('_', ' ')}!`);
             
             // Remove flash after 3 seconds
             setTimeout(() => {
                setFlashing(prev => {
                   const newMap = { ...prev };
                   delete newMap[msg.campaign_id];
                   return newMap;
                });
             }, 3000);
          }
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Attempt to reconnect after 5s
        setTimeout(connectWs, 5000);
      };
    };

    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [refetch]);

  if (isLoading) {
    return <div className="p-8 text-on-surface flex justify-center"><Icon name="refresh" className="animate-spin text-3xl text-primary" /></div>;
  }

  const campaigns = data?.campaigns || [];

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-primary flex items-center gap-3">
            <Icon name="campaign" /> Campaigns
            {wsConnected ? (
              <span className="flex items-center gap-2 px-2 py-1 bg-secondary-fixed/20 text-secondary-fixed text-label-md rounded-full">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
                Live Sync Active
              </span>
            ) : (
              <span className="flex items-center gap-2 px-2 py-1 bg-error-container text-on-error-container text-label-md rounded-full">
                <span className="w-2 h-2 rounded-full bg-error" />
                Disconnected
              </span>
            )}
          </h1>
          <p className="text-on-surface-variant text-body-lg mt-1">
            Real-time outbound sequences and engagement tracking.
          </p>
        </div>
        <button 
          onClick={() => toast.info("Campaign creation coming soon!", { id: "new-campaign" })}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Icon name="add" /> New Campaign
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-4">
        {campaigns.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-on-surface-variant text-center rounded-xl border-dashed">
            <Icon name="inbox" className="text-6xl mb-4 opacity-50" />
            <h3 className="text-headline-sm font-bold text-on-surface">No active campaigns</h3>
            <p className="mt-2 text-body-md max-w-sm">Create a new outbound sequence to start tracking live interactions.</p>
          </div>
        ) : (
          campaigns.map((camp: any) => {
             const isFlashing = flashing[camp.id];
             return (
               <div 
                 key={camp.id} 
                 className={`glass-card rounded-xl p-6 border transition-all duration-500 ${
                   isFlashing 
                     ? 'border-secondary-fixed bg-secondary-fixed/10 scale-[1.01] shadow-[0_0_15px_rgba(40,167,69,0.3)]' 
                     : 'border-outline-variant hover:border-primary/50'
                 }`}
               >
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-headline-sm font-bold text-primary">{camp.name}</h3>
                        <span className={`px-2 py-1 rounded text-label-sm font-bold uppercase tracking-wider ${
                          camp.status === 'Active' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {camp.status}
                        </span>
                      </div>
                    </div>
                    <Dialog.Root>
                      <Dialog.Trigger asChild>
                        <button 
                          className="text-primary hover:text-primary/80 font-bold text-label-md flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => {
                            // Pre-fetch leads
                            fetch(`${BACKEND_URL}/api/campaigns/${camp.id}/leads`)
                              .then(res => res.json())
                              .then(data => {
                                // We can store this in a state mapping or just use a local state. 
                                // Let's trigger a fetch inside the modal component or just set a global state.
                              });
                          }}
                        >
                          View Leads <Icon name="arrow_forward" style={{ fontSize: 16 }} />
                        </button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-outline bg-surface-container shadow-2xl p-6 sm:rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                          <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-headline-sm font-bold text-primary">{camp.name} - Leads</Dialog.Title>
                            <Dialog.Close className="text-on-surface-variant hover:text-on-surface transition-colors">
                              <Icon name="close" />
                            </Dialog.Close>
                          </div>
                          
                          <CampaignLeadsTable campaignId={camp.id} />
                          
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                   <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 flex flex-col">
                     <span className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
                       <Icon name="group" style={{ fontSize: 16 }} /> Total Leads
                     </span>
                     <span className="text-display-sm font-bold text-on-surface">{camp.total_leads}</span>
                   </div>
                   
                   <div className={`p-4 rounded-lg border flex flex-col transition-colors duration-500 ${
                     isFlashing === 'email_opened' ? 'bg-secondary-fixed/20 border-secondary-fixed' : 'bg-surface-container-lowest border-outline-variant/50'
                   }`}>
                     <span className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
                       <Icon name="mark_email_read" style={{ fontSize: 16 }} /> Opened
                     </span>
                     <div className="flex items-baseline gap-2">
                       <span className="text-display-sm font-bold text-on-surface">{camp.opened}</span>
                       {camp.total_leads > 0 && (
                         <span className="text-body-sm text-on-surface-variant">
                           {Math.round((camp.opened / camp.total_leads) * 100)}%
                         </span>
                       )}
                     </div>
                   </div>
                   
                   <div className={`p-4 rounded-lg border flex flex-col transition-colors duration-500 ${
                     isFlashing === 'email_replied' ? 'bg-secondary-fixed/20 border-secondary-fixed' : 'bg-surface-container-lowest border-outline-variant/50'
                   }`}>
                     <span className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
                       <Icon name="reply" style={{ fontSize: 16 }} /> Replied
                     </span>
                     <div className="flex items-baseline gap-2">
                       <span className="text-display-sm font-bold text-on-surface">{camp.replied}</span>
                       {camp.opened > 0 && (
                         <span className="text-body-sm text-on-surface-variant">
                           {Math.round((camp.replied / camp.opened) * 100)}%
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             );
          })
        )}
      </div>
    </div>
    </AppShell>
  );
}

// Subcomponent to fetch and render leads for a specific campaign inside the modal
function CampaignLeadsTable({ campaignId }: { campaignId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["campaign-leads", campaignId],
    queryFn: () => fetch(`${BACKEND_URL}/api/campaigns/${campaignId}/leads`).then((res) => res.json()),
  });

  if (isLoading) return <div className="p-8 text-on-surface flex justify-center"><Icon name="refresh" className="animate-spin text-2xl text-primary" /></div>;

  const leads = data?.leads || [];

  return (
    <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar">
      {leads.length === 0 ? (
        <p className="text-on-surface-variant text-center py-8">No leads in this campaign yet.</p>
      ) : (
        <table className="w-full text-left text-body-md border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/50 text-on-surface-variant text-label-md uppercase tracking-wider">
              <th className="py-3 px-2 font-semibold">Name</th>
              <th className="py-3 px-2 font-semibold">Email</th>
              <th className="py-3 px-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l: any) => (
              <tr key={l.id} className="border-b border-outline-variant/20 hover:bg-surface-container-high transition-colors">
                <td className="py-3 px-2">
                  <div className="font-bold text-on-surface">{l.name}</div>
                  <div className="text-body-sm text-on-surface-variant">{l.title}</div>
                </td>
                <td className="py-3 px-2 text-on-surface-variant">{l.email}</td>
                <td className="py-3 px-2">
                  <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-label-sm font-bold uppercase tracking-wider">
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
