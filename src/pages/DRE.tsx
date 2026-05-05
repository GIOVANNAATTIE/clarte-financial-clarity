import { useState, useMemo } from "react";
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

// --- Mock transaction data by category type ---
type MockEntry = { label: string; valor: number; tipo: "receita" | "custo" | "despesa" };

const mockTransactionsByMonth: Record<string, MockEntry[]> = {
  "2026-01": [
    { label: "Faturamento de Serviços", valor: 95000, tipo: "receita" },
    { label: "Venda de Produtos", valor: 40000, tipo: "receita" },
    { label: "Prestadores de Serviço", valor: -28000, tipo: "custo" },
    { label: "Tecnologia de Operação", valor: -8500, tipo: "custo" },
    { label: "Benefícios / RH", valor: -12000, tipo: "despesa" },
    { label: "Imóveis / Aluguel", valor: -6000, tipo: "despesa" },
    { label: "Gastos Gerais", valor: -4500, tipo: "despesa" },
  ],
  "2026-02": [
    { label: "Faturamento de Serviços", valor: 110000, tipo: "receita" },
    { label: "Venda de Produtos", valor: 52000, tipo: "receita" },
    { label: "Prestadores de Serviço", valor: -32000, tipo: "custo" },
    { label: "Tecnologia de Operação", valor: -9200, tipo: "custo" },
    { label: "Benefícios / RH", valor: -13500, tipo: "despesa" },
    { label: "Imóveis / Aluguel", valor: -6000, tipo: "despesa" },
    { label: "Gastos Gerais", valor: -5100, tipo: "despesa" },
  ],
  "2026-03": [
    { label: "Faturamento de Serviços", valor: 105000, tipo: "receita" },
    { label: "Venda de Produtos", valor: 48000, tipo: "receita" },
    { label: "Prestadores de Serviço", valor: -30000, tipo: "custo" },
    { label: "Tecnologia de Operação", valor: -9000, tipo: "custo" },
    { label: "Benefícios / RH", valor: -12800, tipo: "despesa" },
    { label: "Imóveis / Aluguel", valor: -6000, tipo: "despesa" },
    { label: "Gastos Gerais", valor: -4800, tipo: "despesa" },
  ],
  "2026-04": [
    { label: "Faturamento de Serviços", valor: 120000, tipo: "receita" },
    { label: "Venda de Produtos", valor: 45000, tipo: "receita" },
    { label: "Prestadores de Serviço", valor: -35000, tipo: "custo" },
    { label: "Tecnologia de Operação", valor: -10000, tipo: "custo" },
    { label: "Benefícios / RH", valor: -14000, tipo: "despesa" },
    { label: "Imóveis / Aluguel", valor: -6500, tipo: "despesa" },
    { label: "Gastos Gerais", valor: -5200, tipo: "despesa" },
  ],
  "2026-05": [
    { label: "Faturamento de Serviços", valor: 115000, tipo: "receita" },
    { label: "Venda de Produtos", valor: 50000, tipo: "receita" },
    { label: "Prestadores de Serviço", valor: -33000, tipo: "custo" },
    { label: "Tecnologia de Operação", valor: -9500, tipo: "custo" },
    { label: "Benefícios / RH", valor: -13200, tipo: "despesa" },
    { label: "Imóveis / Aluguel", valor: -6000, tipo: "despesa" },
    { label: "Gastos Gerais", valor: -4900, tipo: "despesa" },
  ],
};

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

  const currentRates = taxRates[regime];

  // Aggregate data based on filter
  const aggregatedData = useMemo(() => {
    let relevantMonths: string[] = [];

    if (filterMode === "mes") {
      relevantMonths = [`${selectedYear}-${selectedMonth}`];
    } else if (filterMode === "ano") {
      relevantMonths = Object.keys(mockTransactionsByMonth).filter(k => k.startsWith(selectedYear));
    } else if (filterMode === "periodo" && dateFrom && dateTo) {
      relevantMonths = Object.keys(mockTransactionsByMonth).filter(k => {
        const [y, m] = k.split("-");
        const monthDate = new Date(parseInt(y), parseInt(m) - 1, 1);
        return monthDate >= new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1) &&
               monthDate <= new Date(dateTo.getFullYear(), dateTo.getMonth(), 1);
      });
    } else if (filterMode === "periodo") {
      relevantMonths = [];
    }

    const combined: Record<string, MockEntry> = {};
    relevantMonths.forEach(month => {
      const entries = mockTransactionsByMonth[month] || [];
      entries.forEach(entry => {
        if (combined[entry.label]) {
          combined[entry.label] = { ...combined[entry.label], valor: combined[entry.label].valor + entry.valor };
        } else {
          combined[entry.label] = { ...entry };
        }
      });
    });

    return Object.values(combined);
  }, [filterMode, selectedMonth, selectedYear, dateFrom, dateTo]);

  // Calculations
  const receitas = aggregatedData.filter(e => e.tipo === "receita");
  const custos = aggregatedData.filter(e => e.tipo === "custo");
  const despesas = aggregatedData.filter(e => e.tipo === "despesa");

  const faturamentoBruto = receitas.reduce((s, e) => s + e.valor, 0);

  const pisValor = faturamentoBruto * (currentRates.pis / 100);
  const cofinsValor = faturamentoBruto * (currentRates.cofins / 100);
  const issValor = faturamentoBruto * (currentRates.iss / 100);
  const totalDeducoes = pisValor + cofinsValor + issValor;

  const receitaLiquida = faturamentoBruto - totalDeducoes;

  const totalCustos = custos.reduce((s, e) => s + Math.abs(e.valor), 0);
  const lucroBruto = receitaLiquida - totalCustos;

  const totalDespesas = despesas.reduce((s, e) => s + Math.abs(e.valor), 0);
  const lucroLiquido = lucroBruto - totalDespesas;

  // Margins
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

              <ResultRow label="= Receita Líquida" value={receitaLiquida} bold highlight
                tooltip="Faturamento Bruto menos impostos (PIS + COFINS + ISS)" />

              {/* CUSTOS */}
              <tr className="bg-muted/10">
                <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  (−) Custos Diretos (CMV/CSP)
                </td>
              </tr>
              {custos.map(item => (
                <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-destructive">{formatCurrency(item.valor)}</td>
                  <td className="px-5 py-3 text-sm text-center text-muted-foreground">
                    {faturamentoBruto > 0 ? formatPercent((Math.abs(item.valor) / faturamentoBruto) * 100) : "—"}
                  </td>
                </tr>
              ))}

              <ResultRow label="= Lucro Bruto (Margem de Contribuição)" value={lucroBruto} bold highlight
                tooltip="Receita Líquida menos Custos Diretos" />

              {/* DESPESAS */}
              <tr className="bg-muted/10">
                <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  (−) Despesas Operacionais
                </td>
              </tr>
              {despesas.map(item => (
                <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
                  <td className="px-5 py-3 text-sm font-mono text-center text-destructive">{formatCurrency(item.valor)}</td>
                  <td className="px-5 py-3 text-sm text-center text-muted-foreground">
                    {faturamentoBruto > 0 ? formatPercent((Math.abs(item.valor) / faturamentoBruto) * 100) : "—"}
                  </td>
                </tr>
              ))}

              <ResultRow label="= LAIR / Lucro Líquido" value={lucroLiquido} bold highlight
                tooltip="Lucro Bruto menos Despesas Operacionais" />

              {/* MARGENS */}
              <tr className="bg-muted/10">
                <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  Indicadores
                </td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="px-5 py-3 text-sm text-foreground pl-10">Margem Bruta</td>
                <td className={cn("px-5 py-3 text-sm font-mono text-center font-medium", margemBruta >= 0 ? "text-success" : "text-destructive")}>
                  {formatPercent(margemBruta)}
                </td>
                <td className="px-5 py-3 text-sm text-center text-muted-foreground">—</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="px-5 py-3 text-sm text-foreground pl-10">Margem Líquida</td>
                <td className={cn("px-5 py-3 text-sm font-mono text-center font-medium", margemLiquida >= 0 ? "text-success" : "text-destructive")}>
                  {formatPercent(margemLiquida)}
                </td>
                <td className="px-5 py-3 text-sm text-center text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Rates Dialog */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alíquotas de Impostos — {regimeLabels[regime]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Edite as alíquotas abaixo conforme o regime tributário selecionado. As alterações serão aplicadas imediatamente ao DRE.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">PIS (%)</Label>
                <Input
                  type="number" step="0.01" min="0" max="100"
                  value={editingRates.pis}
                  onChange={(e) => setEditingRates(prev => ({ ...prev, pis: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">COFINS (%)</Label>
                <Input
                  type="number" step="0.01" min="0" max="100"
                  value={editingRates.cofins}
                  onChange={(e) => setEditingRates(prev => ({ ...prev, cofins: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">ISS (%)</Label>
                <Input
                  type="number" step="0.01" min="0" max="100"
                  value={editingRates.iss}
                  onChange={(e) => setEditingRates(prev => ({ ...prev, iss: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Total Deduções:</strong> {formatPercent(editingRates.pis + editingRates.cofins + editingRates.iss)}</p>
              <p><strong>Impacto estimado:</strong> {formatCurrency(faturamentoBruto * ((editingRates.pis + editingRates.cofins + editingRates.iss) / 100))}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveTaxRates}>Salvar Alíquotas</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DRE;
