import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/layout/Icon";

export function GodModeStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch((import.meta.env.VITE_BACKEND_URL || "https://aisalesagent-cxre.onrender.com") + "/api/dashboard/stats").then(res => res.json()),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <div className="animate-pulse bg-surface-container-low h-32 rounded-xl"></div>;
  }

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatBox label="New Leads" value={stats?.new_leads || 0} icon="person_search" color="text-primary" />
      <StatBox label="Qualified" value={stats?.qualified || 0} icon="how_to_reg" color="text-secondary" />
      <StatBox label="Emails Sent" value={stats?.emails_sent || 0} icon="mail" color="text-on-tertiary-container" />
      <StatBox label="Open Rate" value={`${stats?.open_rate || 0}%`} icon="drafts" color="text-primary" />
      
      <StatBox label="Replies" value={stats?.replies || 0} icon="reply" color="text-secondary" />
      <StatBox label="AI Calls" value={stats?.ai_calls || 0} icon="record_voice_over" color="text-error" />
      <StatBox label="Meetings Booked" value={stats?.meetings_booked || 0} icon="event_available" color="text-on-tertiary-container" />
      <StatBox label="Pipeline Value" value={formatCurrency(stats?.potential_rev || 0)} icon="attach_money" color="text-primary" />
    </div>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between items-start transition-all hover:border-primary/50 hover:shadow-sm">
      <div className="flex justify-between w-full items-start mb-2">
        <p className="text-on-surface-variant text-label-md font-semibold">{label}</p>
        <Icon name={icon} className={color} />
      </div>
      <h3 className="text-display-sm font-bold text-primary">{value}</h3>
    </div>
  );
}
