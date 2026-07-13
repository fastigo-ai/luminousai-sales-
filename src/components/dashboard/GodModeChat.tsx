import { useState, ReactNode } from "react";
import { Icon } from "@/components/layout/Icon";
import { toast } from "sonner";
import { useLeadDrawer } from "@/contexts/LeadDrawerContext";

export function GodModeChat() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'system', content: string }[]>([
    { role: 'system', content: 'God Mode initialized. Awaiting commands.' }
  ]);
  const { openDrawer } = useLeadDrawer();

  const renderMessageContent = (content: string): ReactNode => {
    const actionRegex = /\[ACTION:\s*([^|]+)\s*\|\s*([^\]]+)\]/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
      }

      const actionName = match[1].trim();
      const targetName = match[2].trim();

      parts.push(
        <button
          key={`action-${match.index}`}
          onClick={() => {
             toast.success(`Action Triggered: ${actionName} -> ${targetName}`);
             openDrawer({ id: targetName, name: targetName, company: 'Fetched via CRM', score: 95, status: 'Hot Lead' });
          }}
          className="inline-flex items-center gap-1 bg-secondary text-on-secondary px-3 py-1 rounded-md text-xs font-bold hover:opacity-90 transition-opacity mx-1 my-1 shadow-sm"
        >
          <Icon name={actionName.toLowerCase().includes('call') ? 'call' : 'bolt'} style={{fontSize: 14}} />
          {actionName} - {targetName}
        </button>
      );

      lastIndex = actionRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? <>{parts}</> : content;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = prompt;
    setHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch((import.meta.env.VITE_BACKEND_URL || "https://aisalesagent-cxre.onrender.com") + "/api/god-mode/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      
      setHistory(prev => [...prev, { role: 'system', content: data.reply }]);
      toast.success("Command processed");
    } catch (error) {
      toast.error("Failed to execute command.");
      setHistory(prev => [...prev, { role: 'system', content: 'Error: Connection to God Mode server failed.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-[500px] lg:h-full overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-primary-container text-on-primary-container">
        <h4 className="text-headline-sm font-bold flex items-center gap-2">
          <Icon name="terminal" /> God Mode Chat
        </h4>
        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-surface space-y-4">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-body-md whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-surface-container-low text-primary border border-outline-variant rounded-bl-none font-mono text-sm'
            }`}>
              {msg.role === 'system' ? renderMessageContent(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-3 bg-surface-container-low text-primary border border-outline-variant rounded-bl-none">
              <span className="animate-pulse">Processing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-outline-variant bg-surface-container-lowest">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Auto reply to ABC Logistics..." 
            className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg pl-4 pr-10 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
          <button 
            type="submit" 
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-surface-variant rounded-md transition-colors disabled:opacity-50"
          >
            <Icon name="send" />
          </button>
        </form>
        <p className="text-[10px] text-center text-on-surface-variant mt-2">
          Single-prompt command line. Press Enter to execute.
        </p>
      </div>
    </div>
  );
}
