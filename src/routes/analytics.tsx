import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/layout/Icon";
import { useQuery } from "@tanstack/react-query";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { AppShell } from "@/components/layout/AppShell";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsComponent,
});

const BACKEND_URL = "http://localhost:8000";

function AnalyticsComponent() {
  const { data: funnelData, isLoading: isLoadingFunnel } = useQuery({
    queryKey: ["analytics-funnel"],
    queryFn: () => fetch(`${BACKEND_URL}/api/analytics/funnel`).then((res) => res.json()),
    refetchInterval: 5000 // Poll every 5 seconds for near real-time updates
  });

  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["analytics-metrics"],
    queryFn: () => fetch(`${BACKEND_URL}/api/analytics/metrics`).then((res) => res.json()),
    refetchInterval: 5000
  });

  const { data: trendData } = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: () => fetch(`${BACKEND_URL}/api/analytics/trend`).then((res) => res.json()),
    refetchInterval: 5000
  });

  if (isLoadingFunnel || isLoadingMetrics) {
    return <div className="p-8 text-on-surface flex justify-center"><Icon name="refresh" className="animate-spin text-3xl text-primary" /></div>;
  }

  const funnel = funnelData?.funnel || [];
  const metrics = metricsData || { pipeline_value: 0, total_companies: 0, active_deals: 0, open_rate: 0 };

  // Colors for the funnel stages
  const COLORS = ['#625b71', '#4a4458', '#938f99', '#28a745'];

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
            <Icon name="analytics" /> Real-Time Analytics
            <span className="flex items-center gap-2 px-2 py-1 bg-secondary-fixed/20 text-secondary-fixed text-label-md rounded-full">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
              Live Sync Active
            </span>
          </h1>
          <p className="text-on-surface-variant text-body-lg mt-1">
            Live pipeline value and conversion funnel metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/50 transition-colors">
          <h3 className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Icon name="attach_money" style={{ fontSize: 18 }} /> Pipeline Value
          </h3>
          <p className="text-display-md font-bold text-primary">
            ${metrics.pipeline_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/50 transition-colors">
          <h3 className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Icon name="domain" style={{ fontSize: 18 }} /> Total Companies
          </h3>
          <p className="text-display-md font-bold text-on-surface">{metrics.total_companies}</p>
        </div>
        
        <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/50 transition-colors">
          <h3 className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Icon name="whatshot" style={{ fontSize: 18 }} /> Active Deals
          </h3>
          <p className="text-display-md font-bold text-secondary-fixed">{metrics.active_deals}</p>
        </div>
        
        <div className="glass-card p-6 rounded-xl border border-outline-variant hover:border-primary/50 transition-colors">
          <h3 className="text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Icon name="mark_email_read" style={{ fontSize: 18 }} /> Avg Open Rate
          </h3>
          <p className="text-display-md font-bold text-on-surface">{metrics.open_rate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="glass-card p-6 rounded-xl border border-outline-variant">
          <h3 className="text-headline-sm font-bold text-primary mb-6 flex items-center gap-2">
            <Icon name="filter_alt" /> Conversion Funnel
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnel}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="stage" type="category" stroke="#888" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1b26', border: '1px solid #4a4458', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" barSize={40} radius={[0, 4, 4, 0]}>
                  {funnel.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Trend (Mocked Time Series for visual demo) */}
        <div className="glass-card p-6 rounded-xl border border-outline-variant">
          <h3 className="text-headline-sm font-bold text-primary mb-6 flex items-center gap-2">
            <Icon name="trending_up" /> Pipeline Growth Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData?.trend || [
                  { name: 'Mon', value: 0 },
                  { name: 'Tue', value: 0 },
                  { name: 'Wed', value: 0 },
                  { name: 'Thu', value: 0 },
                  { name: 'Fri', value: 0 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28a745" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e1b26', border: '1px solid #4a4458', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#28a745" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
