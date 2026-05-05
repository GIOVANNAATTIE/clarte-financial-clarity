import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Eye, Search, BarChart3, PieChart, DollarSign, Calculator, FileSpreadsheet, TrendingUp, Scale, Briefcase } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ReportCategory = "contabeis" | "caixa" | "recebiveis" | "rentabilidade" | "custos" | "fiscal" | "estrategico";

type Report = {
  id: number;
  title: string;
  category: ReportCategory;
  icon: React.ElementType;
};

const categoryLabels: Record<ReportCategory, string> = {
  contabeis: "Demonstrações Contábeis",
  caixa: "Caixa",
  recebiveis: "Recebíveis / Pagáveis",
  rentabilidade: "Rentabilidade",
  custos: "Custos",
  fiscal: "Fiscal",
  estrategico: "Estratégico",
};

const categoryIcons: Record<ReportCategory, React.ElementType> = {
  contabeis: Scale,
  caixa: DollarSign,
  recebiveis: FileText,
  rentabilidade: TrendingUp,
  custos: Calculator,
  fiscal: FileSpreadsheet,
  estrategico: Briefcase,
};

const allReports: Report[] = [
  // Demonstrações Contábeis
  { id: 1, title: "Balanço Patrimonial", category: "contabeis", icon: Scale },
  { id: 2, title: "DRE - Demonstração do Resultado", category: "contabeis", icon: BarChart3 },
  { id: 3, title: "DRE Vertical", category: "contabeis", icon: BarChart3 },
  { id: 4, title: "DRE Horizontal", category: "contabeis", icon: BarChart3 },
  { id: 5, title: "Balancete Analítico", category: "contabeis", icon: FileText },
  { id: 6, title: "Balancete Sintético", category: "contabeis", icon: FileText },
  { id: 7, title: "DMPL", category: "contabeis", icon: Scale },
  // Caixa
  { id: 8, title: "Fluxo de Caixa Direto", category: "caixa", icon: DollarSign },
  { id: 9, title: "Fluxo de Caixa Indireto", category: "caixa", icon: DollarSign },
  { id: 10, title: "Fluxo de Caixa Projetado", category: "caixa", icon: TrendingUp },
  { id: 11, title: "Conciliação Bancária", category: "caixa", icon: FileSpreadsheet },
  { id: 12, title: "Extrato de Conta", category: "caixa", icon: FileText },
  // Recebíveis / Pagáveis
  { id: 13, title: "Contas a Receber (Aging)", category: "recebiveis", icon: FileText },
  { id: 14, title: "Contas a Pagar (Aging)", category: "recebiveis", icon: FileText },
  { id: 15, title: "Inadimplência por Cliente", category: "recebiveis", icon: PieChart },
  { id: 16, title: "Previsão de Recebimentos", category: "recebiveis", icon: TrendingUp },
  { id: 17, title: "Previsão de Pagamentos", category: "recebiveis", icon: TrendingUp },
  { id: 18, title: "Relatório de Fornecedores", category: "recebiveis", icon: FileText },
  // Rentabilidade
  { id: 19, title: "Margem por Produto/Serviço", category: "rentabilidade", icon: BarChart3 },
  { id: 20, title: "Margem por Cliente", category: "rentabilidade", icon: PieChart },
  { id: 21, title: "Margem por Centro de Custo", category: "rentabilidade", icon: BarChart3 },
  { id: 22, title: "ROI por Projeto", category: "rentabilidade", icon: TrendingUp },
  { id: 23, title: "EBITDA", category: "rentabilidade", icon: BarChart3 },
  { id: 24, title: "Ponto de Equilíbrio (Break-even)", category: "rentabilidade", icon: Calculator },
  // Custos
  { id: 25, title: "Custos por Centro de Custo", category: "custos", icon: Calculator },
  { id: 26, title: "Custos por Categoria", category: "custos", icon: PieChart },
  { id: 27, title: "Custos Fixos vs Variáveis", category: "custos", icon: BarChart3 },
  { id: 28, title: "Evolução de Custos (12 meses)", category: "custos", icon: TrendingUp },
  { id: 29, title: "Budget vs Realizado", category: "custos", icon: FileSpreadsheet },
  // Fiscal
  { id: 30, title: "Apuração de Impostos", category: "fiscal", icon: FileSpreadsheet },
  { id: 31, title: "Livro Caixa", category: "fiscal", icon: FileText },
  { id: 32, title: "Resumo Fiscal Mensal", category: "fiscal", icon: Calculator },
  { id: 33, title: "Guias de Recolhimento", category: "fiscal", icon: FileText },
  // Estratégico
  { id: 34, title: "Dashboard Executivo", category: "estrategico", icon: Briefcase },
  { id: 35, title: "Indicadores Financeiros (KPIs)", category: "estrategico", icon: TrendingUp },
  { id: 36, title: "Projeção Financeira (3-12 meses)", category: "estrategico", icon: TrendingUp },
  { id: 37, title: "Análise de Cenários", category: "estrategico", icon: BarChart3 },
];

const Reports = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ReportCategory>("contabeis");

  const filteredReports = allReports.filter(
    (r) => r.category === activeTab && r.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = (report: Report, format: "pdf" | "excel") => {
    // Placeholder - will implement actual export
    alert(`Exportando "${report.title}" em ${format.toUpperCase()}. Funcionalidade em desenvolvimento.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Central de Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allReports.length} relatórios disponíveis com exportação em Excel e PDF com papel timbrado
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar relatório..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportCategory)}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {(Object.keys(categoryLabels) as ReportCategory[]).map((cat) => {
            const Icon = categoryIcons[cat];
            const count = allReports.filter((r) => r.category === cat).length;
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon size={13} />
                {categoryLabels[cat]}
                <span className="text-[10px] opacity-60">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(categoryLabels) as ReportCategory[]).map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const ReportIcon = report.icon;
                return (
                  <div
                    key={report.id}
                    className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <ReportIcon className="text-primary" size={20} />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {categoryLabels[report.category]}
                      </span>
                    </div>

                    <h3 className="font-heading font-semibold text-foreground text-sm mb-4 leading-snug">
                      {report.title}
                    </h3>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleExport(report, "excel")}>
                        <FileSpreadsheet size={14} />
                        Excel
                      </Button>
                      <Button variant="gold" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleExport(report, "pdf")}>
                        <Download size={14} />
                        PDF
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredReports.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                  Nenhum relatório encontrado
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Reports;
