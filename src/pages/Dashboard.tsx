import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, CalendarDays, Check, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const months = [
  { value: "all", label: "Todos os meses" },
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const years = ["2024", "2025", "2026"];

const currentDate = new Date();
const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

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
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"months" | "custom">("months");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  const toggleMonth = (value: string) => {
    setSelectedMonths((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  };

  const selectAllMonths = () => {
    if (selectedMonths.length === 12) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(months.filter((m) => m.value !== "all").map((m) => m.value));
    }
  };

  const getMonthsLabel = () => {
    if (selectedMonths.length === 0) return "Todos os meses";
    if (selectedMonths.length === 12) return "Todos os meses";
    if (selectedMonths.length <= 2) {
      return selectedMonths
        .map((v) => months.find((m) => m.value === v)?.label)
        .join(", ");
    }
    return `${selectedMonths.length} meses`;
  };

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const totalEntradas = cashFlowData.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = cashFlowData.reduce((s, d) => s + d.saidas, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Modo de filtro */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setFilterMode("months")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterMode === "months" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Meses
            </button>
            <button
              onClick={() => setFilterMode("custom")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterMode === "custom" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Personalizado
            </button>
          </div>

          {filterMode === "months" ? (
            <>
              {/* Ano */}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Multi-select meses */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm min-w-[140px] justify-start font-normal">
                    <CalendarDays size={14} className="mr-2 shrink-0" />
                    {getMonthsLabel()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedMonths.length === 12}
                        onCheckedChange={selectAllMonths}
                      />
                      <span className="text-sm font-medium">Todos os meses</span>
                    </label>
                    <div className="border-t border-border my-1.5" />
                    {months.filter((m) => m.value !== "all").map((m) => (
                      <label key={m.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={selectedMonths.includes(m.value)}
                          onCheckedChange={() => toggleMonth(m.value)}
                        />
                        <span className="text-sm">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm min-w-[130px] justify-start font-normal">
                    <CalendarDays size={14} className="mr-2" />
                    {customDateFrom ? formatShortDate(customDateFrom) : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateFrom}
                    onSelect={setCustomDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm min-w-[130px] justify-start font-normal">
                    <CalendarDays size={14} className="mr-2" />
                    {customDateTo ? formatShortDate(customDateTo) : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateTo}
                    onSelect={setCustomDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <CalendarDays size={14} />
            <span>{formattedDate}</span>
          </div>
        </div>
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
              <BarChart data={cashFlowData}>
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
                <Bar dataKey="entradas" name="Entradas" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 65%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
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
