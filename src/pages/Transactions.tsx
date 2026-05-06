import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { parseOFX, type OFXTransaction } from "@/lib/ofxParser";
import { AlertTriangle, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Upload, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, CalendarIcon, FileText, MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Transaction = {
  id: string;
  date: string;
  description: string | null;
  category_id: string | null;
  cost_center_id: string | null;
  entity_id: string | null;
  value: number;
  type: string;
  status: string;
  category_name?: string;
  cost_center_name?: string;
  entity_name?: string;
};

type Entity = { id: string; name: string; type: string; default_category_id: string | null };
type Category = { id: string; name: string; type: string };
type CostCenter = { id: string; name: string };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const statusStyles: Record<string, string> = {
  conciliado: "bg-success/10 text-success",
  pendente: "bg-warning/10 text-warning",
  "revisão": "bg-destructive/10 text-destructive",
};

// Prefixes to strip from description to get a clean entity name
const DESCRIPTION_PREFIXES = [
  "PIX ENVIADO PARA ",
  "PIX RECEBIDO DE ",
  "PAGAMENTO DE BOLETO ",
  "PAGAMENTO DE CONTA / TRIBUTO ",
  "PAGAMENTO DE CONTA/TRIBUTO ",
  "TRANSFERENCIA ENVIADA PARA ",
  "TRANSFERENCIA RECEBIDA DE ",
  "TED ENVIADA PARA ",
  "TED RECEBIDA DE ",
  "DOC ENVIADO PARA ",
  "DOC RECEBIDO DE ",
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

type SortField = "date" | "description" | "category" | "costCenter" | "value" | "status";
type SortDir = "asc" | "desc";

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [costCenterFilter, setCostCenterFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [importOpen, setImportOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    entity_id: "",
    category_id: "",
    cost_center_id: "",
    value: "",
    type: "entrada",
    status: "pendente",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [txRes, entRes, catRes, ccRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("entities").select("id, name, type, default_category_id").eq("user_id", user.id),
        supabase.from("categories").select("id, name, type").eq("user_id", user.id),
        supabase.from("cost_centers").select("id, name").eq("user_id", user.id),
      ]);

      if (entRes.data) setEntities(entRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (ccRes.data) setCostCenters(ccRes.data);

      if (txRes.data) {
        const mapped = txRes.data.map((t) => ({
          ...t,
          entity_name: entRes.data?.find((e) => e.id === t.entity_id)?.name || "",
          category_name: catRes.data?.find((c) => c.id === t.category_id)?.name || "",
          cost_center_name: ccRes.data?.find((cc) => cc.id === t.cost_center_id)?.name || "",
        }));
        setTransactions(mapped);
      }
    };
    fetchData();
  }, []);

  const refreshTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
    if (data) {
      const mapped = data.map((t) => ({
        ...t,
        entity_name: entities.find((e) => e.id === t.entity_id)?.name || "",
        category_name: categories.find((c) => c.id === t.category_id)?.name || "",
        cost_center_name: costCenters.find((cc) => cc.id === t.cost_center_id)?.name || "",
      }));
      setTransactions(mapped);
    }
  };

   const handleOFXImport = async (file: File) => {
     setImporting(true);

     const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
     const accessToken = sessionData.session?.access_token;
     const userId = sessionData.session?.user?.id;

     if (sessionError || !accessToken || !userId) {
       toast({ title: "Usuário não identificado", description: "Faça login novamente para importar.", variant: "destructive" });
       setImporting(false);
       return;
     }

     const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
     if (userError || userData.user?.id !== userId) {
       toast({ title: "Sessão expirada", description: "Entre novamente para importar o arquivo OFX.", variant: "destructive" });
       setImporting(false);
       return;
     }

     const reader = new FileReader();
     reader.onload = async (e) => {
       try {
         const content = e.target?.result as string;
         const parsed = parseOFX(content);
 
         if (parsed.length === 0) {
           toast({ title: "Nenhuma transação encontrada", description: "O arquivo OFX não contém transações válidas.", variant: "destructive" });
           setImporting(false);
           return;
         }

        let created = 0;
        for (const ofx of parsed) {
          let entityId: string | null = null;
          const matchedEntity = entities.find((ent) =>
            ofx.description.toLowerCase().includes(ent.name.toLowerCase())
          );

          if (matchedEntity) {
            entityId = matchedEntity.id;
          } else {
            const entityType = ofx.type === "entrada" ? "cliente" : "fornecedor";
             const { data: newEntity, error: entityError } = await supabase.from("entities").insert({
               user_id: userId,
              name: ofx.description,
              type: entityType,
            }).select("id, name, type, default_category_id").single();
             if (entityError) throw entityError;
            if (newEntity) {
              entityId = newEntity.id;
              setEntities((prev) => [...prev, newEntity]);
            }
          }

          const value = ofx.type === "saida" ? -ofx.value : ofx.value;

           const { error: transactionError } = await supabase.from("transactions").insert({
            user_id: userId,
            date: ofx.date,
            description: ofx.description,
            value,
            type: ofx.type,
            entity_id: entityId,
            status: "pendente",
          });
           if (transactionError) throw transactionError;
          created++;
        }

        toast({
          title: `${created} transações importadas`,
          description: `Arquivo ${file.name} processado. Preencha Categoria e Centro de Custo dos itens pendentes.`,
        });
        setImportOpen(false);
        await refreshTransactions();
      } catch {
        toast({ title: "Erro ao processar arquivo", description: "Verifique se o arquivo é um OFX válido.", variant: "destructive" });
      }
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleOFXImport(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.ofx') || file.name.endsWith('.OFX'))) {
      handleOFXImport(file);
    } else {
      toast({ title: "Formato inválido", description: "Apenas arquivos .ofx são aceitos.", variant: "destructive" });
    }
  };

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

  const filtered = transactions
    .filter((t) => {
      const desc = (t.description || "").toLowerCase();
      const entName = (t.entity_name || "").toLowerCase();
      const matchSearch = desc.includes(search.toLowerCase()) || entName.includes(search.toLowerCase());
      const matchCategory = categoryFilter === "todas" || t.category_name === categoryFilter;
      const matchStatus = statusFilter === "todos" || t.status === statusFilter;
      const matchCostCenter = costCenterFilter === "todos" || t.cost_center_name === costCenterFilter;
      const tDate = new Date(t.date);
      const matchDateFrom = !dateFrom || tDate >= dateFrom;
      const matchDateTo = !dateTo || tDate <= dateTo;
      return matchSearch && matchCategory && matchStatus && matchCostCenter && matchDateFrom && matchDateTo;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "description") cmp = (a.description || "").localeCompare(b.description || "");
      else if (sortField === "category") cmp = (a.category_name || "").localeCompare(b.category_name || "");
      else if (sortField === "costCenter") cmp = (a.cost_center_name || "").localeCompare(b.cost_center_name || "");
      else if (sortField === "value") cmp = a.value - b.value;
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const categoryNames = [...new Set(transactions.map((t) => t.category_name).filter(Boolean))];
  const costCenterNames = [...new Set(transactions.map((t) => t.cost_center_name).filter(Boolean))];

  // Totals
  const totalEntradas = filtered.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0);
  const totalSaidas = filtered.filter(t => t.value < 0).reduce((s, t) => s + t.value, 0);
  const totalGeral = totalEntradas + totalSaidas;

  // Selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  };

  const handleBulkConciliar = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("transactions").update({ status: "conciliado" }).in("id", ids);
    if (error) {
      toast({ title: "Erro ao conciliar", variant: "destructive" });
    } else {
      toast({ title: `${ids.length} lançamento(s) conciliado(s)` });
      setSelectedIds(new Set());
      await refreshTransactions();
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // Check for conciliados
    const conciliadosCount = transactions.filter(t => ids.includes(t.id) && t.status === "conciliado").length;
    if (conciliadosCount > 0) {
      toast({
        title: "Exclusão bloqueada",
        description: `${conciliadosCount} lançamento(s) selecionado(s) já está(ão) conciliado(s) e não pode(m) ser excluído(s). Remova-os da seleção.`,
        variant: "destructive",
      });
      setBulkDeleteOpen(false);
      return;
    }

    const { error } = await supabase.from("transactions").delete().in("id", ids);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: `${ids.length} lançamento(s) excluído(s)` });
      setSelectedIds(new Set());
      await refreshTransactions();
    }
    setBulkDeleteOpen(false);
  };

  const handleEdit = (t: Transaction) => {
    setEditTransaction({ ...t });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTransaction) return;
    const { error } = await supabase.from("transactions").update({
      date: editTransaction.date,
      description: editTransaction.description,
      entity_id: editTransaction.entity_id || null,
      category_id: editTransaction.category_id || null,
      cost_center_id: editTransaction.cost_center_id || null,
      value: editTransaction.value,
      type: editTransaction.type,
      status: editTransaction.status,
    }).eq("id", editTransaction.id);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Lançamento atualizado" });
      setEditOpen(false);
      setEditTransaction(null);
      await refreshTransactions();
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const { error } = await supabase.from("transactions").delete().eq("id", deleteId);
      if (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      } else {
        toast({ title: "Lançamento excluído" });
        await refreshTransactions();
      }
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const handleNewSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const numericValue = parseFloat(newTransaction.value) || 0;
    const finalValue = newTransaction.type === "saida" ? -Math.abs(numericValue) : Math.abs(numericValue);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      date: newTransaction.date,
      description: newTransaction.description,
      entity_id: newTransaction.entity_id || null,
      category_id: newTransaction.category_id || null,
      cost_center_id: newTransaction.cost_center_id || null,
      value: finalValue,
      type: newTransaction.type,
      status: newTransaction.status,
    });
    if (error) {
      toast({ title: "Erro ao criar lançamento", variant: "destructive" });
    } else {
      toast({ title: "Lançamento criado" });
      setNewOpen(false);
      setNewTransaction({ date: new Date().toISOString().split("T")[0], description: "", entity_id: "", category_id: "", cost_center_id: "", value: "", type: "entrada", status: "pendente" });
      await refreshTransactions();
    }
  };

  const handleEntityChangeNew = (entityId: string) => {
    setNewTransaction((prev) => {
      const entity = entities.find((e) => e.id === entityId);
      return {
        ...prev,
        entity_id: entityId,
        type: entity?.type === "cliente" ? "entrada" : "saida",
        category_id: entity?.default_category_id || prev.category_id,
      };
    });
  };

  const handleEntityChangeEdit = (entityId: string) => {
    if (!editTransaction) return;
    const entity = entities.find((e) => e.id === entityId);
    setEditTransaction({
      ...editTransaction,
      entity_id: entityId,
      type: entity?.type === "cliente" ? "entrada" : "saida",
      category_id: entity?.default_category_id || editTransaction.category_id,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("todas");
    setStatusFilter("todos");
    setCostCenterFilter("todos");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = dateFrom || dateTo || categoryFilter !== "todas" || statusFilter !== "todos" || costCenterFilter !== "todos" || search;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Movimentação</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setNewOpen(true)}>
            <Plus size={16} /> Novo Lançamento
          </Button>
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg" className="gap-2">
                <Upload size={18} />
                Importar OFX
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Importar Extrato OFX</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gold bg-gold/5">
                  <FileText size={28} className="text-gold" />
                  <div>
                    <span className="text-sm font-medium">Arquivo OFX</span>
                    <p className="text-[10px] text-muted-foreground">Formato padrão bancário</p>
                  </div>
                </div>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-gold/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <input ref={fileInputRef} type="file" accept=".ofx" className="hidden" onChange={handleFileSelect} />
                  <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">Arraste o arquivo ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Aceita arquivos .ofx</p>
                </div>
                <Button className="w-full" disabled={importing} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} className="mr-2" />
                  {importing ? "Processando..." : "Selecionar Arquivo OFX"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selecionado(s)</span>
          <Button size="sm" className="gap-2" onClick={handleBulkConciliar}>
            <CheckSquare size={14} /> Marcar como Conciliado
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Limpar seleção</Button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Buscar por descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-44 h-10">
                <Filter size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Categorias</SelectItem>
                {categoryNames.map((c) => (
                  <SelectItem key={c} value={c!}>{c}</SelectItem>
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
                {costCenterNames.map((c) => (
                  <SelectItem key={c} value={c!}>{c}</SelectItem>
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
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-10" onClick={clearFilters}>
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
                <th className="px-3 py-3 w-10">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                {[
                  { field: "date" as SortField, label: "Data" },
                  { field: "description" as SortField, label: "Descrição" },
                  { field: "category" as SortField, label: "Categoria" },
                  { field: "costCenter" as SortField, label: "Centro de Custo", hideOnMobile: true },
                  { field: "value" as SortField, label: "Valor" },
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
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const { main, detail } = cleanDescription(t.description);
                return (
                  <tr key={t.id} className={cn("border-b border-border/50 hover:bg-muted/20 transition-colors", selectedIds.has(t.id) && "bg-primary/5")}>
                    <td className="px-3 py-3.5">
                      <Checkbox
                        checked={selectedIds.has(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">
                      <div>
                        <span className="font-medium">{main}</span>
                        {detail && <span className="block text-xs text-muted-foreground mt-0.5">{detail}</span>}
                        {!detail && t.entity_name && <span className="block text-xs text-muted-foreground">{t.entity_name}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {t.category_name ? t.category_name : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning">
                          <AlertTriangle size={12} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                      {t.cost_center_name ? t.cost_center_name : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-mono font-medium whitespace-nowrap text-center ${t.value >= 0 ? "text-success" : "text-destructive"}`}>
                      {t.value < 0 ? "- " : ""}{formatCurrency(Math.abs(t.value))}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${statusStyles[t.status] || "bg-muted text-muted-foreground"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(t)} className="gap-2">
                            <Pencil size={14} /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(t.id)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 size={14} /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum lançamento encontrado</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                  <td colSpan={5} className="px-5 py-3 text-sm text-foreground hidden lg:table-cell">
                    <div className="flex gap-6">
                      <span>Entradas: <span className="text-success font-mono">{formatCurrency(totalEntradas)}</span></span>
                      <span>Saídas: <span className="text-destructive font-mono">{formatCurrency(Math.abs(totalSaidas))}</span></span>
                    </div>
                  </td>
                  <td colSpan={5} className="px-5 py-3 text-sm text-foreground table-cell lg:hidden">
                    <div className="flex flex-col gap-1">
                      <span>Entradas: <span className="text-success font-mono">{formatCurrency(totalEntradas)}</span></span>
                      <span>Saídas: <span className="text-destructive font-mono">{formatCurrency(Math.abs(totalSaidas))}</span></span>
                    </div>
                  </td>
                  <td className={`px-5 py-3 text-sm font-mono text-center ${totalGeral >= 0 ? "text-success" : "text-destructive"}`}>
                    {totalGeral < 0 ? "- " : ""}{formatCurrency(Math.abs(totalGeral))}
                  </td>
                  <td className="hidden lg:table-cell"></td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} lançamentos encontrados
        </div>
      </div>

      {/* New Transaction Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newTransaction.date} onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newTransaction.type} onValueChange={(v) => setNewTransaction({ ...newTransaction, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente/Fornecedor</Label>
              <Select value={newTransaction.entity_id || "none"} onValueChange={(v) => handleEntityChangeNew(v === "none" ? "" : v)}>
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
              <Input value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} placeholder="Descrição do lançamento" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newTransaction.category_id || "none"} onValueChange={(v) => setNewTransaction({ ...newTransaction, category_id: v === "none" ? "" : v })}>
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
                <Select value={newTransaction.cost_center_id || "none"} onValueChange={(v) => setNewTransaction({ ...newTransaction, cost_center_id: v === "none" ? "" : v })}>
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
                <Label>Valor (sempre positivo)</Label>
                <Input type="number" step="0.01" min="0" value={newTransaction.value} onChange={(e) => setNewTransaction({ ...newTransaction, value: e.target.value })} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newTransaction.status} onValueChange={(v) => setNewTransaction({ ...newTransaction, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="conciliado">Conciliado</SelectItem>
                    <SelectItem value="revisão">Revisão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
              <Button onClick={handleNewSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
          {editTransaction && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={editTransaction.date} onChange={(e) => setEditTransaction({ ...editTransaction, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={editTransaction.type} onValueChange={(v) => setEditTransaction({ ...editTransaction, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cliente/Fornecedor</Label>
                <Select value={editTransaction.entity_id || "none"} onValueChange={(v) => handleEntityChangeEdit(v === "none" ? "" : v)}>
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
                <Input value={editTransaction.description || ""} onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={editTransaction.category_id || "none"} onValueChange={(v) => setEditTransaction({ ...editTransaction, category_id: v === "none" ? "" : v })}>
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
                  <Select value={editTransaction.cost_center_id || "none"} onValueChange={(v) => setEditTransaction({ ...editTransaction, cost_center_id: v === "none" ? "" : v })}>
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
                  <Input type="number" step="0.01" value={Math.abs(editTransaction.value)} onChange={(e) => {
                    const absVal = Math.abs(parseFloat(e.target.value) || 0);
                    setEditTransaction({ ...editTransaction, value: editTransaction.type === "saida" ? -absVal : absVal });
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editTransaction.status} onValueChange={(v) => setEditTransaction({ ...editTransaction, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conciliado">Conciliado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="revisão">Revisão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Lançamento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
