import { useState } from "react";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Users, ShoppingCart,
  ArrowUpRight, ArrowDownRight, Minus, CalendarDays, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Severity = "critical" | "warning" | "info" | "positive";

type Insight = {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  trend: string;
  icon: React.ReactNode;
};

const insights: Insight[] = [
  {
    id: 1,
    title: "Folha de pagamento subiu 20%",
    description: "A despesa com pessoal aumentou de R$ 37.760 para R$ 45.320 em comparação ao mês anterior. Recomendamos revisar os centros de custo relacionados a RH.",
    category: "Despesas",
    severity: "critical",
    trend: "+20%",
    icon: <TrendingUp size={18} />,
  },
  {
    id: 2,
    title: "Receita bruta cresceu 12,5%",
    description: "A receita total do mês atingiu R$ 334.300, representando um crescimento consistente em relação ao período anterior. O segmento comercial liderou o aumento.",
    category: "Receitas",
    severity: "positive",
    trend: "+12,5%",
    icon: <ArrowUpRight size={18} />,
  },
  {
    id: 3,
    title: "Fornecedor ABC com pagamentos recorrentes",
    description: "Foram identificados 4 pagamentos ao Fornecedor ABC nos últimos 30 dias, totalizando R$ 49.800. Verifique se há duplicidade ou renegociação possível.",
    category: "Fornecedores",
    severity: "warning",
    trend: "4x/mês",
    icon: <RefreshCw size={18} />,
  },
  {
    id: 4,
    title: "Despesas com infraestrutura estáveis",
    description: "Os custos de infraestrutura mantiveram-se em R$ 8.500 pelo terceiro mês consecutivo. Nenhuma ação necessária no momento.",
    category: "Despesas",
    severity: "info",
    trend: "0%",
    icon: <Minus size={18} />,
  },
  {
    id: 5,
    title: "Queda de 15% em receitas de serviços",
    description: "A categoria de serviços registrou queda de R$ 7.300 para R$ 6.200 este mês. Avalie se houve perda de contratos ou sazonalidade.",
    category: "Receitas",
    severity: "warning",
    trend: "-15%",
    icon: <ArrowDownRight size={18} />,
  },
  {
    id: 6,
    title: "Novo fornecedor detectado",
    description: "Um novo fornecedor 'Serviço de Consultoria' foi registrado com um lançamento de R$ 6.200. Categorizado automaticamente pela IA.",
    category: "Fornecedores",
    severity: "info",
    trend: "Novo",
    icon: <ShoppingCart size={18} />,
  },
  {
    id: 7,
    title: "Concentração de receita em poucos clientes",
    description: "73% da receita mensal está concentrada em apenas 2 clientes. Risco alto de dependência — recomenda-se diversificação da carteira.",
    category: "Receitas",
    severity: "critical",
    trend: "73%",
    icon: <Users size={18} />,
  },
  {
    id: 8,
    title: "Despesas operacionais dentro do orçamento",
    description: "As despesas operacionais totalizaram R$ 95.800, ficando 3% abaixo do orçamento previsto de R$ 98.700. Bom controle financeiro.",
    category: "Despesas",
    severity: "positive",
    trend: "-3%",
    icon: <TrendingDown size={18} />,
  },
];

const severityConfig: Record<Severity, { bg: string; border: string; badge: string; icon: string }> = {
  critical: { bg: "bg-destructive/5", border: "border-destructive/30", badge: "bg-destructive/10 text-destructive", icon: "text-destructive" },
  warning: { bg: "bg-warning/5", border: "border-warning/30", badge: "bg-warning/10 text-warning", icon: "text-warning" },
  info: { bg: "bg-muted/50", border: "border-border", badge: "bg-muted text-muted-foreground", icon: "text-muted-foreground" },
  positive: { bg: "bg-success/5", border: "border-success/30", badge: "bg-success/10 text-success", icon: "text-success" },
};

const severityLabels: Record<Severity, string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Informativo",
  positive: "Positivo",
};

const categories = ["Todos", "Receitas", "Despesas", "Fornecedores"];

const monthOptions = [
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

const Insights = () => {
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Date filters
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
      setSelectedMonths(monthOptions.map((m) => m.value));
    }
  };

  const getMonthsLabel = () => {
    if (selectedMonths.length === 0) return "Todos os meses";
    if (selectedMonths.length === 12) return "Todos os meses";
    if (selectedMonths.length <= 2) {
      return selectedMonths
        .map((v) => monthOptions.find((m) => m.value === v)?.label)
        .join(", ");
    }
    return `${selectedMonths.length} meses`;
  };

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Only show data after clicking "Atualizar"
  const activeInsights = isLoaded ? insights : [];

  // Filter by category
  let filtered = categoryFilter === "Todos" ? activeInsights : activeInsights.filter((i) => i.category === categoryFilter);

  // Filter by severity
  if (severityFilter !== "all") {
    filtered = filtered.filter((i) => i.severity === severityFilter);
  }

  const totalCount = activeInsights.length;
  const criticalCount = activeInsights.filter((i) => i.severity === "critical").length;
  const warningCount = activeInsights.filter((i) => i.severity === "warning").length;
  const positiveCount = activeInsights.filter((i) => i.severity === "positive").length;

  const handleSeverityCardClick = (severity: Severity | "all") => {
    setSeverityFilter((prev) => (prev === severity ? "all" : severity));
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simula chamada de IA (futuramente será a chamada real)
    setTimeout(() => {
      setIsLoaded(true);
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Date Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="text-gold" size={24} />
            <h1 className="font-heading text-2xl font-bold text-foreground">Inteligência Financeira</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-gold/15 text-gold px-2 py-0.5 rounded-full">
              IA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-9 gap-2 bg-gold hover:bg-gold/90 text-foreground font-semibold"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {isLoading ? "Analisando..." : "Atualizar Análise"}
            </Button>
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <CalendarDays size={14} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
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
                    {monthOptions.map((m) => (
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
        </div>
      </div>

      {/* Summary Cards - clickable for severity filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total de Alertas"
          value={totalCount}
          color="text-foreground"
          active={severityFilter === "all"}
          onClick={() => handleSeverityCardClick("all")}
        />
        <SummaryCard
          label="Críticos"
          value={criticalCount}
          color="text-destructive"
          active={severityFilter === "critical"}
          onClick={() => handleSeverityCardClick("critical")}
        />
        <SummaryCard
          label="Atenção"
          value={warningCount}
          color="text-warning"
          active={severityFilter === "warning"}
          onClick={() => handleSeverityCardClick("warning")}
        />
        <SummaryCard
          label="Positivos"
          value={positiveCount}
          color="text-success"
          active={severityFilter === "positive"}
          onClick={() => handleSeverityCardClick("positive")}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              categoryFilter === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum alerta encontrado para os filtros selecionados.
          </div>
        )}
        {filtered.map((insight) => {
          const config = severityConfig[insight.severity];
          return (
            <div
              key={insight.id}
              className={`${config.bg} rounded-xl border ${config.border} p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)]`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg bg-card border border-border/50 ${config.icon}`}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="font-heading font-semibold text-sm text-foreground">{insight.title}</h3>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
                      {severityLabels[insight.severity]}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-gold/15 text-gold px-2 py-0.5 rounded-full">
                      IA
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{insight.category}</span>
                    <span className={`text-xs font-semibold font-mono ${
                      insight.trend.startsWith("+") ? "text-success" : insight.trend.startsWith("-") ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {insight.trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function SummaryCard({ label, value, color, active, onClick }: { label: string; value: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl border p-4 shadow-[var(--shadow-card)] text-left transition-all duration-200 hover:shadow-[var(--shadow-elevated)]",
        active ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/30"
      )}
    >
      <p className={`text-2xl font-bold font-heading ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </button>
  );
}

export default Insights;
