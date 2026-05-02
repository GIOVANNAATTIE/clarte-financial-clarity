import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, Calendar, BarChart3, PieChart } from "lucide-react";

const reports = [
  {
    id: 1,
    title: "DRE Mensal - Abril 2026",
    type: "DRE",
    date: "30/04/2026",
    icon: BarChart3,
  },
  {
    id: 2,
    title: "Fluxo de Caixa - 1º Trimestre",
    type: "Fluxo de Caixa",
    date: "31/03/2026",
    icon: PieChart,
  },
  {
    id: 3,
    title: "Balancete Analítico - Abril",
    type: "Balancete",
    date: "30/04/2026",
    icon: FileText,
  },
  {
    id: 4,
    title: "Relatório de Despesas por Centro de Custo",
    type: "Despesas",
    date: "30/04/2026",
    icon: BarChart3,
  },
  {
    id: 5,
    title: "Análise de Receitas por Categoria",
    type: "Receitas",
    date: "30/04/2026",
    icon: PieChart,
  },
  {
    id: 6,
    title: "Projeção Financeira - Próx. 3 Meses",
    type: "Projeção",
    date: "01/05/2026",
    icon: BarChart3,
  },
];

const Reports = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Relatórios financeiros editáveis e exportáveis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <report.icon className="text-primary" size={20} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded-full">
                {report.type}
              </span>
            </div>

            <h3 className="font-heading font-semibold text-foreground text-sm mb-2 leading-snug">
              {report.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
              <Calendar size={12} />
              {report.date}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                <Eye size={14} />
                Visualizar
              </Button>
              <Button variant="gold" size="sm" className="flex-1 gap-1.5 text-xs">
                <Download size={14} />
                Exportar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
