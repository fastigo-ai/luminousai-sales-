import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "AI Inbox | OmniSales AI" },
      { name: "description", content: "Smart inbox with AI suggested replies." },
    ],
  }),
  component: InboxPage,
});

const MOCK_INBOX = [
  {
    id: 1,
    sender: "John Smith",
    company: "ABC Logistics",
    email: "john@abclogistics.com",
    subject: "Re: OmniSales AI for your team",
    time: "10:32 AM",
    unread: true,
    score: 92,
    status: "Interested",
    painPoints: ["Manual CRM workflows", "High operational costs"],
    history: [
      { sender: "You", text: "Hi John,\n\nI noticed ABC Logistics is still using spreadsheets for CRM workflows. We automate this completely.", time: "Yesterday, 2:00 PM" },
      { sender: "John Smith", text: "Can we discuss pricing? We might be interested but budget is tight right now.", time: "Today, 10:32 AM" }
    ]
  },
  {
    id: 2,
    sender: "Sarah Jenkins",
    company: "DEF Retail",
    email: "sarah@defretail.com",
    subject: "Re: Meeting next week?",
    time: "Yesterday",
    unread: false,
    score: 65,
    status: "Email Sent",
    painPoints: ["Low email open rates", "Data silos"],
    history: [
      { sender: "Sarah Jenkins", text: "I am out of office until Monday. Please follow up then.", time: "Yesterday, 4:15 PM" }
    ]
  }
];

function InboxPage() {
  const [selectedId, setSelectedId] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [aiReply, setAiReply] = useState<string | null>(null);

  const selectedThread = MOCK_INBOX.find(m => m.id === selectedId);

  const handleGenerateReply = async () => {
    if (!selectedThread) return;
    
    setGenerating(true);
    try {
      const lastMessage = selectedThread.history[selectedThread.history.length - 1].text;
      const res = await fetch("https://aisalesagent-cxre.onrender.com/api/poc/inbox/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_context: lastMessage })
      });
      const data = await res.json();
      setAiReply(data.reply);
    } catch (e) {
      toast.error("Failed to generate AI reply.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-140px)] gap-6">
        
        {/* Left Pane: Inbox List */}
        <div className="w-1/4 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h2 className="text-headline-sm font-bold text-primary flex items-center gap-2">
              <Icon name="inbox" /> AI Inbox
            </h2>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <Icon name="filter_list" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {MOCK_INBOX.map((msg) => (
              <button 
                key={msg.id}
                onClick={() => { setSelectedId(msg.id); setAiReply(null); }}
                className={`w-full text-left p-4 border-b border-outline-variant transition-colors hover:bg-surface-container-low flex gap-3 ${selectedId === msg.id ? 'bg-primary-container/20 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold flex-shrink-0">
                  {msg.sender.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-label-md truncate ${msg.unread ? 'font-bold text-primary' : 'font-semibold text-on-surface-variant'}`}>
                      {msg.sender}
                    </span>
                    <span className={`text-[10px] ${msg.unread ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{msg.time}</span>
                  </div>
                  <p className="text-label-sm text-primary font-semibold truncate">{msg.subject}</p>
                  <p className="text-body-sm text-on-surface-variant truncate mt-1">{msg.history[msg.history.length - 1].text}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane: Thread & AI Reply */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden">
          {selectedThread ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                <div>
                  <h3 className="text-headline-sm font-bold text-primary">{selectedThread.sender}</h3>
                  <p className="text-label-md text-on-surface-variant">{selectedThread.company} • {selectedThread.email}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors" title="Mark done">
                    <Icon name="check_circle" />
                  </button>
                  <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors" title="Snooze">
                    <Icon name="schedule" />
                  </button>
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <h4 className="text-title-md font-bold text-primary border-b border-outline-variant pb-2 mb-4">{selectedThread.subject}</h4>
                
                {selectedThread.history.map((msg, idx) => {
                  const isYou = msg.sender === "You";
                  return (
                    <div key={idx} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-label-sm font-bold text-on-surface-variant">{msg.sender}</span>
                        <span className="text-[10px] text-on-surface-variant/70">{msg.time}</span>
                      </div>
                      <div className={`p-4 rounded-2xl max-w-[80%] whitespace-pre-wrap ${isYou ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container rounded-tl-none border border-outline-variant text-on-surface'}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Reply Section */}
              <div className="p-4 bg-surface-container border-t border-outline-variant">
                {aiReply ? (
                  <div className="bg-white border-2 border-primary/30 rounded-xl p-4 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
                    <div className="absolute -top-3 left-4 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Icon name="auto_awesome" style={{fontSize: 12}} /> AI Suggested Reply
                    </div>
                    <textarea 
                      className="w-full bg-transparent text-body-md text-on-surface focus:outline-none resize-none min-h-[100px] mt-2"
                      value={aiReply}
                      onChange={(e) => setAiReply(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-outline-variant">
                      <button 
                        onClick={handleGenerateReply}
                        className="text-secondary text-label-md font-bold hover:bg-secondary/10 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Icon name="refresh" /> Regenerate
                      </button>
                      <div className="flex gap-2">
                        <button 
                          className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg text-label-md font-bold hover:opacity-90 transition-opacity"
                          onClick={() => setAiReply(null)}
                        >
                          Discard
                        </button>
                        <button 
                          className="bg-primary text-white px-6 py-2 rounded-lg text-label-md font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                          onClick={() => {
                            toast.success("Email sent!");
                            setAiReply(null);
                          }}
                        >
                          <Icon name="send" /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                      <Icon name="psychology" className="text-secondary" /> 
                      OmniSales AI has analyzed this thread.
                    </p>
                    <button 
                      onClick={handleGenerateReply}
                      disabled={generating}
                      className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg text-label-md font-bold flex items-center gap-2 hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
                    >
                      {generating ? (
                         <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                         <><Icon name="auto_awesome" /> Draft Reply</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-8 text-center">
              <Icon name="inbox" className="text-[64px] mb-4 opacity-20" />
              <h3 className="text-title-lg font-bold text-primary mb-2">No Thread Selected</h3>
              <p className="text-body-md max-w-sm">Select a message from the left to view the thread and generate AI replies.</p>
            </div>
          )}
        </div>

        {/* Context Pane: CRM Data */}
        {selectedThread && (
          <div className="w-1/4 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
              <div className="w-12 h-12 rounded-full bg-primary-container text-primary font-bold text-lg flex items-center justify-center">
                {selectedThread.sender.charAt(0)}
              </div>
              <div>
                <h3 className="text-title-md font-bold text-on-surface">{selectedThread.sender}</h3>
                <p className="text-body-sm text-on-surface-variant">{selectedThread.company}</p>
              </div>
            </div>

            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Pipeline Stage</span>
              <div className="text-body-lg text-on-surface mt-1">{selectedThread.status}</div>
            </div>

            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Fit Score</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${selectedThread.score}%` }} />
                </div>
                <span className="text-label-md font-bold text-primary">{selectedThread.score}</span>
              </div>
            </div>

            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold mb-2 block">Pain Points</span>
              <ul className="space-y-2">
                {selectedThread.painPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-body-sm text-on-surface">
                    <Icon name="priority_high" className="text-error" style={{ fontSize: 16 }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-outline-variant flex flex-col gap-2">
              <button className="w-full bg-primary text-on-primary font-bold py-2 rounded-lg text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Icon name="call" style={{ fontSize: 18 }} />
                Call Now
              </button>
              <button className="w-full border-2 border-primary text-primary font-bold py-2 rounded-lg text-label-md flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
                <Icon name="local_fire_department" style={{ fontSize: 18 }} />
                Mark as Hot Lead
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
