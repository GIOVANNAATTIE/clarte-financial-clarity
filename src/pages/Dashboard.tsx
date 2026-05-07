import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, CalendarDays, Check, SlidersHorizontal, AlertCircle, Clock } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";

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

const monthLabels: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

const years = ["2024", "2025", "2026"];

const currentDate = new Date();
const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type RawTx = { date: string; value: number; status: string };

const Dashboard = () => {
  const { selectedClient } = useClient();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"months" | "custom">("months");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [transactions, setTransactions] = useState<RawTx[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let q = supabase.from("transactions").select("date, value, status").eq("user_id", user.id);
      if (selectedClient?.id) q = q.eq("company_id", selectedClient.id);
      const { data } = await q;
      if (data) setTransactions(data);
    };
    fetchData();
  }, [selectedClient?.id]);

  // Filter out cancelled transactions
  const activeTx = useMemo(() => transactions.filter(t => t.status !== "cancelado"), [transactions]);

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

  // Filter transactions based on selected filters
  const filteredTx = useMemo(() => {
    if (filterMode === "custom" && customDateFrom && customDateTo) {
      const fromStr = format(customDateFrom, "yyyy-MM-dd");
      const toStr = format(customDateTo, "yyyy-MM-dd");
      return activeTx.filter(t => t.date >= fromStr && t.date <= toStr);
    }
    // Filter by year
    let filtered = activeTx.filter(t => t.date.startsWith(selectedYear));
    // Filter by months if specific months selected
    if (selectedMonths.length > 0 && selectedMonths.length < 12) {
      filtered = filtered.filter(t => {
        const m = t.date.substring(5, 7);
        return selectedMonths.includes(m);
      });
    }
    return filtered;
  }, [activeTx, filterMode, selectedYear, selectedMonths, customDateFrom, customDateTo]);

  // Build chart data grouped by month
  const cashFlowData = useMemo(() => {
    const byMonth: Record<string, { entradas: number; saidas: number }> = {};
    filteredTx.forEach(t => {
      const monthKey = t.date.substring(5, 7);
      if (!byMonth[monthKey]) byMonth[monthKey] = { entradas: 0, saidas: 0 };
      if (t.value >= 0) byMonth[monthKey].entradas += t.value;
      else byMonth[monthKey].saidas += Math.abs(t.value);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        mes: monthLabels[key] || key,
        monthKey: key,
        ...val,
      }));
  }, [filteredTx]);

  const totalEntradas = filteredTx.filter(t => t.value >= 0).reduce((s, t) => s + t.value, 0);
  const totalSaidas = filteredTx.filter(t => t.value < 0).reduce((s, t) => s + Math.abs(t.value), 0);
  const saldo = totalEntradas - totalSaidas;

  // Overdue calculations from real data
  const today = format(new Date(), "yyyy-MM-dd");
  const overdueRecebiveis = activeTx.filter(t => t.value > 0 && t.status === "pendente" && t.date < today);
  const overduePagaveis = activeTx.filter(t => t.value < 0 && t.status === "pendente" && t.date < today);
  const totalOverdueRecebiveis = overdueRecebiveis.reduce((s, t) => s + t.value, 0);
  const totalOverduePagaveis = overduePagaveis.reduce((s, t) => s + Math.abs(t.value), 0);

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
        />
        <KpiCard
          icon={<TrendingDown size={20} />}
          label="Total Saídas"
          value={formatCurrency(totalSaidas)}
        />
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Saldo do Período"
          value={formatCurrency(saldo)}
          highlight={saldo >= 0}
        />
      </div>

      {/* Contas em Atraso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="text-destructive" size={18} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-foreground text-sm">Contas a Receber em Atraso</h2>
              <p className="text-xs text-muted-foreground">Títulos vencidos não recebidos</p>
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-destructive mb-3">{formatCurrency(totalOverdueRecebiveis)}</p>
          {overdueRecebiveis.length === 0 && <p className="text-sm text-muted-foreground">Nenhum título em atraso</p>}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertCircle className="text-amber-500" size={18} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-foreground text-sm">Contas a Pagar em Atraso</h2>
              <p className="text-xs text-muted-foreground">Títulos vencidos não pagos</p>
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-amber-500 mb-3">{formatCurrency(totalOverduePagaveis)}</p>
          {overduePagaveis.length === 0 && <p className="text-sm text-muted-foreground">Nenhum título em atraso</p>}
        </div>
      </div>

      {/* Fluxo de Caixa */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="text-primary" size={18} />
          <h2 className="font-heading font-semibold text-foreground">Fluxo de Caixa</h2>
        </div>
        <div className="h-72">
          {cashFlowData.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhum dado para o período selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function KpiCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/5">{icon}</div>
      </div>
      <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default Dashboard;
