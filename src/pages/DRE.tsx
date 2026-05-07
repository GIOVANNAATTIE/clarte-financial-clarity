import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Settings2, Info, GripVertical, Pin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const formatPercent = (v: number) => `${v.toFixed(2)}%`;

type TaxRegime = "simples" | "presumido" | "real";
type TaxRates = { pis: number; cofins: number; iss: number };
const defaultTaxRates: Record<TaxRegime, TaxRates> = {
  simples: { pis: 0.0, cofins: 0.0, iss: 2.0 },
  presumido: { pis: 0.65, cofins: 3.0, iss: 5.0 },
  real: { pis: 1.65, cofins: 7.6, iss: 5.0 },
};
const regimeLabels: Record<TaxRegime, string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
};

const months = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" }, { value: "04", label: "Abril" },
  { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];
const years = ["2024", "2025", "2026"];

type FilterMode = "mes" | "ano" | "periodo";

type DRESection = {
  id: string;
  label: string;
  type: "receita" | "deducao" | "custo" | "despesa" | "resultado";
};

const DEFAULT_SECTIONS: DRESection[] = [
  { id: "receita_bruta", label: "(+) Receita Bruta / Faturamento", type: "receita" },
  { id: "deducoes", label: "(−) Deduções / Impostos sobre Receita", type: "deducao" },
  { id: "receita_liquida", label: "= Receita Líquida", type: "resultado" },
  { id: "custos", label: "(−) Custos dos Serviços / Produtos", type: "custo" },
  { id: "lucro_bruto", label: "= Lucro Bruto", type: "resultado" },
  { id: "despesas", label: "(−) Despesas Operacionais", type: "despesa" },
  { id: "lucro_liquido", label: "= Lucro Líquido", type: "resultado" },
];

const STORAGE_KEY = "dre_sections_order";

type RawTx = {
  date: string; value: number; status: string;
  category_id: string | null; category_name?: string; category_type?: string;
};

const DRE = () => {
  const { selectedClient } = useClient();
  const { toast } = useToast();
  const [filterMode, setFilterMode] = useState<FilterMode>("mes");
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [regime, setRegime] = useState<TaxRegime>("presumido");
  const [taxRates, setTaxRates] = useState<Record<TaxRegime, TaxRates>>(defaultTaxRates);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [editingRates, setEditingRates] = useState<TaxRates>({ pis: 0, cofins: 0, iss: 0 });
  const [transactions, setTransactions] = useState<RawTx[]>([]);
  const [sections, setSections] = useState<DRESection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SECTIONS;
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [txRes, catRes] = await Promise.all([
        (() => { let q = supabase.from("transactions").select("date, value, status, category_id").eq("user_id", user.id); if (selectedClient?.id) q = q.eq("company_id", selectedClient.id); return q; })(),
        supabase.from("categories").select("id, name, type").eq("user_id", user.id),
      ]);
      const catMap = new Map<string, { name: string; type: string }>();
      catRes.data?.forEach(c => catMap.set(c.id, { name: c.name, type: c.type }));
      if (txRes.data) {
        setTransactions(txRes.data.map(t => ({
          ...t,
          category_name: t.category_id ? catMap.get(t.category_id)?.name || "" : "",
          category_type: t.category_id ? catMap.get(t.category_id)?.type || "" : "",
        })));
      }
    };
    fetchData();
  }, [selectedClient?.id]);

  const filteredTx = useMemo(() => {
    const active = transactions.filter(t => t.status !== "cancelado");
    if (filterMode === "mes") return active.filter(t => t.date.startsWith(`${selectedYear}-${selectedMonth}`));
    if (filterMode === "ano") return active.filter(t => t.date.startsWith(selectedYear));
    if (filterMode === "periodo" && dateFrom && dateTo) {
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      const toStr = format(dateTo, "yyyy-MM-dd");
      return active.filter(t => t.date >= fromStr && t.date <= toStr);
    }
    return [];
  }, [transactions, filterMode, selectedMonth, selectedYear, dateFrom, dateTo]);

  const { receitas, custos, despesas } = useMemo(() => {
    const recMap: Record<string, number> = {};
    const custoMap: Record<string, number> = {};
    const despMap: Record<string, number> = {};
    filteredTx.forEach(t => {
      const label = t.category_name || (t.value >= 0 ? "Receitas sem categoria" : "Despesas sem categoria");
      if (t.value >= 0) recMap[label] = (recMap[label] || 0) + t.value;
      else {
        const catType = t.category_type || "despesa";
        if (catType === "custo") custoMap[label] = (custoMap[label] || 0) + Math.abs(t.value);
        else despMap[label] = (despMap[label] || 0) + Math.abs(t.value);
      }
    });
    return {
      receitas: Object.entries(recMap).map(([label, valor]) => ({ label, valor })),
      custos: Object.entries(custoMap).map(([label, valor]) => ({ label, valor })),
      despesas: Object.entries(despMap).map(([label, valor]) => ({ label, valor })),
    };
  }, [filteredTx]);

  const currentRates = taxRates[regime];
  const faturamentoBruto = receitas.reduce((s, e) => s + e.valor, 0);
  const pisValor = faturamentoBruto * (currentRates.pis / 100);
  const cofinsValor = faturamentoBruto * (currentRates.cofins / 100);
  const issValor = faturamentoBruto * (currentRates.iss / 100);
  const totalDeducoes = pisValor + cofinsValor + issValor;
  const receitaLiquida = faturamentoBruto - totalDeducoes;
  const totalCustos = custos.reduce((s, e) => s + e.valor, 0);
  const lucroBruto = receitaLiquida - totalCustos;
  const totalDespesas = despesas.reduce((s, e) => s + e.valor, 0);
  const lucroLiquido = lucroBruto - totalDespesas;
  const margemBruta = faturamentoBruto > 0 ? (lucroBruto / faturamentoBruto) * 100 : 0;
  const margemLiquida = faturamentoBruto > 0 ? (lucroLiquido / faturamentoBruto) * 100 : 0;

  // Monthly breakdown for annual view
  const monthlyBreakdown = useMemo(() => {
    if (filterMode !== "ano") return null;
    const active = transactions.filter(t => t.status !== "cancelado" && t.date.startsWith(selectedYear));
    const byMonth: Record<string, { receitas: number; despesas: number }> = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${selectedYear}-${String(m).padStart(2, "0")}`;
      byMonth[key] = { receitas: 0, despesas: 0 };
    }
    active.forEach(t => {
      const key = t.date.substring(0, 7);
      if (!byMonth[key]) byMonth[key] = { receitas: 0, despesas: 0 };
      if (t.value >= 0) byMonth[key].receitas += t.value;
      else byMonth[key].despesas += Math.abs(t.value);
    });
    return byMonth;
  }, [transactions, filterMode, selectedYear]);

  // Drag and drop handlers
  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setDragOverIndex(null); return; }
    const newSections = [...sections];
    const [moved] = newSections.splice(dragIndex, 1);
    newSections.splice(idx, 0, moved);
    setSections(newSections);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const fixarPadrao = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    toast({ title: "Ordem fixada como padrão!" });
  };

  const resetarOrdem = () => {
    setSections(DEFAULT_SECTIONS);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "Ordem resetada" });
  };

  const filterLabel = useMemo(() => {
    if (filterMode === "mes") {
      const m = months.find(m => m.value === selectedMonth);
      return `${m?.label || ""} ${selectedYear}`;
    }
    if (filterMode === "ano") return `Ano ${selectedYear}`;
    if (filterMode === "periodo" && dateFrom && dateTo)
      return `${format(dateFrom, "dd/MM/yy")} a ${format(dateTo, "dd/MM/yy")}`;
    return "Selecione o período";
  }, [filterMode, selectedMonth, selectedYear, dateFrom, dateTo]);

  const renderSection = (section: DRESection, idx: number) => {
    const isDragging = dragIndex === idx;
    const isDragOver = dragOverIndex === idx;

    if (section.type === "resultado") {
      const valueMap: Record<string, number> = {
        receita_liquida: receitaLiquida,
        lucro_bruto: lucroBruto,
        lucro_liquido: lucroLiquido,
      };
      const tooltipMap: Record<string, string> = {
        receita_liquida: "Faturamento Bruto menos impostos sobre receita",
        lucro_bruto: "Receita Líquida menos custos diretos",
        lucro_liquido: "Resultado final após todas as deduções",
      };
      const value = valueMap[section.id] ?? 0;
      return (
        <tr
          key={section.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={e => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          className={cn(
            "border-t-2 border-gold/30 bg-gold/5 cursor-grab active:cursor-grabbing",
            isDragging && "opacity-40",
            isDragOver && "bg-gold/15"
          )}
        >
          <td className="px-2 py-4 w-6 text-muted-foreground/40"><GripVertical size={14} /></td>
          <td className="px-5 py-4 text-sm font-bold text-foreground">
            <span className="inline-flex items-center gap-1.5">
              {section.label}
              {tooltipMap[section.id] && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild><Info size={13} className="text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs">{tooltipMap[section.id]}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
          </td>
          <td className={cn("px-5 py-4 text-center font-mono text-base font-bold", value >= 0 ? "text-success" : "text-destructive")}>
            {formatCurrency(value)}
          </td>
          <td className="px-5 py-4 text-center text-sm text-muted-foreground">
            {faturamentoBruto > 0 ? formatPercent((value / faturamentoBruto) * 100) : "—"}
          </td>
        </tr>
      );
    }

    const itemsMap: Record<string, { label: string; valor: number }[]> = {
      receita_bruta: receitas,
      deducoes: [
        { label: `PIS (${formatPercent(currentRates.pis)})`, valor: pisValor },
        { label: `COFINS (${formatPercent(currentRates.cofins)})`, valor: cofinsValor },
        { label: `ISS (${formatPercent(currentRates.iss)})`, valor: issValor },
      ],
      custos,
      despesas,
    };
    const items = itemsMap[section.id] || [];
    const isNegative = section.type !== "receita";

    return (
      <>
        <tr
          key={section.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={e => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          className={cn(
            "bg-muted/10 cursor-grab active:cursor-grabbing",
            isDragging && "opacity-40",
            isDragOver && "bg-primary/10"
          )}
        >
          <td className="px-2 py-2.5 w-6 text-muted-foreground/40"><GripVertical size={14} /></td>
          <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
            {section.label}
            {section.id === "deducoes" && (
              <span className="ml-2 text-[10px] font-normal text-muted-foreground">({regimeLabels[regime]})</span>
            )}
          </td>
        </tr>
        {items.map(item => (
          <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
            <td className="px-2"></td>
            <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
            <td className={cn("px-5 py-3 text-sm font-mono text-center", isNegative ? "text-destructive" : "text-success")}>
              {formatCurrency(isNegative ? -item.valor : item.valor)}
            </td>
            <td className="px-5 py-3 text-sm text-center text-muted-foreground">
              {faturamentoBruto > 0 ? formatPercent((item.valor / faturamentoBruto) * 100) : "—"}
            </td>
          </tr>
        ))}
        {items.length === 0 && section.type !== "deducao" && (
          <tr className="border-b border-border/30">
            <td></td>
            <td colSpan={3} className="px-5 py-3 text-sm text-muted-foreground pl-10 italic">Nenhum item categorizado</td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">DRE - Demonstrativo de Resultado</h1>
          <p className="text-sm text-muted-foreground mt-1">{filterLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={resetarOrdem}>Resetar Ordem</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={fixarPadrao}>
            <Pin size={14} /> Fixar Padrão
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => { setEditingRates({ ...taxRates[regime] }); setTaxDialogOpen(true); }}>
            <Settings2 size={16} /> Alíquotas
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
                <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {filterMode === "mes" && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {filterMode === "periodo" && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-44 justify-start text-left font-normal h-10", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon size={14} className="mr-2" />{dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-44 justify-start text-left font-normal h-10", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon size={14} className="mr-2" />{dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Faturamento Bruto", value: faturamentoBruto, color: "text-foreground" },
          { label: "Receita Líquida", value: receitaLiquida, color: receitaLiquida >= 0 ? "text-success" : "text-destructive" },
          { label: "Margem Bruta", value: margemBruta, isPercent: true, color: margemBruta >= 0 ? "text-success" : "text-destructive" },
          { label: "Lucro Líquido", value: lucroLiquido, color: lucroLiquido >= 0 ? "text-success" : "text-destructive" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
            <p className={cn("text-xl font-bold font-mono mt-1", kpi.color)}>
              {kpi.isPercent ? formatPercent(kpi.value) : formatCurrency(kpi.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Annual Monthly View — shown when filterMode === "ano" */}
      {filterMode === "ano" && monthlyBreakdown && (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/10 text-xs font-semibold text-foreground">
            Visão Mensal — {selectedYear}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider w-32">Indicador</th>
                  {months.map(m => (
                    <th key={m.value} className="text-center px-2 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider min-w-[80px]">
                      {m.label.substring(0, 3)}
                    </th>
                  ))}
                  <th className="text-center px-3 py-2.5 font-semibold text-foreground uppercase tracking-wider bg-muted/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Receitas", key: "receitas" as const, color: "text-success" },
                  { label: "Despesas", key: "despesas" as const, color: "text-destructive" },
                ].map(row => {
                  const total = Object.values(monthlyBreakdown).reduce((s, m) => s + m[row.key], 0);
                  return (
                    <tr key={row.key} className="border-b border-border/50 hover:bg-muted/20">
                      <td className={`px-4 py-2.5 font-semibold ${row.color}`}>{row.label}</td>
                      {months.map(m => {
                        const key = `${selectedYear}-${m.value}`;
                        const val = monthlyBreakdown[key]?.[row.key] || 0;
                        return (
                          <td key={m.value} className={`px-2 py-2.5 text-center font-mono ${val > 0 ? row.color : "text-muted-foreground/40"}`}>
                            {val > 0 ? formatCurrency(val).replace("R$\u00a0", "") : "—"}
                          </td>
                        );
                      })}
                      <td className={`px-3 py-2.5 text-center font-mono font-bold bg-muted/50 ${row.color}`}>
                        {formatCurrency(total).replace("R$\u00a0", "")}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/20 font-bold">
                  <td className="px-4 py-2.5 text-foreground font-bold">Saldo</td>
                  {months.map(m => {
                    const key = `${selectedYear}-${m.value}`;
                    const saldo = (monthlyBreakdown[key]?.receitas || 0) - (monthlyBreakdown[key]?.despesas || 0);
                    return (
                      <td key={m.value} className={`px-2 py-2.5 text-center font-mono font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                        {saldo !== 0 ? formatCurrency(saldo).replace("R$\u00a0", "") : "—"}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-2.5 text-center font-mono font-bold bg-muted/50 ${faturamentoBruto - despesas.reduce((s,e)=>s+e.valor,0) - custos.reduce((s,e)=>s+e.valor,0) >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(faturamentoBruto - despesas.reduce((s,e)=>s+e.valor,0) - custos.reduce((s,e)=>s+e.valor,0)).replace("R$\u00a0", "")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRE Table — drag and drop */}
      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/10 text-xs text-muted-foreground">
          💡 Arraste as seções para reorganizar a DRE. Clique em "Fixar Padrão" para salvar a ordem.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-8"></th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-left">Descrição</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Valor</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">% Receita</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, idx) => renderSection(section, idx))}
              <tr className="border-t border-border bg-muted/20">
                <td></td>
                <td className="px-5 py-3 text-sm font-semibold text-foreground">Margem Líquida</td>
                <td className={cn("px-5 py-3 text-sm font-mono text-center font-bold", margemLiquida >= 0 ? "text-success" : "text-destructive")}>
                  {formatPercent(margemLiquida)}
                </td>
                <td className="px-5 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Dialog */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alíquotas — {regimeLabels[regime]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Regime Fiscal</Label>
              <Select value={regime} onValueChange={v => { setRegime(v as TaxRegime); setEditingRates({ ...taxRates[v as TaxRegime] }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PIS (%)</Label>
              <Input type="number" step="0.01" value={editingRates.pis} onChange={e => setEditingRates({ ...editingRates, pis: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>COFINS (%)</Label>
              <Input type="number" step="0.01" value={editingRates.cofins} onChange={e => setEditingRates({ ...editingRates, cofins: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>ISS (%)</Label>
              <Input type="number" step="0.01" value={editingRates.iss} onChange={e => setEditingRates({ ...editingRates, iss: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => { setTaxRates(prev => ({ ...prev, [regime]: editingRates })); setTaxDialogOpen(false); }}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DRE;
