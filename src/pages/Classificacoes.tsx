import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";
import { useToast } from "@/hooks/use-toast";

type Categoria = { id: string; name: string; type: string };
type CentroCusto = { id: string; name: string; description: string | null };

const Classificacoes = () => {
  const { toast } = useToast();
  const { selectedClient } = useClient();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catSearch, setCatSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<{ id?: string; name: string; type: string } | null>(null);
  const [catDeleteOpen, setCatDeleteOpen] = useState(false);
  const [catDeleteId, setCatDeleteId] = useState<string | null>(null);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [bulkCatDeleteOpen, setBulkCatDeleteOpen] = useState(false);

  const [centros, setCentros] = useState<CentroCusto[]>([]);
  const [ccSearch, setCcSearch] = useState("");
  const [ccDialogOpen, setCcDialogOpen] = useState(false);
  const [editCc, setEditCc] = useState<{ id?: string; name: string; description: string } | null>(null);
  const [ccDeleteOpen, setCcDeleteOpen] = useState(false);
  const [ccDeleteId, setCcDeleteId] = useState<string | null>(null);
  const [selectedCcs, setSelectedCcs] = useState<Set<string>>(new Set());
  const [bulkCcDeleteOpen, setBulkCcDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const companyId = selectedClient?.id;
      let catQ = supabase.from("categories").select("id, name, type").eq("user_id", user.id).order("name");
      let ccQ = supabase.from("cost_centers").select("id, name, description").eq("user_id", user.id).order("name");
      if (companyId) { catQ = catQ.eq("company_id", companyId); ccQ = ccQ.eq("company_id", companyId); }
      const [catRes, ccRes] = await Promise.all([catQ, ccQ]);
      if (catRes.data) setCategorias(catRes.data);
      if (ccRes.data) setCentros(ccRes.data);
    };
    fetchData();
  }, [selectedClient?.id]);

  const refreshCats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let q = supabase.from("categories").select("id, name, type").eq("user_id", user.id).order("name");
    if (selectedClient?.id) q = q.eq("company_id", selectedClient.id);
    const { data } = await q;
    if (data) setCategorias(data);
  };

  const refreshCcs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let q = supabase.from("cost_centers").select("id, name, description").eq("user_id", user.id).order("name");
    if (selectedClient?.id) q = q.eq("company_id", selectedClient.id);
    const { data } = await q;
    if (data) setCentros(data);
  };

  // Categoria handlers
  const handleSaveCat = async () => {
    if (!editCat || !editCat.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editCat.id) {
      const { error } = await supabase.from("categories").update({ name: editCat.name, type: editCat.type }).eq("id", editCat.id);
      if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
      toast({ title: "Categoria atualizada" });
    } else {
      const { error } = await supabase.from("categories").insert({ user_id: user.id, name: editCat.name, type: editCat.type, ...(selectedClient?.id ? { company_id: selectedClient.id } : {}) });
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      toast({ title: "Categoria criada" });
    }
    setCatDialogOpen(false); setEditCat(null);
    await refreshCats();
  };

  const confirmDeleteCat = async () => {
    if (!catDeleteId) return;
    const { error } = await supabase.from("categories").delete().eq("id", catDeleteId);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Categoria excluída" });
    setCategorias(prev => prev.filter(i => i.id !== catDeleteId));
    setCatDeleteOpen(false); setCatDeleteId(null);
  };

  const confirmBulkDeleteCat = async () => {
    const ids = Array.from(selectedCats);
    const { error } = await supabase.from("categories").delete().in("id", ids);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: `${ids.length} categoria(s) excluída(s)` });
    setCategorias(prev => prev.filter(i => !ids.includes(i.id)));
    setSelectedCats(new Set());
    setBulkCatDeleteOpen(false);
  };

  // Centro de Custo handlers
  const handleSaveCc = async () => {
    if (!editCc || !editCc.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editCc.id) {
      const { error } = await supabase.from("cost_centers").update({ name: editCc.name, description: editCc.description || null }).eq("id", editCc.id);
      if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
      toast({ title: "Centro de custo atualizado" });
    } else {
      const { error } = await supabase.from("cost_centers").insert({ user_id: user.id, name: editCc.name, description: editCc.description || null, ...(selectedClient?.id ? { company_id: selectedClient.id } : {}) });
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      toast({ title: "Centro de custo criado" });
    }
    setCcDialogOpen(false); setEditCc(null);
    await refreshCcs();
  };

  const confirmDeleteCc = async () => {
    if (!ccDeleteId) return;
    const { error } = await supabase.from("cost_centers").delete().eq("id", ccDeleteId);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Centro de custo excluído" });
    setCentros(prev => prev.filter(i => i.id !== ccDeleteId));
    setCcDeleteOpen(false); setCcDeleteId(null);
  };

  const confirmBulkDeleteCc = async () => {
    const ids = Array.from(selectedCcs);
    const { error } = await supabase.from("cost_centers").delete().in("id", ids);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: `${ids.length} centro(s) excluído(s)` });
    setCentros(prev => prev.filter(i => !ids.includes(i.id)));
    setSelectedCcs(new Set());
    setBulkCcDeleteOpen(false);
  };

  const filteredCat = categorias.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(catSearch.toLowerCase());
    const matchTipo = tipoFilter === "todos" || i.type === tipoFilter;
    return matchSearch && matchTipo;
  });

  const filteredCc = centros.filter(i => i.name.toLowerCase().includes(ccSearch.toLowerCase()));

  const allCatsSelected = filteredCat.length > 0 && filteredCat.every(i => selectedCats.has(i.id));
  const allCcsSelected = filteredCc.length > 0 && filteredCc.every(i => selectedCcs.has(i.id));

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
            <div className="flex gap-2">
              {selectedCats.size > 0 && (
                <Button variant="destructive" size="lg" className="gap-2" onClick={() => setBulkCatDeleteOpen(true)}>
                  <Trash2 size={16} /> Excluir ({selectedCats.size})
                </Button>
              )}
              <Button variant="hero" size="lg" className="gap-2" onClick={() => { setEditCat({ name: "", type: "despesa" }); setCatDialogOpen(true); }}>
                <Plus size={18} /> Nova Categoria
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 w-10">
                      <Checkbox checked={allCatsSelected} onCheckedChange={v => {
                        if (v) setSelectedCats(new Set(filteredCat.map(i => i.id)));
                        else setSelectedCats(new Set());
                      }} />
                    </th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-left">Nome</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Tipo</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCat.map(item => (
                    <tr key={item.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${selectedCats.has(item.id) ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3.5">
                        <Checkbox checked={selectedCats.has(item.id)} onCheckedChange={v => {
                          const next = new Set(selectedCats);
                          if (v) next.add(item.id); else next.delete(item.id);
                          setSelectedCats(next);
                        }} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground">{item.name}</td>
                      <td className="px-5 py-3.5 text-sm text-center">
                        <span className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${item.type === "receita" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditCat({ id: item.id, name: item.name, type: item.type }); setCatDialogOpen(true); }}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setCatDeleteId(item.id); setCatDeleteOpen(true); }}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCat.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
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
            <div className="flex gap-2">
              {selectedCcs.size > 0 && (
                <Button variant="destructive" size="lg" className="gap-2" onClick={() => setBulkCcDeleteOpen(true)}>
                  <Trash2 size={16} /> Excluir ({selectedCcs.size})
                </Button>
              )}
              <Button variant="hero" size="lg" className="gap-2" onClick={() => { setEditCc({ name: "", description: "" }); setCcDialogOpen(true); }}>
                <Plus size={18} /> Novo Centro de Custo
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 w-10">
                      <Checkbox checked={allCcsSelected} onCheckedChange={v => {
                        if (v) setSelectedCcs(new Set(filteredCc.map(i => i.id)));
                        else setSelectedCcs(new Set());
                      }} />
                    </th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-left">Nome</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Descrição</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCc.map(item => (
                    <tr key={item.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${selectedCcs.has(item.id) ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3.5">
                        <Checkbox checked={selectedCcs.has(item.id)} onCheckedChange={v => {
                          const next = new Set(selectedCcs);
                          if (v) next.add(item.id); else next.delete(item.id);
                          setSelectedCcs(next);
                        }} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground">{item.name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground text-center">{item.description || "—"}</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditCc({ id: item.id, name: item.name, description: item.description || "" }); setCcDialogOpen(true); }}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setCcDeleteId(item.id); setCcDeleteOpen(true); }}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCc.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
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

      {/* Dialogs Categorias */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCat?.id ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
          {editCat && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={editCat.name} onChange={e => setEditCat({ ...editCat, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editCat.type} onValueChange={v => setEditCat({ ...editCat, type: v })}>
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
      <Dialog open={bulkCatDeleteOpen} onOpenChange={setBulkCatDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Categorias</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir {selectedCats.size} categoria(s)?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setBulkCatDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmBulkDeleteCat}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs Centros de Custo */}
      <Dialog open={ccDialogOpen} onOpenChange={setCcDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCc?.id ? "Editar" : "Novo"} Centro de Custo</DialogTitle></DialogHeader>
          {editCc && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={editCc.name} onChange={e => setEditCc({ ...editCc, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={editCc.description} onChange={e => setEditCc({ ...editCc, description: e.target.value })} /></div>
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
      <Dialog open={bulkCcDeleteOpen} onOpenChange={setBulkCcDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Centros de Custo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir {selectedCcs.size} centro(s) de custo?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setBulkCcDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmBulkDeleteCc}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classificacoes;
