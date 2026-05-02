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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown, Filter, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Lancamento = {
  id: number;
  tipo: "pagar" | "receber";
  descricao: string;
  pessoa: string;
  categoria: string;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: "aberto" | "pago" | "vencido";
};

const mockLancamentos: Lancamento[] = [
  { id: 1, tipo: "receber", descricao: "Fatura #1042", pessoa: "Cliente ABC Ltda", categoria: "Receitas", valor: 15800, vencimento: "2026-05-10", status: "aberto" },
  { id: 2, tipo: "receber", descricao: "Consultoria Março", pessoa: "Tech Solutions", categoria: "Serviços", valor: 9200, vencimento: "2026-04-25", status: "vencido" },
  { id: 3, tipo: "receber", descricao: "Fatura #1038", pessoa: "MKPlace", categoria: "Receitas", valor: 23500, vencimento: "2026-04-15", pagamento: "2026-04-14", status: "pago" },
  { id: 4, tipo: "pagar", descricao: "Aluguel Maio", pessoa: "Imobiliária Central", categoria: "Infraestrutura", valor: 8500, vencimento: "2026-05-05", status: "aberto" },
  { id: 5, tipo: "pagar", descricao: "Energia Elétrica", pessoa: "CPFL Energia", categoria: "Utilidades", valor: 3200, vencimento: "2026-04-20", status: "vencido" },
  { id: 6, tipo: "pagar", descricao: "Fornecedor Materiais", pessoa: "Distribuidora XYZ", categoria: "Fornecedores", valor: 12450, vencimento: "2026-05-15", status: "aberto" },
  { id: 7, tipo: "pagar", descricao: "Internet", pessoa: "Vivo Empresas", categoria: "Utilidades", valor: 890, vencimento: "2026-04-28", pagamento: "2026-04-27", status: "pago" },
  { id: 8, tipo: "receber", descricao: "Parcela 4/6", pessoa: "Grupo Horizonte", categoria: "Receitas", valor: 7600, vencimento: "2026-05-20", status: "aberto" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const statusConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  aberto: { label: "Aberto", style: "bg-warning/10 text-warning", icon: Clock },
  pago: { label: "Pago", style: "bg-success/10 text-success", icon: CheckCircle2 },
  vencido: { label: "Vencido", style: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

type SortField = "descricao" | "pessoa" | "valor" | "vencimento" | "status";
type SortDir = "asc" | "desc";

const Lancamentos = () => {
  const [tab, setTab] = useState("receber");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortField, setSortField] = useState<SortField>("vencimento");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-gold" /> : <ArrowDown size={12} className="text-gold" />;
  };

  const filtered = mockLancamentos
    .filter((l) => {
      if (l.tipo !== tab) return false;
      const matchSearch = l.descricao.toLowerCase().includes(search.toLowerCase()) || l.pessoa.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "todos" || l.status === statusFilter;
      const vDate = new Date(l.vencimento);
      const matchFrom = !dateFrom || vDate >= dateFrom;
      const matchTo = !dateTo || vDate <= dateTo;
      return matchSearch && matchStatus && matchFrom && matchTo;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "vencimento") cmp = a.vencimento.localeCompare(b.vencimento);
      else if (sortField === "descricao") cmp = a.descricao.localeCompare(b.descricao);
      else if (sortField === "pessoa") cmp = a.pessoa.localeCompare(b.pessoa);
      else if (sortField === "valor") cmp = a.valor - b.valor;
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalAberto = filtered.filter(l => l.status === "aberto").reduce((s, l) => s + l.valor, 0);
  const totalVencido = filtered.filter(l => l.status === "vencido").reduce((s, l) => s + l.valor, 0);
  const totalPago = filtered.filter(l => l.status === "pago").reduce((s, l) => s + l.valor, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Lançamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Contas a pagar e a receber</p>
        </div>
        <Button variant="hero" size="lg" className="gap-2">
          <Plus size={18} />
          Novo Lançamento
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="receber" className="flex-1 sm:flex-none gap-2">
            <ArrowDown size={14} className="text-success" /> Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="pagar" className="flex-1 sm:flex-none gap-2">
            <ArrowUp size={14} className="text-destructive" /> Contas a Pagar
          </TabsTrigger>
        </TabsList>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Em Aberto</p>
            <p className="text-xl font-bold text-warning mt-1">{formatCurrency(totalAberto)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidos</p>
            <p className="text-xl font-bold text-destructive mt-1">{formatCurrency(totalVencido)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pagos</p>
            <p className="text-xl font-bold text-success mt-1">{formatCurrency(totalPago)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)] mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Buscar por descrição ou pessoa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 h-10">
                <Filter size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-40 justify-start text-left font-normal h-10", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon size={14} className="mr-2" />
                  {dateFrom ? format(dateFrom, "dd/MM/yy") : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-40 justify-start text-left font-normal h-10", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon size={14} className="mr-2" />
                  {dateTo ? format(dateTo, "dd/MM/yy") : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <TabsContent value={tab} className="mt-0">
          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      { field: "vencimento" as SortField, label: "Vencimento" },
                      { field: "descricao" as SortField, label: "Descrição" },
                      { field: "pessoa" as SortField, label: tab === "receber" ? "Cliente" : "Fornecedor" },
                      { field: "valor" as SortField, label: "Valor", align: "right" },
                      { field: "status" as SortField, label: "Status", align: "center" },
                    ].map((col) => (
                      <th key={col.field} onClick={() => handleSort(col.field)} className={cn(
                        "text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-foreground transition-colors select-none",
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                      )}>
                        <span className="inline-flex items-center gap-1.5">{col.label}<SortIcon field={col.field} /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const sc = statusConfig[l.status];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-foreground whitespace-nowrap">
                          {new Date(l.vencimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground">{l.descricao}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{l.pessoa}</td>
                        <td className={`px-5 py-3.5 text-sm font-mono text-right font-medium ${tab === "receber" ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(l.valor)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.style}`}>
                            <StatusIcon size={12} />
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum lançamento encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              {filtered.length} lançamentos
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Lancamentos;
