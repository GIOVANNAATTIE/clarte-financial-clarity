import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Search, Brain, Filter, ArrowUpDown } from "lucide-react";

type Transaction = {
  id: number;
  data: string;
  descricao: string;
  categoria: string;
  centroCusto: string;
  valor: number;
  status: "conciliado" | "pendente" | "revisão";
  aiCategorized: boolean;
};

const mockTransactions: Transaction[] = [
  { id: 1, data: "2026-04-30", descricao: "Pagamento Fornecedor ABC", categoria: "Fornecedores", centroCusto: "Operações", valor: -12450.0, status: "conciliado", aiCategorized: true },
  { id: 2, data: "2026-04-29", descricao: "Recebimento Cliente XYZ", categoria: "Receitas", centroCusto: "Comercial", valor: 28900.0, status: "conciliado", aiCategorized: false },
  { id: 3, data: "2026-04-28", descricao: "Folha de Pagamento Abril", categoria: "Pessoal", centroCusto: "RH", valor: -45320.0, status: "conciliado", aiCategorized: true },
  { id: 4, data: "2026-04-27", descricao: "Aluguel Sede Administrativa", categoria: "Infraestrutura", centroCusto: "Administrativo", valor: -8500.0, status: "pendente", aiCategorized: true },
  { id: 5, data: "2026-04-26", descricao: "Venda Produto Premium", categoria: "Receitas", centroCusto: "Comercial", valor: 15750.0, status: "conciliado", aiCategorized: false },
  { id: 6, data: "2026-04-25", descricao: "Serviço de Consultoria", categoria: "Serviços", centroCusto: "Projetos", valor: -6200.0, status: "revisão", aiCategorized: true },
  { id: 7, data: "2026-04-24", descricao: "Recebimento Parcela 3/6", categoria: "Receitas", centroCusto: "Comercial", valor: 9800.0, status: "pendente", aiCategorized: false },
  { id: 8, data: "2026-04-23", descricao: "Material de Escritório", categoria: "Materiais", centroCusto: "Administrativo", valor: -1230.0, status: "conciliado", aiCategorized: true },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const statusStyles: Record<string, string> = {
  conciliado: "bg-success/10 text-success",
  pendente: "bg-warning/10 text-warning",
  "revisão": "bg-destructive/10 text-destructive",
};

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [periodFilter, setPeriodFilter] = useState("mensal");

  const filtered = mockTransactions.filter((t) => {
    const matchSearch = t.descricao.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "todas" || t.categoria === categoryFilter;
    return matchSearch && matchCategory;
  });

  const categories = [...new Set(mockTransactions.map((t) => t.categoria))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Movimentação Bancária</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus lançamentos financeiros</p>
        </div>
        <Button variant="hero" size="lg" className="gap-2">
          <Upload size={18} />
          Importar Extrato (OFX/Excel)
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar lançamentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-background/50"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 h-10">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full md:w-44 h-10">
              <ArrowUpDown size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Data</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Descrição</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Categoria</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Centro de Custo</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Valor</th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground whitespace-nowrap">
                    {new Date(t.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      {t.descricao}
                      {t.aiCategorized && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-gold/15 text-gold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          <Brain size={10} /> IA
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{t.categoria}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">{t.centroCusto}</td>
                  <td className={`px-5 py-3.5 text-sm font-mono text-right font-medium ${t.valor >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(t.valor)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${statusStyles[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} lançamentos encontrados</span>
          <span className="flex items-center gap-1">
            <Brain size={12} className="text-gold" />
            {mockTransactions.filter((t) => t.aiCategorized).length} categorizados por IA
          </span>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
