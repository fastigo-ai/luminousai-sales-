import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant | OmniSales AI" },
      { name: "description", content: "Context-aware AI assistant for Indian sales — drafts follow-ups, summarizes meetings, flags pipeline risk." },
    ],
  }),
  component: AssistantPage,
});

type Message = {
  id: string;
  side: "ai" | "user";
  body: React.ReactNode;
  full?: boolean;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || "https://aisalesagent-cxre.onrender.com") + "";
const SENDER_ID = "web_user";

function AssistantPage() {
  const chatRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-0",
      side: "ai",
      body: (
        <>
          <p className="text-body-md mb-2">Good morning! I've analyzed your current sales pipeline.</p>
          <p className="text-body-md">
            You have a critical follow-up pending for the{" "}
            <span className="font-bold text-primary">HDFC Bank Expansion deal (₹45L)</span>. How can I help you today?
          </p>
        </>
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDraft, setActiveDraft] = useState<any>(null); // For pending confirmation

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const fetchProactiveMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/god-mode/proactive_messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success" && data.messages && data.messages.length > 0) {
            data.messages.forEach((msg: any) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: `proactive-${msg.id}`,
                  side: "ai",
                  body: <div className="text-body-md" dangerouslySetInnerHTML={{ __html: msg.message }} />,
                },
              ]);
              toast.success("New God Mode AI Alert!");
            });
          }
        }
      } catch (err) {
        console.error("Failed to poll proactive messages:", err);
      }
    };

    const intervalId = setInterval(fetchProactiveMessages, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    
    // Add user message to UI
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, side: "user", body: <p className="text-body-md">{userMsg}</p> }]);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: SENDER_ID, message: userMsg }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.status === "error") {
        setMessages((prev) => [
          ...prev, 
          { 
            id: `msg-${Date.now()}`, 
            side: "ai", 
            body: (
              <div className="bg-error-container/20 text-error p-3 rounded-lg border border-error/30 text-body-sm">
                <Icon name="error" className="mr-2 inline-block align-bottom" />
                {data.message || "Failed to process request."}
              </div>
            ) 
          }
        ]);
        return;
      }

      // Add AI response to UI
      const actionData = data.action;
      
      const renderDraftPreview = () => {
        if (!actionData || actionData.intent === "NONE" || actionData.intent === "GENERAL_CHAT") return null;
        
        let preview = null;
        if (actionData.intent === "SEND_EMAIL") {
          preview = (
            <div className="bg-surface-container-lowest p-3 mt-3 rounded-lg border border-outline-variant text-body-sm">
              <p><strong>To:</strong> {actionData.email_data?.recipient_name} ({actionData.email_data?.recipient_email})</p>
              <p><strong>Subject:</strong> {actionData.email_data?.subject}</p>
              <hr className="my-2 border-outline-variant" />
              <p className="whitespace-pre-wrap">{actionData.email_data?.body}</p>
            </div>
          );
        } else if (actionData.intent === "SCHEDULE_MEETING") {
          preview = (
            <div className="bg-surface-container-lowest p-3 mt-3 rounded-lg border border-outline-variant text-body-sm">
              <p><strong>Event:</strong> {actionData.meeting_data?.summary}</p>
              <p><strong>Start:</strong> {actionData.meeting_data?.start_time}</p>
              <p><strong>Attendees:</strong> {actionData.meeting_data?.attendee_emails.join(", ")}</p>
            </div>
          );
        }
        
        return (
          <div className="mt-3">
            {preview}
            <div className="mt-4 flex gap-2">
              <button onClick={() => handleConfirm(true)} className="bg-primary text-white text-body-sm px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:opacity-90">
                <Icon name="check" style={{fontSize: 16}} /> Confirm & Send
              </button>
              <button onClick={() => handleConfirm(false)} className="bg-surface-container-high text-on-surface text-body-sm px-4 py-2 rounded-lg font-bold hover:bg-surface-variant">
                Cancel
              </button>
            </div>
          </div>
        );
      };

      setMessages((prev) => [
        ...prev, 
        { 
          id: `msg-${Date.now()}`, 
          side: "ai", 
          full: true,
          body: (
            <>
              <p className="text-body-md whitespace-pre-wrap">{data.message}</p>
              {renderDraftPreview()}
            </>
          ) 
        }
      ]);
      
      if (actionData && actionData.intent !== "NONE" && actionData.intent !== "GENERAL_CHAT") {
        setActiveDraft(true); // lock chat input while confirming
      }

    } catch (err) {
      toast.error("Network error. Backend might be offline.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (isConfirm: boolean) => {
    setActiveDraft(false);
    setLoading(true);
    
    // Add fake user click msg
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, side: "user", body: <p className="text-body-md font-bold text-tertiary">{isConfirm ? "Confirmed Action" : "Cancelled Action"}</p> }]);

    try {
      const res = await fetch(`${BACKEND_URL}/api/whatsapp/button-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: SENDER_ID, action_id: "web_ui", confirm: isConfirm }),
      });
      const data = await res.json();
      
      if (data.status === "error") {
        setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, side: "ai", body: <div className="text-error font-bold flex items-center gap-2"><Icon name="error"/> {data.message}</div> }]);
      } else {
        setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, side: "ai", body: <p className="text-success font-bold flex items-center gap-2"><Icon name="check_circle"/> {data.details || (isConfirm ? "Action completed." : "Action cancelled.")}</p> }]);
      }
    } catch (e) {
      toast.error("Failed to execute action.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell searchPlaceholder="Search insights...">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chat */}
        <div className="lg:col-span-8 flex flex-col h-[768px] bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary-container rounded-full flex items-center justify-center text-primary">
                <Icon name="bolt" style={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="text-label-md font-semibold">Bharat AI Assistant</p>
                <p className="text-[10px] text-on-tertiary-container flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-on-tertiary-container rounded-full animate-pulse" />
                  Online | Context-Aware
                </p>
              </div>
            </div>
            <button className="text-on-surface-variant hover:text-primary p-2">
              <Icon name="history" />
            </button>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-6 chat-container">
            {messages.map((m) => (
              <Msg key={m.id} side={m.side} full={m.full} body={m.body} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-on-surface-variant animate-pulse ml-12">
                <Icon name="more_horiz" /> Processing...
              </div>
            )}
          </div>

          <div className="p-4 bg-surface-bright border-t border-outline-variant">
            <div className="bg-surface-container-lowest border border-outline rounded-xl p-2 focus-within:border-primary transition-all">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md resize-none py-2 px-3"
                placeholder={activeDraft ? "Please confirm or cancel the pending action..." : "Ask me about Tata Motors GST query or HDFC deal..."}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={activeDraft || loading}
              />
              <div className="flex justify-between items-center border-t border-outline-variant pt-2 mt-1">
                <div className="flex gap-2">
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg"><Icon name="attach_file" style={{ fontSize: 20 }} /></button>
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg"><Icon name="mic" style={{ fontSize: 20 }} /></button>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={activeDraft || loading || !input.trim()}
                  className="bg-secondary-container text-on-secondary-fixed rounded-lg px-6 py-2 font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  Send <Icon name="send" style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-fixed opacity-20 rounded-full -mr-12 -mt-12" />
            <div className="flex items-center justify-between mb-4 relative">
              <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Active High-Value Deal</h3>
              <Icon name="trending_up" className="text-secondary" />
            </div>
            <div className="space-y-1 mb-4 relative">
              <p className="text-headline-sm font-semibold text-primary">HDFC Bank</p>
              <p className="text-body-md text-on-surface-variant">Core Banking Expansion</p>
            </div>
            <div className="flex justify-between items-end relative">
              <div>
                <p className="text-body-sm text-on-surface-variant mb-1">Deal Value</p>
                <p className="text-data-numeric text-[20px] font-bold text-primary">₹45,00,000</p>
              </div>
              <div className="text-right">
                <p className="text-body-sm text-on-surface-variant mb-1">Probability</p>
                <p className="text-headline-sm font-semibold text-on-tertiary-container">82%</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Key Stakeholders</h3>
            <div className="space-y-4">
              <Stakeholder initials="AV" name="Amit Varma" role="VP Sales, HDFC" />
              <Stakeholder initials="NS" name="Neha Singh" role="Finance Head, Tata" />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Suggestive Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setInput("Draft a follow-up email to Rahul Kumar")}
                className="w-full text-left p-3 rounded-lg border border-outline-variant hover:border-secondary-container hover:bg-surface-container-low transition-all group"
              >
                <p className="text-body-sm group-hover:text-primary">"Draft a follow-up email to Rahul Kumar"</p>
              </button>
              <button 
                onClick={() => setInput("Schedule a meeting with Priya for tomorrow 3 PM")}
                className="w-full text-left p-3 rounded-lg border border-outline-variant hover:border-secondary-container hover:bg-surface-container-low transition-all group"
              >
                <p className="text-body-sm group-hover:text-primary">"Schedule a meeting with Priya for tomorrow 3 PM"</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Msg({ side, body, full = false }: { side: "ai" | "user"; body: React.ReactNode; full?: boolean }) {
  const isAi = side === "ai";
  return (
    <div className={`flex gap-3 ${full ? "max-w-[90%]" : "max-w-[85%]"} ${isAi ? "" : "ml-auto flex-row-reverse"}`}>
      <div className={`w-8 h-8 rounded-full ${isAi ? "bg-primary text-white" : "bg-secondary-container text-primary"} flex items-center justify-center shrink-0 mt-1`}>
        <Icon name={isAi ? "psychology" : "person"} style={{ fontSize: 18 }} />
      </div>
      <div
        className={
          isAi
            ? `bg-surface-container-low p-4 rounded-2xl rounded-tl-none ${full ? "w-full" : ""}`
            : "bg-primary text-white p-4 rounded-2xl rounded-tr-none"
        }
      >
        {body}
      </div>
    </div>
  );
}

function Stakeholder({ initials, name, role }: { initials: string; name: string; role: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center text-primary font-bold text-sm">
          {initials}
        </div>
        <div>
          <p className="text-label-md font-semibold">{name}</p>
          <p className="text-body-sm text-on-surface-variant">{role}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="p-2 bg-surface-container-high rounded-full hover:bg-tertiary-fixed transition-colors text-on-tertiary-container">
          <Icon name="chat" filled style={{ fontSize: 18 }} />
        </button>
        <button className="p-2 bg-surface-container-high rounded-full text-primary">
          <Icon name="mail" style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
}
