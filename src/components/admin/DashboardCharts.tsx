"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0a2342", "#c9a227", "#2f6fed", "#16a34a", "#dc2626", "#7c3aed", "#0f766e", "#ea580c"];

export interface DashboardChartData {
  bookingsByStatus: { name: string; value: number }[];
  bookingsTrend: { day: string; bookings: number; value: number }[];
  ticketsByAirline: { name: string; tickets: number; seats: number }[];
  topRoutes: { name: string; tickets: number; seats: number }[];
  contentInventory: { name: string; count: number }[];
  agentsByStatus: { name: string; value: number }[];
  holdHealth: { name: string; value: number }[];
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-navy">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="h-64 w-full">{children}</div>
    </section>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No {label} data yet
    </div>
  );
}

export function DashboardCharts({ data }: { data: DashboardChartData }) {
  const hasStatus = data.bookingsByStatus.some((d) => d.value > 0);
  const hasTrend = data.bookingsTrend.some((d) => d.bookings > 0);
  const hasAirlines = data.ticketsByAirline.length > 0;
  const hasRoutes = data.topRoutes.length > 0;
  const hasContent = data.contentInventory.some((d) => d.count > 0);
  const hasAgents = data.agentsByStatus.some((d) => d.value > 0);
  const hasHolds = data.holdHealth.some((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-navy">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Live overview of bookings, inventory, agents, and content.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Bookings by status" subtitle="All-time booking pipeline">
          {hasStatus ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.bookingsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.bookingsByStatus.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value), "Bookings"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="booking" />
          )}
        </ChartCard>

        <ChartCard title="Hold health" subtitle="Pending-payment supplier holds">
          {hasHolds ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.holdHealth}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.holdHealth.map((_, index) => (
                    <Cell key={index} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value), "Holds"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="hold" />
          )}
        </ChartCard>

        <ChartCard title="Bookings (last 14 days)" subtitle="Count and quoted value (PKR)">
          {hasTrend ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.bookingsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "value" ? `PKR ${Number(value).toLocaleString("en-PK")}` : Number(value),
                    name === "value" ? "Quoted value" : "Bookings",
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#0a2342"
                  fill="#0a2342"
                  fillOpacity={0.15}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  name="Quoted value"
                  stroke="#c9a227"
                  fill="#c9a227"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="trend" />
          )}
        </ChartCard>

        <ChartCard title="Agents by approval" subtitle="Customer / sub-agent profiles">
          {hasAgents ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.agentsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Agents" radius={[6, 6, 0, 0]}>
                  {data.agentsByStatus.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="agent" />
          )}
        </ChartCard>

        <ChartCard title="Live tickets by airline" subtitle="Active inventory with seats">
          {hasAirlines ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ticketsByAirline} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" name="Flights" fill="#0a2342" radius={[0, 6, 6, 0]} />
                <Bar dataKey="seats" name="Seats" fill="#c9a227" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="airline" />
          )}
        </ChartCard>

        <ChartCard title="Top routes" subtitle="Live group inventory by sector">
          {hasRoutes ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topRoutes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" name="Flights" fill="#2f6fed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="seats" name="Seats" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="route" />
          )}
        </ChartCard>

        <ChartCard title="Content inventory" subtitle="Site content managed in admin">
          {hasContent ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.contentInventory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Items" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="content" />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
