import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Voice Settings | OmniSales AI" },
      { name: "description", content: "Link your WhatsApp, Google Calendar, and SMTP mail configuration for Voice-to-Action." },
    ],
  }),
  component: SettingsPage,
});

type LogItem = {
  time: string;
  type: "whatsapp" | "email" | "calendar" | "system";
  message: string;
};

const BACKEND_URL = "https://aisalesagent-cxre.onrender.com";

function SettingsPage() {
  // Connection states
  const [backendOffline, setBackendOffline] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pollActive, setPollActive] = useState(false);

  // SMTP Configuration States
  const [smtpHost, setSmtpHost] = useState("smtp.titan.email");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<string | null>(null);

  // Calendar States
  const [calConnected, setCalConnected] = useState(false);

  // Command logs state
  const [logs, setLogs] = useState<LogItem[]>([]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch integration status on component mount
  const checkStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/status`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBackendOffline(false);
      setWaConnected(data.whatsapp.connected);
      setCalConnected(data.google_calendar.authorized);
      if (data.smtp.configured && data.smtp.username) {
        setSmtpUser(data.smtp.username);
      }
    } catch (e) {
      setBackendOffline(true);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Poll for WhatsApp connection status once QR code is rendered
  useEffect(() => {
    let interval: any;
    if (pollActive && !waConnected) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/settings/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.whatsapp && data.whatsapp.connected) {
              setWaConnected(true);
              setPollActive(false);
              setQrCode(null);
              setLogs((prev) => [
                { time: new Date().toLocaleTimeString().slice(0, 5), type: "whatsapp", message: `WhatsApp session paired (${data.whatsapp.phone})` },
                ...prev
              ]);
            }
          }
        } catch (e) {
          // Keep polling silently despite minor network dropouts
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pollActive, waConnected]);

  const handleLinkWhatsApp = async () => {
    setWaLoading(true);
    setQrCode(null);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/whatsapp/connect`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.status === "already_connected") {
        setWaConnected(true);
      } else {
        setQrCode(data.qr_code_base64);
        setPollActive(true);
      }
    } catch (err) {
      // Fallback mockup QR so settings dashboard is testable offline
      setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=OmniSalesVoiceSyncConnection");
      setPollActive(true);
    } finally {
      setWaLoading(false);
    }
  };

  const handleSimulateSync = () => {
    // Allows testing connection status changes locally
    setWaConnected(true);
    setQrCode(null);
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString().slice(0, 5), type: "whatsapp", message: "WhatsApp session paired (+91 98765 43210)" },
      ...prev
    ]);
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpStatus(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/smtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: parseInt(smtpPort),
          user: smtpUser,
          password: smtpPass
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Handshake failed.");
      
      setSmtpStatus("Credentials saved and verified!");
      setLogs((prev) => [
        { time: new Date().toLocaleTimeString().slice(0, 5), type: "email", message: "SMTP configuration updated and verified." },
        ...prev
      ]);
    } catch (err: any) {
      setSmtpStatus(`Error: ${err.message}`);
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleGoogleAuthRedirect = () => {
    window.open(`${BACKEND_URL}/api/calendar/auth`, "_blank");
    // Optimistic refresh
    setTimeout(() => checkStatus(), 5000);
  };

  return (
    <AppShell searchPlaceholder="Search system settings...">
      <div className="space-y-6">
        {backendOffline && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3 border border-error/20 animate-pulse">
            <Icon name="error" className="text-error" />
            <div>
              <h4 className="font-bold text-sm">Voice Backend Offline</h4>
              <p className="text-[11px] opacity-90">Cannot establish handshake with FastAPI on {BACKEND_URL}. Ensure uvicorn is running.</p>
            </div>
            <button onClick={checkStatus} className="ml-auto bg-error text-white font-bold text-xs px-3 py-1.5 rounded-lg">
              Retry Connection
            </button>
          </div>
        )}

        <div>
          <h2 className="text-headline-md font-bold text-primary">Voice-to-Action Integrations</h2>
          <p className="text-body-md text-on-surface-variant">Link your communication channels and calendars to enable automated AI voice commands.</p>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: WhatsApp Linked Device */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-whatsapp flex items-center justify-center text-white">
                  <Icon name="chat" filled />
                </span>
                <h3 className="text-title-md font-bold text-on-surface">WhatsApp Session Sync</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Link your personal or corporate WhatsApp account via a QR Code (Linked Devices). No Meta API credentials required.
              </p>
            </div>

            {waConnected ? (
              <div className="bg-success-container/10 border border-success/30 p-4 rounded-xl flex items-center gap-3">
                <Icon name="check_circle" className="text-whatsapp" style={{ fontSize: 28 }} />
                <div>
                  <h4 className="font-bold text-whatsapp">Linked & Running</h4>
                  <p className="text-body-sm text-on-surface-variant">Session Active: +91 98765 43210</p>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col items-center justify-center min-h-[220px]">
                {waLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-body-sm text-on-surface-variant font-medium">Generating WebSocket QR...</span>
                  </div>
                ) : qrCode ? (
                  <div className="flex flex-col items-center space-y-3">
                    <img src={qrCode} alt="WhatsApp Pairing QR" className="border border-outline p-2 bg-white rounded-lg shadow-sm w-44 h-44" />
                    <span className="text-body-sm text-on-surface-variant text-center">
                      Scan this QR code with WhatsApp Web on your phone.
                    </span>
                    <button 
                      onClick={handleSimulateSync}
                      className="text-primary font-bold text-label-md hover:underline"
                    >
                      (Simulate Scan Confirmation)
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <Icon name="qr_code_scanner" style={{ fontSize: 48 }} className="text-on-surface-variant opacity-60" />
                    <p className="text-body-sm text-on-surface-variant">No device paired. Set up your WebSocket receiver daemon to begin.</p>
                    <button 
                      onClick={handleLinkWhatsApp}
                      disabled={backendOffline}
                      className={`bg-whatsapp text-white hover:opacity-90 transition-all font-bold px-6 py-2.5 rounded-lg text-body-sm shadow-md ${backendOffline ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Retrieve Link QR Code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: SMTP Mail Settings */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <Icon name="mail" />
              </span>
              <h3 className="text-title-md font-bold text-on-surface">SMTP Email Gateway</h3>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Configure SMTP credentials for dispatching professional AI drafts via **Titan Mail** or **Gmail App Passwords**.
            </p>

            <form onSubmit={handleSaveSmtp} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-label-md font-semibold text-on-surface-variant">SMTP Server Host</label>
                  <input 
                    type="text" 
                    value={smtpHost} 
                    onChange={(e) => setSmtpHost(e.target.value)} 
                    className="w-full mt-1 border border-outline bg-surface rounded-lg px-3 py-2 text-body-md" 
                    required
                  />
                </div>
                <div>
                  <label className="text-label-md font-semibold text-on-surface-variant">Port</label>
                  <input 
                    type="text" 
                    value={smtpPort} 
                    onChange={(e) => setSmtpPort(e.target.value)} 
                    className="w-full mt-1 border border-outline bg-surface rounded-lg px-3 py-2 text-body-md" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-label-md font-semibold text-on-surface-variant">SMTP Username / Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. rohan@omnisales.ai"
                  value={smtpUser} 
                  onChange={(e) => setSmtpUser(e.target.value)} 
                  className="w-full mt-1 border border-outline bg-surface rounded-lg px-3 py-2 text-body-md" 
                  required
                />
              </div>

              <div>
                <label className="text-label-md font-semibold text-on-surface-variant">SMTP App Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••••••"
                  value={smtpPass} 
                  onChange={(e) => setSmtpPass(e.target.value)} 
                  className="w-full mt-1 border border-outline bg-surface rounded-lg px-3 py-2 text-body-md" 
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {smtpStatus && (
                  <span className={`text-body-sm font-medium flex items-center gap-1 ${smtpStatus.startsWith("Error") ? "text-error" : "text-green-600"}`}>
                    <Icon name={smtpStatus.startsWith("Error") ? "warning" : "check"} style={{ fontSize: 16 }} />
                    {smtpStatus}
                  </span>
                )}
                <button 
                  type="submit" 
                  disabled={smtpSaving || backendOffline}
                  className={`ml-auto bg-primary text-white font-bold px-6 py-2.5 rounded-lg text-body-sm hover:opacity-90 transition-all flex items-center gap-2 ${(smtpSaving || backendOffline) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {smtpSaving ? "Verifying..." : "Verify & Save"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Section 2: Google Calendar Integration & Log Visualizer */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Box */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-white">
                  <Icon name="calendar_today" />
                </span>
                <h3 className="text-title-md font-bold text-on-surface">Google Calendar Link</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Enables AI scheduling of Google Meet events. Automatically sends invites and alerts to host and participants.
              </p>
            </div>

            {calConnected ? (
              <div className="bg-success-container/10 border border-success/30 p-4 rounded-xl flex items-center gap-3">
                <Icon name="check_circle" className="text-secondary" style={{ fontSize: 28 }} />
                <div>
                  <h4 className="font-bold text-secondary">Authorized</h4>
                  <p className="text-body-sm text-on-surface-variant">Ready to schedule events.</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleGoogleAuthRedirect}
                disabled={backendOffline}
                className={`w-full bg-secondary-container text-on-secondary-fixed py-2.5 rounded-lg text-body-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${backendOffline ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Icon name="sync" />
                Authorize Google Calendar
              </button>
            )}
          </div>

          {/* Activity Logs Console */}
          <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="receipt_long" className="text-on-surface" />
                <h3 className="text-title-md font-bold text-on-surface">Voice Command Execution Log</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container px-2 py-1 rounded">Live Console</span>
            </div>

            <div className="bg-primary text-primary-fixed-dim p-4 rounded-xl font-mono text-[11px] space-y-2 flex-1 max-h-[160px] overflow-y-auto custom-scrollbar">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed">
                  <span className="text-on-primary-container">[{log.time}]</span>
                  <span className="text-secondary-fixed">[{log.type.toUpperCase()}]</span>
                  <span className="text-white">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: AI Personality */}
        <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Icon name="psychology" />
            </span>
            <div>
              <h3 className="text-title-md font-bold text-on-surface">Global AI Instructions (Personality)</h3>
              <p className="text-body-sm text-on-surface-variant">These rules apply to all AI emails, replies, and voice calls.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {["Professional", "Friendly", "Never discuss pricing", "Push for meetings", "Keep emails short"].map((trait) => (
              <label key={trait} className="flex items-center gap-3 p-3 bg-surface border border-outline-variant rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary rounded border-outline" />
                <span className="text-body-md font-semibold text-on-surface">{trait}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
             <button className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg text-body-sm hover:opacity-90 transition-all flex items-center gap-2">
               Save AI Settings
             </button>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
