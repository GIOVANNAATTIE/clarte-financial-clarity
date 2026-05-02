import { useState } from "react";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Users, ShoppingCart,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

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

const Insights = () => {
  const [filter, setFilter] = useState("Todos");

  const filtered = filter === "Todos" ? insights : insights.filter((i) => i.category === filter);

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Brain className="text-gold" size={24} />
          <h1 className="font-heading text-2xl font-bold text-foreground">Inteligência Financeira</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gold/15 text-gold px-2 py-0.5 rounded-full">
            IA
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Análises e alertas gerados automaticamente pela inteligência artificial</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total de Alertas" value={insights.length} color="text-foreground" />
        <SummaryCard label="Críticos" value={criticalCount} color="text-destructive" />
        <SummaryCard label="Atenção" value={warningCount} color="text-warning" />
        <SummaryCard label="Positivos" value={insights.filter((i) => i.severity === "positive").length} color="text-success" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === cat
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

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
      <p className={`text-2xl font-bold font-heading ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}


export default Insights;
