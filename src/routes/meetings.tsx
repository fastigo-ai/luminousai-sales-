import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/layout/Icon";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import * as Dialog from '@radix-ui/react-dialog';
import { AppShell } from "@/components/layout/AppShell";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/meetings")({
  component: MeetingsComponent,
});

const BACKEND_URL = "https://aisalesagent-cxre.onrender.com";

function MeetingsComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["meetings-upcoming"],
    queryFn: () => fetch(`${BACKEND_URL}/api/meetings/upcoming`).then((res) => res.json()),
  });

  if (isLoading) {
    return <div className="p-8 text-on-surface flex justify-center"><Icon name="refresh" className="animate-spin text-3xl text-primary" /></div>;
  }

  const meetings = data?.meetings || [];

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
            <Icon name="calendar_month" /> Upcoming Meetings
          </h1>
          <p className="text-on-surface-variant text-body-lg mt-1">
            Your AI-booked calls and discovery sessions.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <Icon name="add" /> Schedule Manual
        </button>
      </div>

      {/* Meetings Timeline */}
      <div className="relative pl-8 border-l border-outline-variant/30 ml-4 space-y-8">
        {meetings.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-on-surface-variant text-center rounded-xl border-dashed">
            <Icon name="event_busy" className="text-6xl mb-4 opacity-50" />
            <h3 className="text-headline-sm font-bold text-on-surface">No upcoming meetings</h3>
            <p className="mt-2 text-body-md max-w-sm">The AI will automatically schedule meetings here when hot leads convert.</p>
          </div>
        ) : (
          meetings.map((mtg: any) => {
            const meetingDate = parseISO(mtg.meeting_time);
            return (
              <div key={mtg.id} className="relative">
                {/* Timeline Dot */}
                <div className={`absolute -left-[41px] top-4 w-5 h-5 rounded-full border-4 border-surface ${mtg.is_hot_lead ? 'bg-error animate-pulse' : 'bg-primary'}`}></div>
                
                <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-colors group">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-headline-sm font-bold text-on-surface">{mtg.company_name}</h3>
                        {mtg.is_hot_lead && (
                          <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-label-sm font-bold uppercase tracking-wider flex items-center gap-1">
                            <Icon name="local_fire_department" style={{ fontSize: 14 }} /> Hot Deal
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-on-surface-variant mb-4">
                        <Icon name="person" style={{ fontSize: 16 }} />
                        <span className="font-medium text-body-md">{mtg.lead_name}</span>
                        <span className="opacity-50">•</span>
                        <span className="text-body-sm">{mtg.title}</span>
                      </div>
                      
                      <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50">
                        <h4 className="text-label-md text-primary font-bold uppercase tracking-wider mb-2">Agenda / Prep</h4>
                        <p className="text-body-md text-on-surface-variant">{mtg.meeting_agenda}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      <div className="text-right">
                        <div className="text-headline-md font-bold text-secondary-fixed">
                          {format(meetingDate, "h:mm a")}
                        </div>
                        <div className="text-body-sm text-on-surface-variant uppercase tracking-wide font-semibold mt-1">
                          {format(meetingDate, "EEEE, MMMM do")}
                        </div>
                      </div>
                      
                      <a href={mtg.meeting_link} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex justify-center items-center gap-2 bg-secondary-fixed text-on-secondary-fixed px-4 py-2 rounded-lg font-bold hover:bg-secondary-fixed/90 transition-colors">
                        <Icon name="videocam" /> Join Call
                      </a>
                      
                      <Dialog.Root>
                        <Dialog.Trigger asChild>
                          <button className="w-full flex justify-center items-center gap-2 border border-outline text-on-surface px-4 py-2 rounded-lg font-bold hover:bg-surface-container transition-colors">
                            <Icon name="psychology" /> AI Prep Notes
                          </button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-outline bg-surface-container shadow-2xl p-6 sm:rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                            <div className="flex justify-between items-center mb-2">
                              <Dialog.Title className="text-headline-sm font-bold text-primary flex items-center gap-2">
                                <Icon name="psychology" /> AI Preparation Brief
                              </Dialog.Title>
                              <Dialog.Close className="text-on-surface-variant hover:text-on-surface transition-colors">
                                <Icon name="close" />
                              </Dialog.Close>
                            </div>
                            
                            <div className="space-y-4">
                               <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50">
                                 <h4 className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-2">Meeting Objective</h4>
                                 <p className="text-body-md text-on-surface">{mtg.meeting_agenda}</p>
                               </div>
                               
                               <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                                 <h4 className="text-label-md text-primary font-bold uppercase tracking-wider mb-2">Suggested Talking Points</h4>
                                 <ul className="list-disc pl-5 text-body-md text-on-surface space-y-1">
                                    <li>Ask {mtg.lead_name} about their current manual workflow overhead.</li>
                                    <li>Highlight our API's 99.9% uptime.</li>
                                    <li>Mention {mtg.company_name}'s recent round of funding.</li>
                                 </ul>
                               </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                               <Dialog.Close asChild>
                                  <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                                    Got it
                                  </button>
                               </Dialog.Close>
                            </div>
                          </Dialog.Content>
                        </Dialog.Portal>
                      </Dialog.Root>
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
