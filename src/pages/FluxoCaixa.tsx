import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, List, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";

const months = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" }, { value: "04", label: "Abril" },
  { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];
const years = ["2024", "2025", "2026"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type FilterMode = "mes" | "ano" | "periodo";
type ViewMode = "resumo" | "lista";

type Transaction = {
  date: string;
  value: number;
  description: string | null;
  status: string;
};

const FluxoCaixa = () => {
  const { selectedClient } = useClient();
  const [filterMode, setFilterMode] = useState<FilterMode>("ano");
  const [viewMode, setViewMode] = useState<ViewMode>("resumo");
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("transactions")
        .select("date, value, description, status")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      if (selectedClient?.id) {
        const { data: filteredData } = await supabase.from("transactions")
          .select("date, value, description, status")
          .eq("user_id", user.id)
          .eq("company_id", selectedClient.id)
          .order("date", { ascending: false });
        if (filteredData) { setTransactions(filteredData); return; }
      }
      if (data) setTransactions(data);
    };
    fetchData();
  }, []);

  const filteredTx = useMemo(() => {
    let filtered = transactions;
    if (filterMode === "mes") {
      filtered = transactions.filter(t => t.date.startsWith(`${selectedYear}-${selectedMonth}`));
    } else if (filterMode === "ano") {
      filtered = transactions.filter(t => t.date.startsWith(selectedYear));
    } else if (filterMode === "periodo" && dateFrom && dateTo) {
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      const toStr = format(dateTo, "yyyy-MM-dd");
      filtered = transactions.filter(t => t.date >= fromStr && t.date <= toStr);
    }
    return filtered;
  }, [transactions, filterMode, selectedMonth, selectedYear, dateFrom, dateTo]);

  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { entradas: number; saidas: number }> = {};
    filteredTx.forEach(t => {
      const monthKey = t.date.substring(0, 7);
      if (!byMonth[monthKey]) byMonth[monthKey] = { entradas: 0, saidas: 0 };
      if (t.value >= 0) byMonth[monthKey].entradas += t.value;
      else byMonth[monthKey].saidas += Math.abs(t.value);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [y, m] = key.split("-");
        const monthLabel = months.find(mo => mo.value === m)?.label || m;
        return { mes: `${monthLabel} ${y}`, ...val };
      });
  }, [filteredTx]);

  const totalEntradas = filteredTx.filter(t => t.value >= 0).reduce((s, t) => s + t.value, 0);
  const totalSaidas = filteredTx.filter(t => t.value < 0).reduce((s, t) => s + Math.abs(t.value), 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "resumo" ? "default" : "outline"}
            size="sm" className="gap-2"
            onClick={() => setViewMode("resumo")}
          >
            <BarChart2 size={15} /> Resumo
          </Button>
          <Button
            variant={viewMode === "lista" ? "default" : "outline"}
            size="sm" className="gap-2"
            onClick={() => setViewMode("lista")}
          >
            <List size={15} /> Lista
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4">
          <Tabs value={filterMode} onValueChange={v => setFilterMode(v as FilterMode)}>
            <TabsList>
              <TabsTrigger value="mes">Mês</TabsTrigger>
              <TabsTrigger value="ano">Ano</TabsTrigger>
              <TabsTrigger value="periodo">Período</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col sm:flex-row gap-3">
            {(filterMode === "mes" || filterMode === "ano") && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-32 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {filterMode === "mes" && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {filterMode === "periodo" && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-44 justify-start text-left font-normal h-10", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon size={14} className="mr-2" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-44 justify-start text-left font-normal h-10", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon size={14} className="mr-2" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10"><TrendingUp size={18} className="text-success" /></div>
            <span className="text-sm text-muted-foreground">Total Entradas</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-destructive/10"><TrendingDown size={18} className="text-destructive" /></div>
            <span className="text-sm text-muted-foreground">Total Saídas</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gold/10"><DollarSign size={18} className="text-gold" /></div>
            <span className="text-sm text-muted-foreground">Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(saldo)}</p>
        </div>
      </div>

      {/* View: Resumo por mês */}
      {viewMode === "resumo" && (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Período</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Entradas</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Saídas</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map(d => (
                  <tr key={d.mes} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-foreground text-center">{d.mes}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-success text-center">{formatCurrency(d.entradas)}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-destructive text-center">{formatCurrency(d.saidas)}</td>
                    <td className={`px-5 py-3.5 text-sm font-mono font-medium text-center ${d.entradas - d.saidas >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(d.entradas - d.saidas)}
                    </td>
                  </tr>
                ))}
                {monthlyData.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum dado para o período selecionado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: Lista detalhada */}
      {viewMode === "lista" && (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Data</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-left">Descrição</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Tipo</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Valor</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((t, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors relative"
                    onMouseEnter={() => setHoveredId(idx)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <td className="px-5 py-3.5 text-sm text-foreground text-center whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground max-w-xs">
                      <div className="relative">
                        <span className="truncate block">{t.description || "—"}</span>
                        {hoveredId === idx && t.description && (
                          <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg px-3 py-2 text-xs text-foreground shadow-lg whitespace-normal min-w-[200px] max-w-[350px]">
                            {t.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${t.value >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {t.value >= 0 ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-mono font-medium text-center ${t.value >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(Math.abs(t.value))}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTx.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum lançamento para o período selecionado</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {filteredTx.length} lançamentos
          </div>
        </div>
      )}
    </div>
  );
};

export default FluxoCaixa;
