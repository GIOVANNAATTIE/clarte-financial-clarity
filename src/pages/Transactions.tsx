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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Upload, Search, Brain, Filter, ArrowUpDown, ArrowUp, ArrowDown, CalendarIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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


type SortField = "data" | "descricao" | "categoria" | "centroCusto" | "valor" | "status";
type SortDir = "asc" | "desc";

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [costCenterFilter, setCostCenterFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortField, setSortField] = useState<SortField>("data");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [importOpen, setImportOpen] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-gold" /> : <ArrowDown size={12} className="text-gold" />;
  };

  const filtered = mockTransactions
    .filter((t) => {
      const matchSearch = t.descricao.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "todas" || t.categoria === categoryFilter;
      const matchStatus = statusFilter === "todos" || t.status === statusFilter;
      const matchCostCenter = costCenterFilter === "todos" || t.centroCusto === costCenterFilter;
      const tDate = new Date(t.data);
      const matchDateFrom = !dateFrom || tDate >= dateFrom;
      const matchDateTo = !dateTo || tDate <= dateTo;
      return matchSearch && matchCategory && matchStatus && matchCostCenter && matchDateFrom && matchDateTo;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "data") cmp = a.data.localeCompare(b.data);
      else if (sortField === "descricao") cmp = a.descricao.localeCompare(b.descricao);
      else if (sortField === "categoria") cmp = a.categoria.localeCompare(b.categoria);
      else if (sortField === "centroCusto") cmp = a.centroCusto.localeCompare(b.centroCusto);
      else if (sortField === "valor") cmp = a.valor - b.valor;
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const categories = [...new Set(mockTransactions.map((t) => t.categoria))];
  const costCenters = [...new Set(mockTransactions.map((t) => t.centroCusto))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Movimentação</h1>
        </div>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="lg" className="gap-2">
              <Upload size={18} />
              Importar Extrato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Importar Extrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gold bg-gold/5">
                <FileText size={28} className="text-gold" />
                <div>
                  <span className="text-sm font-medium">Arquivo OFX</span>
                  <p className="text-[10px] text-muted-foreground">Formato padrão bancário</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-gold/50 transition-colors cursor-pointer">
                <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Arraste o arquivo ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">Aceita arquivos .ofx</p>
              </div>

              <Button className="w-full">
                <Upload size={16} className="mr-2" />
                Importar Arquivo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-background/50"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-44 h-10">
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
            <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
              <SelectTrigger className="w-full md:w-44 h-10">
                <Filter size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Centros</SelectItem>
                {costCenters.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-36 h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="conciliado">Conciliado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="revisão">Revisão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-48 justify-start text-left font-normal h-10", !dateFrom && "text-muted-foreground")}>
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
                <Button variant="outline" className={cn("w-full sm:w-48 justify-start text-left font-normal h-10", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon size={14} className="mr-2" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo || categoryFilter !== "todas" || statusFilter !== "todos" || costCenterFilter !== "todos" || search) && (
              <Button variant="ghost" size="sm" className="h-10" onClick={() => {
                setSearch(""); setCategoryFilter("todas"); setStatusFilter("todos"); setCostCenterFilter("todos"); setDateFrom(undefined); setDateTo(undefined);
              }}>
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  { field: "data" as SortField, label: "Data" },
                  { field: "descricao" as SortField, label: "Descrição" },
                  { field: "categoria" as SortField, label: "Categoria" },
                  { field: "centroCusto" as SortField, label: "Centro de Custo", hideOnMobile: true },
                  { field: "valor" as SortField, label: "Valor" },
                  { field: "status" as SortField, label: "Status" },
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className={cn(
                      "text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-foreground transition-colors select-none text-center",
                      col.hideOnMobile && "hidden lg:table-cell"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
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
