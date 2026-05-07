import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download, FileText, Search, BarChart3, PieChart, DollarSign,
  Calculator, FileSpreadsheet, TrendingUp, Scale, Briefcase,
  Loader2, CheckCircle2, Settings2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ReportCategory = "contabeis" | "caixa" | "pagar_receber" | "rentabilidade" | "custos" | "fiscal" | "estrategico";

type Report = {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  icon: React.ElementType;
  auto: boolean; // can be auto-generated from existing data
};

const categoryLabels: Record<ReportCategory, string> = {
  contabeis: "Demonstrações Contábeis",
  caixa: "Caixa e Tesouraria",
  pagar_receber: "Contas a Pagar/Receber",
  rentabilidade: "Receita e Rentabilidade",
  custos: "Custos e Estoque",
  fiscal: "Fiscal / Tributário",
  estrategico: "Indicadores Estratégicos",
};

const categoryIcons: Record<ReportCategory, React.ElementType> = {
  contabeis: Scale,
  caixa: DollarSign,
  pagar_receber: FileText,
  rentabilidade: TrendingUp,
  custos: Calculator,
  fiscal: FileSpreadsheet,
  estrategico: Briefcase,
};

const allReports: Report[] = [
  // Demonstrações Contábeis
  { id: 1, title: "DRE — Demonstração do Resultado", description: "Receitas, deduções, custos, despesas e lucro líquido", category: "contabeis", icon: BarChart3, auto: true },
  { id: 2, title: "DRE Vertical (% sobre receita)", description: "Cada linha como percentual da receita bruta", category: "contabeis", icon: BarChart3, auto: true },
  { id: 3, title: "DRE Horizontal (variação mensal)", description: "Evolução mês a mês de cada linha da DRE", category: "contabeis", icon: BarChart3, auto: true },
  { id: 4, title: "DRE Mensalizada (colunas por mês)", description: "Uma coluna por mês, visão anual completa", category: "contabeis", icon: BarChart3, auto: true },
  { id: 5, title: "Balancete Analítico", description: "Detalhamento de todos os lançamentos por conta", category: "contabeis", icon: FileText, auto: true },
  { id: 6, title: "Balancete Sintético", description: "Resumo agrupado por categoria", category: "contabeis", icon: FileText, auto: true },
  { id: 7, title: "DMPL — Demonstração das Mutações do PL", description: "Variações no patrimônio líquido", category: "contabeis", icon: Scale, auto: false },
  // Caixa e Tesouraria
  { id: 8, title: "Fluxo de Caixa Direto", description: "Entradas e saídas efetivas por período", category: "caixa", icon: DollarSign, auto: true },
  { id: 9, title: "Fluxo de Caixa Indireto", description: "Partindo do lucro líquido até o caixa", category: "caixa", icon: DollarSign, auto: true },
  { id: 10, title: "Fluxo de Caixa Projetado", description: "Projeção baseada em histórico e tendências", category: "caixa", icon: TrendingUp, auto: true },
  { id: 11, title: "Conciliação Bancária", description: "Comparativo entre extrato e lançamentos", category: "caixa", icon: FileSpreadsheet, auto: true },
  { id: 12, title: "Extrato de Conta Detalhado", description: "Todos os lançamentos em ordem cronológica", category: "caixa", icon: FileText, auto: true },
  { id: 13, title: "Posição de Caixa Diária", description: "Saldo acumulado dia a dia", category: "caixa", icon: DollarSign, auto: true },
  // Contas a Pagar/Receber
  { id: 14, title: "Contas a Receber (Aging)", description: "Aging list por faixa de vencimento", category: "pagar_receber", icon: FileText, auto: true },
  { id: 15, title: "Contas a Pagar (Aging)", description: "Aging list de obrigações por vencimento", category: "pagar_receber", icon: FileText, auto: true },
  { id: 16, title: "Previsão de Recebimentos", description: "Estimativa de entradas nos próximos 30/60/90 dias", category: "pagar_receber", icon: TrendingUp, auto: true },
  { id: 17, title: "Previsão de Pagamentos", description: "Estimativa de saídas nos próximos 30/60/90 dias", category: "pagar_receber", icon: TrendingUp, auto: true },
  { id: 18, title: "Inadimplência por Cliente", description: "Clientes com títulos vencidos e valores em aberto", category: "pagar_receber", icon: PieChart, auto: true },
  { id: 19, title: "Relatório de Fornecedores", description: "Histórico e volume de pagamentos por fornecedor", category: "pagar_receber", icon: FileText, auto: true },
  // Receita e Rentabilidade
  { id: 20, title: "Margem por Categoria", description: "Receita e margem agrupados por categoria", category: "rentabilidade", icon: BarChart3, auto: true },
  { id: 21, title: "Margem por Cliente", description: "Receita e lucratividade por cliente", category: "rentabilidade", icon: PieChart, auto: true },
  { id: 22, title: "Margem por Centro de Custo", description: "Resultado segregado por centro de custo", category: "rentabilidade", icon: BarChart3, auto: true },
  { id: 23, title: "EBITDA", description: "Lucro antes de juros, impostos, depreciação e amortização", category: "rentabilidade", icon: BarChart3, auto: true },
  { id: 24, title: "Ponto de Equilíbrio (Break-even)", description: "Receita mínima para cobrir todos os custos", category: "rentabilidade", icon: Calculator, auto: false },
  { id: 25, title: "ROI por Projeto / Operação", description: "Retorno sobre investimento por operação", category: "rentabilidade", icon: TrendingUp, auto: false },
  // Custos e Estoque
  { id: 26, title: "Custos por Centro de Custo", description: "Detalhamento de despesas por centro", category: "custos", icon: Calculator, auto: true },
  { id: 27, title: "Custos por Categoria", description: "Agrupamento e ranking de despesas por categoria", category: "custos", icon: PieChart, auto: true },
  { id: 28, title: "Custos Fixos vs Variáveis", description: "Separação entre custos fixos e variáveis", category: "custos", icon: BarChart3, auto: true },
  { id: 29, title: "Evolução de Custos (12 meses)", description: "Série histórica de custos mês a mês", category: "custos", icon: TrendingUp, auto: true },
  { id: 30, title: "Budget vs Realizado", description: "Comparativo entre orçado e executado", category: "custos", icon: FileSpreadsheet, auto: false },
  // Fiscal / Tributário
  { id: 31, title: "Apuração de Impostos", description: "PIS, COFINS, ISS e demais tributos apurados", category: "fiscal", icon: FileSpreadsheet, auto: true },
  { id: 32, title: "Livro Caixa", description: "Registro fiscal de entradas e saídas", category: "fiscal", icon: FileText, auto: true },
  { id: 33, title: "Resumo Fiscal Mensal", description: "Consolidado de obrigações fiscais do mês", category: "fiscal", icon: Calculator, auto: true },
  { id: 34, title: "Planejamento Tributário", description: "Simulação de regimes e estratégias fiscais", category: "fiscal", icon: FileText, auto: false },
  // Indicadores Estratégicos
  { id: 35, title: "Dashboard Executivo", description: "KPIs principais em formato de painel gerencial", category: "estrategico", icon: Briefcase, auto: true },
  { id: 36, title: "Indicadores Financeiros (KPIs)", description: "Liquidez, endividamento, rentabilidade e eficiência", category: "estrategico", icon: TrendingUp, auto: true },
  { id: 37, title: "Projeção Financeira (3-12 meses)", description: "Cenários de crescimento baseados no histórico", category: "estrategico", icon: TrendingUp, auto: true },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const Reports = () => {
  const { selectedClient } = useClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ReportCategory>("contabeis");
  const [loading, setLoading] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedClient?.id]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const companyId = selectedClient?.id;

    let txQ = supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
    let lancQ = supabase.from("bills").select("*").eq("user_id", user.id).order("due_date", { ascending: true });
    if (companyId) { txQ = txQ.eq("company_id", companyId); }

    const [txRes, catRes, ccRes, entRes, lancRes] = await Promise.all([
      txQ,
      supabase.from("categories").select("*").eq("user_id", user.id),
      supabase.from("cost_centers").select("*").eq("user_id", user.id),
      supabase.from("entities").select("*").eq("user_id", user.id),
      lancQ.catch(() => ({ data: [] })),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (ccRes.data) setCostCenters(ccRes.data);
    if (entRes.data) setEntities(entRes.data);
    if ((lancRes as any).data) setLancamentos((lancRes as any).data);
  };

  // Build report data based on report id
  const buildReportData = (report: Report) => {
    const catMap = new Map(categories.map(c => [c.id, c]));
    const ccMap = new Map(costCenters.map(c => [c.id, c]));
    const entMap = new Map(entities.map(e => [e.id, e]));

    const enriched = transactions.map(t => ({
      ...t,
      category_name: t.category_id ? catMap.get(t.category_id)?.name || "Sem categoria" : "Sem categoria",
      cost_center_name: t.cost_center_id ? ccMap.get(t.cost_center_id)?.name || "" : "",
      entity_name: t.entity_id ? entMap.get(t.entity_id)?.name || "" : "",
    }));

    const receitas = enriched.filter(t => t.value >= 0);
    const despesas = enriched.filter(t => t.value < 0);

    switch (report.id) {
      case 1: case 2: case 3: case 4: // DRE variants
        return buildDRE(enriched);
      case 8: case 9: case 12: case 13: // Fluxo de caixa / extrato
        return buildFluxoCaixa(enriched);
      case 11: // Conciliação
        return buildExtrato(enriched);
      case 14: // Contas a receber aging
        return buildAging(lancamentos.filter(l => l.tipo === "receber"));
      case 15: // Contas a pagar aging
        return buildAging(lancamentos.filter(l => l.tipo === "pagar"));
      case 19: // Fornecedores
        return buildFornecedores(despesas, entMap);
      case 20: // Margem por categoria
        return buildMargemCategoria(enriched);
      case 26: case 27: // Custos
        return buildCustos(despesas);
      case 29: // Evolução 12 meses
        return buildEvolucao12Meses(enriched);
      case 31: case 33: // Fiscal
        return buildFiscal(receitas);
      case 32: // Livro caixa
        return buildExtrato(enriched);
      default:
        return buildDRE(enriched);
    }
  };

  const buildDRE = (enriched: any[]) => {
    const receitas = enriched.filter(t => t.value >= 0);
    const despesas = enriched.filter(t => t.value < 0);
    const totalReceitas = receitas.reduce((s, t) => s + t.value, 0);
    const totalDespesas = despesas.reduce((s, t) => s + Math.abs(t.value), 0);
    return [
      ["DRE — Demonstração do Resultado do Exercício"],
      ["Empresa:", selectedClient?.name || ""],
      ["Gerado por:", "Clarté Consultoria"],
      ["Data:", format(new Date(), "dd/MM/yyyy")],
      [],
      ["DESCRIÇÃO", "VALOR", "% RECEITA"],
      ["(+) RECEITA BRUTA", formatCurrency(totalReceitas), "100,00%"],
      ...receitas.reduce((acc: any[], t) => {
        const existing = acc.find(r => r[0] === `  ${t.category_name}`);
        if (existing) existing[1] += t.value;
        else acc.push([`  ${t.category_name}`, t.value, ""]);
        return acc;
      }, []).map(r => [r[0], formatCurrency(typeof r[1] === "number" ? r[1] : 0), totalReceitas > 0 ? `${((typeof r[1] === "number" ? r[1] : 0) / totalReceitas * 100).toFixed(2)}%` : "—"]),
      [],
      ["(-) DESPESAS OPERACIONAIS", formatCurrency(-totalDespesas), totalReceitas > 0 ? `${(totalDespesas / totalReceitas * 100).toFixed(2)}%` : "—"],
      ...despesas.reduce((acc: any[], t) => {
        const existing = acc.find(r => r[0] === `  ${t.category_name}`);
        if (existing) existing[1] += Math.abs(t.value);
        else acc.push([`  ${t.category_name}`, Math.abs(t.value), ""]);
        return acc;
      }, []).map(r => [r[0], formatCurrency(-(typeof r[1] === "number" ? r[1] : 0)), totalReceitas > 0 ? `${((typeof r[1] === "number" ? r[1] : 0) / totalReceitas * 100).toFixed(2)}%` : "—"]),
      [],
      ["(=) LUCRO LÍQUIDO", formatCurrency(totalReceitas - totalDespesas), totalReceitas > 0 ? `${((totalReceitas - totalDespesas) / totalReceitas * 100).toFixed(2)}%` : "—"],
    ];
  };

  const buildFluxoCaixa = (enriched: any[]) => {
    const byMonth: Record<string, { entradas: number; saidas: number }> = {};
    enriched.forEach(t => {
      const key = t.date.substring(0, 7);
      if (!byMonth[key]) byMonth[key] = { entradas: 0, saidas: 0 };
      if (t.value >= 0) byMonth[key].entradas += t.value;
      else byMonth[key].saidas += Math.abs(t.value);
    });
    return [
      ["FLUXO DE CAIXA"],
      ["Empresa:", selectedClient?.name || ""],
      ["Gerado por:", "Clarté Consultoria"],
      [],
      ["MÊS", "ENTRADAS", "SAÍDAS", "SALDO"],
      ...Object.entries(byMonth).sort().map(([m, v]) => [
        m, formatCurrency(v.entradas), formatCurrency(v.saidas), formatCurrency(v.entradas - v.saidas)
      ]),
    ];
  };

  const buildExtrato = (enriched: any[]) => [
    ["EXTRATO DETALHADO"],
    ["Empresa:", selectedClient?.name || ""],
    ["Gerado por:", "Clarté Consultoria"],
    [],
    ["DATA", "CLIENTE/FORNECEDOR", "DESCRIÇÃO", "CATEGORIA", "VALOR", "STATUS"],
    ...enriched.map(t => [
      new Date(t.date).toLocaleDateString("pt-BR"),
      t.entity_name || "",
      t.description || "",
      t.category_name,
      formatCurrency(t.value),
      t.status,
    ]),
  ];

  const buildAging = (items: any[]) => [
    ["AGING LIST"],
    ["Empresa:", selectedClient?.name || ""],
    ["Gerado por:", "Clarté Consultoria"],
    [],
    ["VENCIMENTO", "DESCRIÇÃO", "VALOR", "STATUS"],
    ...items.map(l => [
      new Date(l.due_date || l.vencimento).toLocaleDateString("pt-BR"),
      l.description || l.descricao || "",
      formatCurrency(l.value || l.valor || 0),
      l.status,
    ]),
  ];

  const buildFornecedores = (despesas: any[], entMap: Map<string, any>) => {
    const byEnt: Record<string, number> = {};
    despesas.forEach(t => {
      const name = t.entity_name || "Sem fornecedor";
      byEnt[name] = (byEnt[name] || 0) + Math.abs(t.value);
    });
    return [
      ["RELATÓRIO DE FORNECEDORES"],
      ["Empresa:", selectedClient?.name || ""],
      ["Gerado por:", "Clarté Consultoria"],
      [],
      ["FORNECEDOR", "TOTAL PAGO", "% DO TOTAL"],
      ...Object.entries(byEnt).sort((a, b) => b[1] - a[1]).map(([name, val]) => {
        const total = Object.values(byEnt).reduce((s, v) => s + v, 0);
        return [name, formatCurrency(val), `${(val / total * 100).toFixed(2)}%`];
      }),
    ];
  };

  const buildMargemCategoria = (enriched: any[]) => {
    const byCat: Record<string, { receitas: number; despesas: number }> = {};
    enriched.forEach(t => {
      const cat = t.category_name;
      if (!byCat[cat]) byCat[cat] = { receitas: 0, despesas: 0 };
      if (t.value >= 0) byCat[cat].receitas += t.value;
      else byCat[cat].despesas += Math.abs(t.value);
    });
    return [
      ["MARGEM POR CATEGORIA"],
      ["Empresa:", selectedClient?.name || ""],
      ["Gerado por:", "Clarté Consultoria"],
      [],
      ["CATEGORIA", "RECEITAS", "DESPESAS", "MARGEM"],
      ...Object.entries(byCat).map(([cat, v]) => [
        cat, formatCurrency(v.receitas), formatCurrency(v.despesas),
        formatCurrency(v.receitas - v.despesas),
      ]),
    ];
  };

  const buildCustos = (despesas: any[]) => {
    const byCat: Record<string, number> = {};
    despesas.forEach(t => {
      byCat[t.category_name] = (byCat[t.category_name] || 0) + Math.abs(t.value);
    });
    const total = Object.values(byCat).reduce((s, v) => s + v, 0);
    return [
      ["CUSTOS POR CATEGORIA"],
      ["Empresa:", selectedClient?.name || ""],
      ["Gerado por:", "Clarté Consultoria"],
      [],
      ["CATEGORIA", "VALOR", "% DO TOTAL"],
      ...Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, val]) => [
        cat, formatCurrency(val), `${(val / total * 100).toFixed(2)}%`
      ]),
      [],
      ["TOTAL", formatCurrency(total), "100,00%"],
    ];
  };

  const buildEvolucao12Meses = (enriched: any[]) => {
    const byMonth: Record<string, { receitas: number; despesas: number }> = {};
    enriched.forEach(t => {
      const key = t.date.substring(0, 7);
      if (!byMonth[key]) byMonth[key] = { receitas: 0, despesas: 0 };
      if (t.value >= 0) byMonth[key].receitas += t.value;
      else byMonth[key].despesas += Math.abs(t.value);
    });
    return [
      ["EVOLUÇÃO DE CUSTOS — 12 MESES"],
      ["Empresa:", selectedClient?.name || ""],
      ["Gerado por:", "Clarté Consultoria"],
      [],
      ["MÊS", "RECEITAS", "DESPESAS", "SALDO", "MARGEM %"],
      ...Object.entries(byMonth).sort().slice(-12).map(([m, v]) => [
        m, formatCurrency(v.receitas), formatCurrency(v.despesas),
        formatCurrency(v.receitas - v.despesas),
        v.receitas > 0 ? `${((v.receitas - v.despesas) / v.receitas * 100).toFixed(2)}%` : "—",
      ]),
    ];
  };

  const buildFiscal = (receitas: any[]) => {
    const total = receitas.reduce((s, t) => s + t.value, 0);
    return [
      ["APURAÇÃO DE IMPOSTOS"],
      ["Empresa:", selectedClient?.name || ""],
      ["Regime:", "Lucro Presumido"],
      ["Gerado por:", "Clarté Consultoria"],
      [],
      ["IMPOSTO", "BASE DE CÁLCULO", "ALÍQUOTA", "VALOR APURADO"],
      ["PIS", formatCurrency(total), "0,65%", formatCurrency(total * 0.0065)],
      ["COFINS", formatCurrency(total), "3,00%", formatCurrency(total * 0.03)],
      ["ISS", formatCurrency(total), "5,00%", formatCurrency(total * 0.05)],
      [],
      ["TOTAL DE TRIBUTOS", "", "", formatCurrency(total * 0.0865)],
    ];
  };

  // Export to Excel (CSV)
  const exportExcel = async (report: Report) => {
    setLoading(report.id);
    try {
      const data = buildReportData(report);
      const csv = data.map(row =>
        (Array.isArray(row) ? row : [row]).map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")
      ).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `${report.title} exportado!` });
    } catch (e) {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    }
    setLoading(null);
  };

  // Export to PDF (timbrado)
  const exportPDF = async (report: Report) => {
    setLoading(report.id * 100);
    try {
      const data = buildReportData(report);
      const logoUrl = selectedClient?.logoUrl || "";
      const companyName = selectedClient?.name || "Empresa";

      const tableRows = data.slice(5).map(row =>
        `<tr>${(Array.isArray(row) ? row : [row]).map(cell =>
          `<td style="padding:4px 8px;border:1px solid #e5e7eb;font-size:11px">${cell || ""}</td>`
        ).join("")}</tr>`
      ).join("");

      const html = `
        <!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #7c1d2e; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { max-height: 60px; max-width: 160px; object-fit: contain; }
          .brand { text-align: right; }
          .brand h2 { margin: 0; color: #7c1d2e; font-size: 16px; }
          .brand p { margin: 2px 0; font-size: 11px; color: #666; }
          h1 { color: #1a1a1a; font-size: 18px; margin: 0 0 4px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          thead tr { background: #7c1d2e; color: white; }
          thead td { padding: 6px 8px; font-size: 11px; font-weight: bold; }
          tbody tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
        </style></head><body>
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : `<div style="font-size:20px;font-weight:bold;color:#7c1d2e">${companyName}</div>`}
          <div class="brand">
            <h2>Clarté Consultoria</h2>
            <p>Assessoria Contábil e Financeira</p>
            <p>${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
        </div>
        <h1>${report.title}</h1>
        <p class="subtitle">${companyName} · ${report.description}</p>
        <table>
          <thead><tr>${(data[5] || []).map((h: any) => `<td>${h}</td>`).join("")}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">
          <span>Clarté Consultoria — Documento gerado automaticamente</span>
          <span>${format(new Date(), "dd/MM/yyyy HH:mm")}</span>
        </div>
        </body></html>`;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
      }
      toast({ title: `PDF do ${report.title} gerado!` });
    } catch (e) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
    setLoading(null);
  };

  const filteredReports = allReports.filter(
    r => r.category === activeTab && r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Central de Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allReports.length} relatórios · Exportação em Excel e PDF timbrado com logo
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar relatório..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as ReportCategory)}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {(Object.keys(categoryLabels) as ReportCategory[]).map(cat => {
            const Icon = categoryIcons[cat];
            const count = allReports.filter(r => r.category === cat).length;
            return (
              <TabsTrigger key={cat} value={cat}
                className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Icon size={13} />
                {categoryLabels[cat]}
                <span className="text-[10px] opacity-60">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(categoryLabels) as ReportCategory[]).map(cat => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReports.map(report => {
                const ReportIcon = report.icon;
                const isLoadingExcel = loading === report.id;
                const isLoadingPDF = loading === report.id * 100;
                return (
                  <div key={report.id}
                    className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <ReportIcon className="text-primary" size={20} />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${report.auto ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {report.auto ? "Automático" : "Config. manual"}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-sm mb-1 leading-snug">
                      {report.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{report.description}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs"
                        disabled={isLoadingExcel || !report.auto}
                        onClick={() => exportExcel(report)}>
                        {isLoadingExcel ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                        Excel
                      </Button>
                      <Button size="sm" className="flex-1 gap-1.5 text-xs bg-primary hover:bg-primary/90"
                        disabled={isLoadingPDF || !report.auto}
                        onClick={() => exportPDF(report)}>
                        {isLoadingPDF ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                        PDF Timbrado
                      </Button>
                    </div>
                    {!report.auto && (
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Requer configuração manual
                      </p>
                    )}
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
