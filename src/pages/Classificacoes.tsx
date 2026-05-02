import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { initialCategorias, initialCentrosCusto, type Categoria, type CentroCusto } from "@/data/cadastros";

type Classificacao = {
  id: number;
  nome: string;
  classificacao: "categoria" | "centro-custo";
  subtipo?: string; // receita/despesa para categorias
  descricao?: string; // para centros de custo
};

const buildItems = (): Classificacao[] => {
  const cats: Classificacao[] = initialCategorias.map(c => ({
    id: c.id,
    nome: c.nome,
    classificacao: "categoria",
    subtipo: c.tipo,
  }));
  const ccs: Classificacao[] = initialCentrosCusto.map(cc => ({
    id: cc.id + 10000,
    nome: cc.nome,
    classificacao: "centro-custo",
    descricao: cc.descricao,
  }));
  return [...cats, ...ccs];
};

const Classificacoes = () => {
  const [items, setItems] = useState<Classificacao[]>(buildItems);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Classificacao | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const emptyItem: Classificacao = { id: 0, nome: "", classificacao: "categoria", subtipo: "despesa", descricao: "" };

  const handleNew = () => { setEditItem({ ...emptyItem, id: Date.now() }); setDialogOpen(true); };
  const handleEdit = (item: Classificacao) => { setEditItem({ ...item }); setDialogOpen(true); };
  const handleSave = () => {
    if (!editItem || !editItem.nome.trim()) return;
    setItems(prev => prev.some(i => i.id === editItem.id) ? prev.map(i => i.id === editItem.id ? editItem : i) : [...prev, editItem]);
    setDialogOpen(false); setEditItem(null);
  };
  const confirmDelete = () => {
    if (deleteId !== null) setItems(prev => prev.filter(i => i.id !== deleteId));
    setDeleteOpen(false); setDeleteId(null);
  };

  const filtered = items.filter(i => {
    const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === "todos" || i.classificacao === tipoFilter;
    return matchSearch && matchTipo;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">Classificações</h1>
        <Button variant="hero" size="lg" className="gap-2" onClick={handleNew}>
          <Plus size={18} /> Nova Classificação
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="categoria">Categorias</SelectItem>
              <SelectItem value="centro-custo">Centros de Custo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Nome</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Tipo</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center hidden md:table-cell">Detalhe</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground">{item.nome}</td>
                  <td className="px-5 py-3.5 text-sm text-center">
                    <span className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${item.classificacao === "categoria" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {item.classificacao === "categoria" ? "Categoria" : "Centro de Custo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground text-center hidden md:table-cell">
                    {item.classificacao === "categoria" ? (
                      <span className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${item.subtipo === "receita" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {item.subtipo}
                      </span>
                    ) : (
                      item.descricao || "—"
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} registros encontrados
        </div>
      </div>

      {/* Edit/New Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItem && items.some(i => i.id === editItem.id) ? "Editar" : "Nova"} Classificação</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={editItem.nome} onChange={e => setEditItem({ ...editItem, nome: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editItem.classificacao} onValueChange={v => setEditItem({ ...editItem, classificacao: v as "categoria" | "centro-custo" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="categoria">Categoria</SelectItem>
                    <SelectItem value="centro-custo">Centro de Custo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editItem.classificacao === "categoria" && (
                <div className="space-y-2">
                  <Label>Subtipo</Label>
                  <Select value={editItem.subtipo || "despesa"} onValueChange={v => setEditItem({ ...editItem, subtipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editItem.classificacao === "centro-custo" && (
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={editItem.descricao || ""} onChange={e => setEditItem({ ...editItem, descricao: e.target.value })} />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Classificação</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este registro?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classificacoes;
