import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/layout/Icon";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/workspaces")({
  component: WorkspacesPage,
});

const BACKEND_URL = "https://aisalesagent-cxre.onrender.com";

function WorkspacesPage() {
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  const { data: pipelineData } = useQuery({
    queryKey: ["workspace-pipeline"],
    queryFn: () => fetch(`${BACKEND_URL}/api/workspace/pipeline`).then((res) => res.json()),
  });

  const { data: hotLeadsData } = useQuery({
    queryKey: ["workspace-hot-leads"],
    queryFn: () => fetch(`${BACKEND_URL}/api/workspace/hot-leads`).then((res) => res.json()),
  });

  const { data: configData } = useQuery({
    queryKey: ["workspace-config"],
    queryFn: () => fetch(`${BACKEND_URL}/api/workspace/config`).then((res) => res.json()),
  });

  const { data: logsData } = useQuery({
    queryKey: ["workspace-logs"],
    queryFn: () => fetch(`${BACKEND_URL}/api/workspace/logs`).then((res) => res.json()),
    refetchInterval: 5000,
  });

  const queryClient = useQueryClient();
  const { data: autopilotStatus } = useQuery({
    queryKey: ["autopilot-status"],
    queryFn: () => fetch(`${BACKEND_URL}/api/god-mode/autopilot`).then(res => res.json()),
  });

  const toggleAutopilot = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch(`${BACKEND_URL}/api/god-mode/autopilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["autopilot-status"], data);
      if (data.enabled) {
        toast.success("Autopilot Engaged: AI is now handling replies autonomously");
      } else {
        toast.info("Autopilot Disengaged: AI returned to manual Copilot mode");
      }
    }
  });

  const isAutopilotEnabled = autopilotStatus?.enabled || false;

  const handleSaveConfig = () => {
    setIsConfigSaving(true);
    setTimeout(() => {
      toast.success("AI Configuration saved successfully!");
      setIsConfigSaving(false);
    }, 1000);
  };

  return (
    <AppShell>
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-label-md font-semibold text-secondary uppercase tracking-widest mb-1">
              Workspace Engine
            </p>
            <h1 className="text-display-lg font-bold text-primary">Sales Workflows</h1>
          </div>
        </div>
      </section>

      {/* Kanban Pipeline */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="view_kanban" className="text-secondary" />
          <h2 className="text-headline-md font-bold text-primary">Active Pipeline</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {pipelineData?.stages?.map((stage: any) => (
            <div key={stage.id} className="min-w-[300px] w-[300px] flex-shrink-0 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col h-[400px]">
              <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest rounded-t-xl">
                <h3 className="text-label-lg font-bold text-primary">{stage.title}</h3>
                <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-label-sm font-bold">
                  {stage.count}
                </span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {stage.leads.map((lead: any) => (
                  <div key={lead.id} className="bg-white border border-outline-variant rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-label-md font-bold text-primary">{lead.person}</p>
                      <Icon name="more_horiz" className="text-on-surface-variant" style={{ fontSize: 16 }} />
                    </div>
                    <p className="text-body-sm text-on-surface-variant mb-2">{lead.company}</p>
                    <div className="flex justify-between items-center text-label-sm">
                      <span className="text-secondary font-semibold">${lead.value.toLocaleString()}</span>
                      <div className="flex gap-1">
                        <span className="w-5 h-5 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-[10px]">AI</span>
                      </div>
                    </div>
                  </div>
                ))}
                {stage.leads.length === 0 && (
                  <div className="text-center p-4 text-on-surface-variant text-body-sm border-2 border-dashed border-outline-variant rounded-lg">
                    No active leads in this stage.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid for Table and Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hot Leads Table */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <Icon name="local_fire_department" className="text-error" />
              <h4 className="text-headline-sm font-semibold text-primary">Hot Leads (Requires Intervention)</h4>
            </div>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant">Lead</th>
                  <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant">AI Reason</th>
                  <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant text-right">Value</th>
                  <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {hotLeadsData?.hot_leads?.map((d: any) => (
                  <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-primary text-label-md">{d.person}</div>
                      <div className="text-body-sm text-on-surface-variant">{d.company}</div>
                    </td>
                    <td className="px-5 py-4 text-body-sm text-on-surface-variant max-w-[200px] truncate" title={d.reason}>{d.reason}</td>
                    <td className="px-5 py-4 text-right text-data-numeric text-primary font-medium">${d.value.toLocaleString()}</td>
                    <td className="px-5 py-4 text-center">
                      <button className="bg-error text-white px-3 py-1.5 rounded-lg text-label-sm font-bold hover:opacity-90">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Configuration */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-[500px]">
          <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <Icon name="smart_toy" className="text-secondary" />
              <h4 className="text-headline-sm font-semibold text-primary">AI Auto-Reply Rules</h4>
            </div>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
            <p className="text-body-md text-on-surface-variant">
              Configure the global instructions for the email and voice AI supervisor.
            </p>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant">
              <div>
                <p className="font-bold text-primary">Enable Autonomous Replies</p>
                <p className="text-body-sm text-on-surface-variant">Let the AI reply to emails without human review.</p>
              </div>
              <button 
                 onClick={() => toggleAutopilot.mutate(!isAutopilotEnabled)}
                 className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isAutopilotEnabled ? 'bg-primary' : 'bg-surface-variant'}`}
               >
                 <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${isAutopilotEnabled ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'}`}></span>
               </button>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-label-md font-bold text-primary mb-2">Global System Prompt</label>
              <textarea
                className="flex-1 w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-body-md text-on-surface resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                defaultValue={configData?.global_prompt}
              />
            </div>
          </div>
          <div className="px-5 py-4 border-t border-outline-variant bg-surface-container-lowest">
            <button 
              onClick={handleSaveConfig}
              disabled={isConfigSaving}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-label-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isConfigSaving ? "Saving..." : "Save AI Configuration"}
            </button>
          </div>
        </section>
      </div>

      {/* Developer Log / Debugger */}
      <section className="bg-[#1e1e1e] border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[300px]">
        <div className="px-5 py-3 border-b border-[#333] flex justify-between items-center bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <Icon name="terminal" className="text-[#4af626]" style={{ fontSize: 18 }} />
            <h4 className="text-label-lg font-bold text-white">Workflow Debugger</h4>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-[13px] leading-relaxed">
          {logsData?.logs?.map((log: any, i: number) => (
            <div key={i} className="flex gap-4 mb-2 hover:bg-[#333] p-1 rounded">
              <span className="text-[#888] shrink-0">[{log.timestamp.split('T')[1].replace('Z','')}]</span>
              <span className={`shrink-0 w-[45px] ${log.level === 'WARN' ? 'text-[#ffbd2e]' : 'text-[#27c93f]'}`}>
                {log.level}
              </span>
              <span className="text-[#56b6c2] shrink-0 w-[120px]">{log.service}</span>
              <span className="text-[#d4d4d4] flex-1">{log.message}</span>
            </div>
          ))}
          {!logsData?.logs && <div className="text-[#888]">Waiting for logs...</div>}
        </div>
      </section>

    </AppShell>
  );
}
