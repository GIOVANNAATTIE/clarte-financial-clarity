import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown, Filter, Clock, CheckCircle2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useClient } from "@/contexts/ClientContext";

// Prefixes to strip from description
const DESCRIPTION_PREFIXES = [
  "PIX ENVIADO PARA ", "PIX RECEBIDO DE ",
  "PAGAMENTO DE BOLETO ", "PAGAMENTO DE CONTA / TRIBUTO ",
  "PAGAMENTO DE CONTA/TRIBUTO ",
  "TRANSFERENCIA ENVIADA PARA ", "TRANSFERENCIA RECEBIDA DE ",
  "TED ENVIADA PARA ", "TED RECEBIDA DE ",
  "DOC ENVIADO PARA ", "DOC RECEBIDO DE ",
];

function cleanDescription(raw: string | null): { main: string; detail: string } {
  if (!raw) return { main: "", detail: "" };
  let cleaned = raw;
  // Remove leading dashes
  cleaned = cleaned.replace(/^-+\s*/, "");
  const upper = cleaned.toUpperCase();
  for (const prefix of DESCRIPTION_PREFIXES) {
    if (upper.startsWith(prefix)) {
      return { main: cleaned.slice(prefix.length).trim(), detail: cleaned };
    }
  }
  return { main: cleaned, detail: "" };
}

type Lancamento = {
  id: string;
  tipo: string;
  descricao: string | null;
  entity_id: string | null;
  entity_name: string;
  categoria: string;
  category_id: string | null;
  centro_custo: string;
  cost_center_id: string | null;
  valor: number;
  vencimento: string;
  status: string;
};

type Entity = { id: string; name: string; type: string; default_category_id: string | null };
type Category = { id: string; name: string; type: string };
type CostCenter = { id: string; name: string };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const statusConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  aberto: { label: "Aberto", style: "bg-warning/10 text-warning", icon: Clock },
  pago: { label: "Pago", style: "bg-success/10 text-success", icon: CheckCircle2 },
  vencido: { label: "Vencido", style: "bg-destructive/10 text-destructive", icon: AlertCircle },
  pendente: { label: "Pendente", style: "bg-warning/10 text-warning", icon: Clock },
  conciliado: { label: "Conciliado", style: "bg-success/10 text-success", icon: CheckCircle2 },
};

type SortField = "entity_name" | "descricao" | "categoria" | "centro_custo" | "valor" | "status";
type SortDir = "asc" | "desc";

const Lancamentos = () => {
  const { selectedClient } = useClient();
  const companyId = selectedClient?.id;
  const [tab, setTab] = useState("receber");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortField, setSortField] = useState<SortField>("entity_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Lancamento | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New/edit form
  const [form, setForm] = useState({
    entity_id: "",
    descricao: "",
    category_id: "",
    cost_center_id: "",
    valor: "",
    vencimento: new Date().toISOString().split("T")[0],
    tipo: "receber",
    status: "pendente",
  });

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let txQ = supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
      let entQ = supabase.from("entities").select("id, name, type, default_category_id").eq("user_id", user.id);
      let catQ = supabase.from("categories").select("id, name, type").eq("user_id", user.id);
      let ccQ = supabase.from("cost_centers").select("id, name").eq("user_id", user.id);
      if (companyId) { txQ = txQ.eq("company_id", companyId); entQ = entQ.eq("company_id", companyId); catQ = catQ.eq("company_id", companyId); ccQ = ccQ.eq("company_id", companyId); }
      const [txRes, entRes, catRes, ccRes] = await Promise.all([txQ, entQ, catQ, ccQ]);
      if (entRes.data) setEntities(entRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (ccRes.data) setCostCenters(ccRes.data);
      if (txRes.data) {
        setLancamentos(txRes.data.map((t) => ({
          id: t.id,
          tipo: t.type === "entrada" ? "receber" : "pagar",
          descricao: t.description,
          entity_id: t.entity_id,
          entity_name: entRes.data?.find((e) => e.id === t.entity_id)?.name || "",
          categoria: catRes.data?.find((c) => c.id === t.category_id)?.name || "",
          category_id: t.category_id,
          centro_custo: ccRes.data?.find((cc) => cc.id === t.cost_center_id)?.name || "",
          cost_center_id: t.cost_center_id,
          valor: Math.abs(t.value),
          vencimento: t.date,
          status: t.status,
        })));
      }
    };
    fetchData();
  }, [companyId]);

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
    if (data) {
      setLancamentos(data.map((t) => ({
        id: t.id,
        tipo: t.type === "entrada" ? "receber" : "pagar",
        descricao: t.description,
        entity_id: t.entity_id,
        entity_name: entities.find((e) => e.id === t.entity_id)?.name || "",
        categoria: categories.find((c) => c.id === t.category_id)?.name || "",
        category_id: t.category_id,
        centro_custo: costCenters.find((cc) => cc.id === t.cost_center_id)?.name || "",
        cost_center_id: t.cost_center_id,
        valor: Math.abs(t.value),
        vencimento: t.date,
        status: t.status,
      })));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-gold" /> : <ArrowDown size={12} className="text-gold" />;
  };

  const filtered = lancamentos
    .filter((l) => {
      if ((tab === "receber" && l.tipo !== "receber") || (tab === "pagar" && l.tipo !== "pagar")) return false;
      const matchSearch = (l.descricao || "").toLowerCase().includes(search.toLowerCase()) || l.entity_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "todos" || l.status === statusFilter;
      const vDate = new Date(l.vencimento);
      const matchFrom = !dateFrom || vDate >= dateFrom;
      const matchTo = !dateTo || vDate <= dateTo;
      return matchSearch && matchStatus && matchFrom && matchTo;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "entity_name") cmp = a.entity_name.localeCompare(b.entity_name);
      else if (sortField === "descricao") cmp = (a.descricao || "").localeCompare(b.descricao || "");
      else if (sortField === "categoria") cmp = a.categoria.localeCompare(b.categoria);
      else if (sortField === "centro_custo") cmp = a.centro_custo.localeCompare(b.centro_custo);
      else if (sortField === "valor") cmp = a.valor - b.valor;
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPendente = filtered.filter(l => l.status === "pendente" || l.status === "aberto").reduce((s, l) => s + l.valor, 0);
  const totalVencido = filtered.filter(l => l.status === "vencido").reduce((s, l) => s + l.valor, 0);
  const totalPago = filtered.filter(l => l.status === "pago" || l.status === "conciliado").reduce((s, l) => s + l.valor, 0);

  const refreshClassifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [catRes, ccRes] = await Promise.all([
      supabase.from("categories").select("id, name, type").eq("user_id", user.id),
      supabase.from("cost_centers").select("id, name").eq("user_id", user.id),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (ccRes.data) setCostCenters(ccRes.data);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({
      entity_id: "",
      descricao: "",
      category_id: "",
      cost_center_id: "",
      valor: "",
      vencimento: new Date().toISOString().split("T")[0],
      tipo: tab,
      status: "pendente",
    });
    refreshClassifications();
    setDialogOpen(true);
  };

  const openEdit = (l: Lancamento) => {
    setEditItem(l);
    setForm({
      entity_id: l.entity_id || "",
      descricao: l.descricao || "",
      category_id: l.category_id || "",
      cost_center_id: l.cost_center_id || "",
      valor: l.valor.toString(),
      vencimento: l.vencimento,
      tipo: l.tipo,
      status: l.status,
    });
    refreshClassifications();
    setDialogOpen(true);
  };

  const handleEntityChange = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId);
    setForm((prev) => ({
      ...prev,
      entity_id: entityId,
      category_id: entity?.default_category_id || prev.category_id,
    }));
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const numericValue = parseFloat(form.valor) || 0;
    const type = form.tipo === "receber" ? "entrada" : "saida";
    const finalValue = type === "saida" ? -Math.abs(numericValue) : Math.abs(numericValue);

    const payload = {
      user_id: user.id,
      date: form.vencimento,
      description: form.descricao,
      entity_id: form.entity_id || null,
      category_id: form.category_id || null,
      cost_center_id: form.cost_center_id || null,
      value: finalValue,
      type,
      status: form.status,
    };

    if (editItem) {
      const { error } = await supabase.from("transactions").update(payload).eq("id", editItem.id);
      if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
      toast({ title: "Lançamento atualizado" });
    } else {
      const { error } = await supabase.from("transactions").insert(payload);
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      toast({ title: "Lançamento criado" });
    }
    setDialogOpen(false);
    await refresh();
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await supabase.from("transactions").delete().eq("id", deleteId);
      toast({ title: "Lançamento excluído" });
      await refresh();
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("todos");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = search || statusFilter !== "todos" || dateFrom || dateTo;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Lançamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Contas a pagar e a receber</p>
        </div>
        <Button variant="hero" size="lg" className="gap-2" onClick={openNew}>
          <Plus size={18} />
          Novo Lançamento
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="receber" className="flex-1 sm:flex-none gap-2">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar" className="flex-1 sm:flex-none gap-2">Contas a Pagar</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendente</p>
            <p className="text-xl font-bold text-warning mt-1">{formatCurrency(totalPendente)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidos</p>
            <p className="text-xl font-bold text-destructive mt-1">{formatCurrency(totalVencido)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pagos/Conciliados</p>
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="conciliado">Conciliado</SelectItem>
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
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-10" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        <TabsContent value={tab} className="mt-0">
          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      { field: "entity_name" as SortField, label: tab === "receber" ? "Cliente" : "Fornecedor" },
                      { field: "descricao" as SortField, label: "Descrição" },
                      { field: "categoria" as SortField, label: "Categoria" },
                      { field: "centro_custo" as SortField, label: "Centro de Custo" },
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
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const sc = statusConfig[l.status] || statusConfig.pendente;
                    const StatusIcon = sc.icon;
                    const { main: cleanedEntity } = cleanDescription(l.entity_name || null);
                    const { main: cleanedDesc, detail: descDetail } = cleanDescription(l.descricao);
                    return (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-foreground">{cleanedEntity || "—"}</td>
                        <td className="px-5 py-3.5 text-sm text-foreground">
                          <div>
                            <span className="font-medium">{cleanedDesc || "—"}</span>
                            {descDetail && <span className="block text-xs text-muted-foreground mt-0.5">{descDetail}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{l.categoria || "—"}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{l.centro_custo || "—"}</td>
                        <td className={`px-5 py-3.5 text-sm font-mono text-right font-medium ${tab === "receber" ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(l.valor)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.style}`}>
                            <StatusIcon size={12} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteId(l.id); setDeleteOpen(true); }}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum lançamento encontrado</td></tr>
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

      {/* New/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} Lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Cliente/Fornecedor</Label>
              <Select value={form.entity_id || "none"} onValueChange={(v) => handleEntityChange(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição do lançamento" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Centro de Custo <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Select value={form.cost_center_id || "none"} onValueChange={(v) => setForm({ ...form, cost_center_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receber">A Receber</SelectItem>
                    <SelectItem value="pagar">A Pagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="conciliado">Conciliado</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Lançamento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lancamentos;
