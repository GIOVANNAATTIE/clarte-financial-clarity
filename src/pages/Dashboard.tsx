import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

const cashFlowData = [
  { mes: "Jan", entradas: 48500, saidas: 32200 },
  { mes: "Fev", entradas: 52300, saidas: 35800 },
  { mes: "Mar", entradas: 49100, saidas: 41200 },
  { mes: "Abr", entradas: 61200, saidas: 38900 },
  { mes: "Mai", entradas: 55800, saidas: 42100 },
  { mes: "Jun", entradas: 67400, saidas: 39700 },
];

const dreData = [
  { label: "Receita Bruta", value: 334300, type: "income" as const },
  { label: "(-) Deduções", value: -18200, type: "expense" as const },
  { label: "Receita Líquida", value: 316100, type: "income" as const },
  { label: "(-) CMV", value: -128400, type: "expense" as const },
  { label: "Lucro Bruto", value: 187700, type: "income" as const },
  { label: "(-) Despesas Operacionais", value: -95800, type: "expense" as const },
  { label: "Resultado Operacional", value: 91900, type: "income" as const },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Dashboard = () => {
  const totalEntradas = cashFlowData.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = cashFlowData.reduce((s, d) => s + d.saidas, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral das suas finanças</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Total Entradas"
          value={formatCurrency(totalEntradas)}
          trend="+12.5%"
          trendUp
        />
        <KpiCard
          icon={<TrendingDown size={20} />}
          label="Total Saídas"
          value={formatCurrency(totalSaidas)}
          trend="+8.2%"
          trendUp={false}
        />
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Saldo do Período"
          value={formatCurrency(saldo)}
          trend="+18.3%"
          trendUp
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="text-primary" size={18} />
            <h2 className="font-heading font-semibold text-foreground">Fluxo de Caixa</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="gradientIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 65%, 55%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(0, 65%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(0, 0%, 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(0, 0%, 45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(0, 0%, 90%)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke="hsl(152, 60%, 40%)" fill="url(#gradientIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="saidas" name="Saídas" stroke="hsl(0, 65%, 55%)" fill="url(#gradientExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DRE Summary */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-5">
            <FileIcon className="text-primary" size={18} />
            <h2 className="font-heading font-semibold text-foreground">DRE Simplificado</h2>
          </div>
          <div className="space-y-3">
            {dreData.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-2 ${
                  i < dreData.length - 1 ? "border-b border-border/50" : ""
                } ${item.label.includes("Resultado") || item.label.includes("Lucro") ? "font-semibold" : ""}`}
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <span
                  className={`text-sm font-mono ${
                    item.type === "income" ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatCurrency(Math.abs(item.value))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function KpiCard({ icon, label, value, trend, trendUp }: { icon: React.ReactNode; label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/5">{icon}</div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {trend}
        </span>
      </div>
      <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function FileIcon(props: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 18v-4" />
      <path d="M14 18v-2" />
    </svg>
  );
}

export default Dashboard;
