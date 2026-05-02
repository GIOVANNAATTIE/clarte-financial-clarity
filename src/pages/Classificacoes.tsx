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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { initialCategorias, initialCentrosCusto, type Categoria, type CentroCusto } from "@/data/cadastros";

const Classificacoes = () => {
  // Categorias state
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [catSearch, setCatSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Categoria | null>(null);
  const [catDeleteOpen, setCatDeleteOpen] = useState(false);
  const [catDeleteId, setCatDeleteId] = useState<number | null>(null);

  // Centros de Custo state
  const [centros, setCentros] = useState<CentroCusto[]>(initialCentrosCusto);
  const [ccSearch, setCcSearch] = useState("");
  const [ccDialogOpen, setCcDialogOpen] = useState(false);
  const [editCc, setEditCc] = useState<CentroCusto | null>(null);
  const [ccDeleteOpen, setCcDeleteOpen] = useState(false);
  const [ccDeleteId, setCcDeleteId] = useState<number | null>(null);

  // Categorias handlers
  const handleNewCat = () => { setEditCat({ id: Date.now(), nome: "", tipo: "despesa" }); setCatDialogOpen(true); };
  const handleEditCat = (item: Categoria) => { setEditCat({ ...item }); setCatDialogOpen(true); };
  const handleSaveCat = () => {
    if (!editCat || !editCat.nome.trim()) return;
    setCategorias(prev => prev.some(i => i.id === editCat.id) ? prev.map(i => i.id === editCat.id ? editCat : i) : [...prev, editCat]);
    setCatDialogOpen(false); setEditCat(null);
  };
  const confirmDeleteCat = () => {
    if (catDeleteId !== null) setCategorias(prev => prev.filter(i => i.id !== catDeleteId));
    setCatDeleteOpen(false); setCatDeleteId(null);
  };

  // Centros de Custo handlers
  const handleNewCc = () => { setEditCc({ id: Date.now(), nome: "", descricao: "" }); setCcDialogOpen(true); };
  const handleEditCc = (item: CentroCusto) => { setEditCc({ ...item }); setCcDialogOpen(true); };
  const handleSaveCc = () => {
    if (!editCc || !editCc.nome.trim()) return;
    setCentros(prev => prev.some(i => i.id === editCc.id) ? prev.map(i => i.id === editCc.id ? editCc : i) : [...prev, editCc]);
    setCcDialogOpen(false); setEditCc(null);
  };
  const confirmDeleteCc = () => {
    if (ccDeleteId !== null) setCentros(prev => prev.filter(i => i.id !== ccDeleteId));
    setCcDeleteOpen(false); setCcDeleteId(null);
  };

  const filteredCat = categorias.filter(i => {
    const matchSearch = i.nome.toLowerCase().includes(catSearch.toLowerCase());
    const matchTipo = tipoFilter === "todos" || i.tipo === tipoFilter;
    return matchSearch && matchTipo;
  });

  const filteredCc = centros.filter(i => i.nome.toLowerCase().includes(ccSearch.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Classificações</h1>

      <Tabs defaultValue="categorias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="centros-custo">Centros de Custo</TabsTrigger>
        </TabsList>

        {/* Categorias Tab */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)] flex-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input placeholder="Buscar por nome..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
                </div>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="hero" size="lg" className="gap-2" onClick={handleNewCat}>
              <Plus size={18} /> Nova Categoria
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Nome</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Tipo</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCat.map(item => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-foreground">{item.nome}</td>
                      <td className="px-5 py-3.5 text-sm text-center">
                        <span className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${item.tipo === "receita" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCat(item)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setCatDeleteId(item.id); setCatDeleteOpen(true); }}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCat.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              {filteredCat.length} categorias encontradas
            </div>
          </div>
        </TabsContent>

        {/* Centros de Custo Tab */}
        <TabsContent value="centros-custo" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)] flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input placeholder="Buscar por nome..." value={ccSearch} onChange={e => setCcSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
              </div>
            </div>
            <Button variant="hero" size="lg" className="gap-2" onClick={handleNewCc}>
              <Plus size={18} /> Novo Centro de Custo
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Nome</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Descrição</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCc.map(item => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-foreground">{item.nome}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{item.descricao}</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCc(item)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setCcDeleteId(item.id); setCcDeleteOpen(true); }}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCc.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              {filteredCc.length} centros de custo encontrados
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Categoria Dialogs */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCat && categorias.some(i => i.id === editCat.id) ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
          {editCat && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={editCat.nome} onChange={e => setEditCat({ ...editCat, nome: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editCat.tipo} onValueChange={v => setEditCat({ ...editCat, tipo: v as "receita" | "despesa" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveCat}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={catDeleteOpen} onOpenChange={setCatDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Categoria</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir esta categoria?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCatDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteCat}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Centro de Custo Dialogs */}
      <Dialog open={ccDialogOpen} onOpenChange={setCcDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCc && centros.some(i => i.id === editCc.id) ? "Editar" : "Novo"} Centro de Custo</DialogTitle></DialogHeader>
          {editCc && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={editCc.nome} onChange={e => setEditCc({ ...editCc, nome: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={editCc.descricao} onChange={e => setEditCc({ ...editCc, descricao: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setCcDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveCc}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={ccDeleteOpen} onOpenChange={setCcDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Centro de Custo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este centro de custo?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCcDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteCc}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classificacoes;
