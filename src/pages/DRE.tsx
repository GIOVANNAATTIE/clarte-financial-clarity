import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Settings2, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

// Default tax rates by regime
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

type FilterMode = "mes" | "ano" | "periodo";

type RawTx = {
  date: string;
  value: number;
  status: string;
  category_id: string | null;
  category_name?: string;
  category_type?: string;
};

const DRE = () => {
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [txRes, catRes] = await Promise.all([
        supabase.from("transactions").select("date, value, status, category_id").eq("user_id", user.id),
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
  }, []);

  const currentRates = taxRates[regime];

  // Filter active (non-cancelled) transactions by period
  const filteredTx = useMemo(() => {
    const active = transactions.filter(t => t.status !== "cancelado");
    if (filterMode === "mes") {
      return active.filter(t => t.date.startsWith(`${selectedYear}-${selectedMonth}`));
    } else if (filterMode === "ano") {
      return active.filter(t => t.date.startsWith(selectedYear));
    } else if (filterMode === "periodo" && dateFrom && dateTo) {
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      const toStr = format(dateTo, "yyyy-MM-dd");
      return active.filter(t => t.date >= fromStr && t.date <= toStr);
    }
    return [];
  }, [transactions, filterMode, selectedMonth, selectedYear, dateFrom, dateTo]);

  // Group by category for DRE
  const { receitas, custos, despesas } = useMemo(() => {
    const recMap: Record<string, number> = {};
    const custoMap: Record<string, number> = {};
    const despMap: Record<string, number> = {};

    filteredTx.forEach(t => {
      const label = t.category_name || (t.value >= 0 ? "Receitas sem categoria" : "Despesas sem categoria");
      if (t.value >= 0) {
        recMap[label] = (recMap[label] || 0) + t.value;
      } else {
        // Use category type to distinguish custo vs despesa if available
        const catType = t.category_type || "despesa";
        if (catType === "custo") {
          custoMap[label] = (custoMap[label] || 0) + Math.abs(t.value);
        } else {
          despMap[label] = (despMap[label] || 0) + Math.abs(t.value);
        }
      }
    });

    return {
      receitas: Object.entries(recMap).map(([label, valor]) => ({ label, valor })),
      custos: Object.entries(custoMap).map(([label, valor]) => ({ label, valor })),
      despesas: Object.entries(despMap).map(([label, valor]) => ({ label, valor })),
    };
  }, [filteredTx]);

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

  const openTaxDialog = () => {
    setEditingRates({ ...taxRates[regime] });
    setTaxDialogOpen(true);
  };

  const saveTaxRates = () => {
    setTaxRates(prev => ({ ...prev, [regime]: editingRates }));
    setTaxDialogOpen(false);
  };

  const ResultRow = ({ label, value, bold, highlight, tooltip }: { label: string; value: number; bold?: boolean; highlight?: boolean; tooltip?: string }) => (
    <tr className={cn(
      "border-t border-border",
      highlight && "bg-gold/5 border-t-2 border-gold/30",
      bold && !highlight && "bg-muted/30"
    )}>
      <td className={cn("px-5 py-3", highlight ? "py-4" : "", bold ? "text-sm font-bold" : "text-sm font-semibold", "text-foreground")}>
        <span className="inline-flex items-center gap-1.5">
          {label}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={13} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
      </td>
      <td className={cn(
        "px-5 text-center font-mono",
        highlight ? "py-4 text-base font-bold" : "py-3 text-sm font-bold",
        value >= 0 ? "text-success" : "text-destructive"
      )}>
        {formatCurrency(value)}
      </td>
      <td className={cn("px-5 text-center text-sm text-muted-foreground", highlight ? "py-4" : "py-3")}>
        {faturamentoBruto > 0 ? formatPercent((value / faturamentoBruto) * 100) : "—"}
      </td>
    </tr>
  );

  const filterLabel = useMemo(() => {
    if (filterMode === "mes") {
      const m = months.find(m => m.value === selectedMonth);
      return `${m?.label || ""} ${selectedYear}`;
    }
    if (filterMode === "ano") return `Ano ${selectedYear}`;
    if (filterMode === "periodo" && dateFrom && dateTo) {
      return `${format(dateFrom, "dd/MM/yy")} a ${format(dateTo, "dd/MM/yy")}`;
    }
    return "Selecione o período";
  }, [filterMode, selectedMonth, selectedYear, dateFrom, dateTo]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">DRE - Demonstrativo de Resultado</h1>
          <p className="text-sm text-muted-foreground mt-1">{filterLabel}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={openTaxDialog}>
          <Settings2 size={16} />
          Alíquotas de Impostos
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4">
          <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
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

            <Select value={regime} onValueChange={(v) => setRegime(v as TaxRegime)}>
              <SelectTrigger className="w-full sm:w-52 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                <SelectItem value="real">Lucro Real</SelectItem>
              </SelectContent>
            </Select>
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

      {/* DRE Table */}
      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-left">Descrição</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Valor</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">% Receita</th>
              </tr>
            </thead>
            <tbody>
              {/* RECEITA BRUTA */}
              <tr className="bg-muted/10">
                <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  (+) Receita Bruta / Faturamento
                </td>
              </tr>
              {receitas.map(item => (
                <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-success">{formatCurrency(item.valor)}</td>
                  <td className="px-5 py-3 text-sm text-center text-muted-foreground">
                    {faturamentoBruto > 0 ? formatPercent((item.valor / faturamentoBruto) * 100) : "—"}
                  </td>
                </tr>
              ))}
              <ResultRow label="= Faturamento Bruto" value={faturamentoBruto} bold tooltip="Soma de todas as receitas do período" />

              {/* DEDUÇÕES */}
              <tr className="bg-muted/10">
                <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  (−) Deduções / Impostos sobre Receita
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground">({regimeLabels[regime]})</span>
                </td>
              </tr>
              {[
                { label: `PIS (${formatPercent(currentRates.pis)})`, valor: pisValor },
                { label: `COFINS (${formatPercent(currentRates.cofins)})`, valor: cofinsValor },
                { label: `ISS (${formatPercent(currentRates.iss)})`, valor: issValor },
              ].map(item => (
                <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-destructive">{formatCurrency(-item.valor)}</td>
                  <td className="px-5 py-3 text-sm text-center text-muted-foreground">
                    {faturamentoBruto > 0 ? formatPercent((item.valor / faturamentoBruto) * 100) : "—"}
                  </td>
                </tr>
              ))}
              <ResultRow label="= Receita Líquida" value={receitaLiquida} bold tooltip="Faturamento Bruto menos impostos sobre receita" />

              {/* CUSTOS */}
              <tr className="bg-muted/10">
                <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  (−) Custos dos Serviços / Produtos
                </td>
              </tr>
              {custos.map(item => (
                <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-destructive">{formatCurrency(-item.valor)}</td>
                  <td className="px-5 py-3 text-sm text-center text-muted-foreground">
                    {faturamentoBruto > 0 ? formatPercent((item.valor / faturamentoBruto) * 100) : "—"}
                  </td>
                </tr>
              ))}
              {custos.length === 0 && (
                <tr className="border-b border-border/30">
                  <td colSpan={3} className="px-5 py-3 text-sm text-muted-foreground pl-10 italic">Nenhum custo categorizado</td>
                </tr>
              )}
              <ResultRow label="= Lucro Bruto" value={lucroBruto} bold highlight tooltip="Receita Líquida menos custos diretos" />

              {/* DESPESAS OPERACIONAIS */}
              <tr className="bg-muted/10">
                <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  (−) Despesas Operacionais
                </td>
              </tr>
              {despesas.map(item => (
                <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-destructive">{formatCurrency(-item.valor)}</td>
                  <td className="px-5 py-3 text-sm text-center text-muted-foreground">
                    {faturamentoBruto > 0 ? formatPercent((item.valor / faturamentoBruto) * 100) : "—"}
                  </td>
                </tr>
              ))}
              {despesas.length === 0 && (
                <tr className="border-b border-border/30">
                  <td colSpan={3} className="px-5 py-3 text-sm text-muted-foreground pl-10 italic">Nenhuma despesa categorizada</td>
                </tr>
              )}

              {/* RESULTADO */}
              <ResultRow label="= Lucro Líquido" value={lucroLiquido} bold highlight tooltip="Resultado final após todas as deduções" />
              <tr className="border-t border-border bg-muted/20">
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
            <DialogTitle>Alíquotas de Impostos — {regimeLabels[regime]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>PIS (%)</Label>
              <Input type="number" step="0.01" value={editingRates.pis} onChange={(e) => setEditingRates({ ...editingRates, pis: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>COFINS (%)</Label>
              <Input type="number" step="0.01" value={editingRates.cofins} onChange={(e) => setEditingRates({ ...editingRates, cofins: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>ISS (%)</Label>
              <Input type="number" step="0.01" value={editingRates.iss} onChange={(e) => setEditingRates({ ...editingRates, iss: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveTaxRates}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DRE;
