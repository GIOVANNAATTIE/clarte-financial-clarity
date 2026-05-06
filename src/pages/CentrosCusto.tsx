import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useClient } from "@/contexts/ClientContext";

type CentroCusto = { id: string; name: string; description: string | null };

const CentrosCusto = () => {
  const { toast } = useToast();
  const { selectedClient } = useClient();
  const [items, setItems] = useState<CentroCusto[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<{ id?: string; name: string; description: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from("cost_centers").select("id, name, description").eq("user_id", user.id).order("name");
    if (selectedClient) query = query.eq("company_id", selectedClient.id);
    const { data } = await query;
    if (data) setItems(data);
  };

  useEffect(() => { fetchItems(); }, [selectedClient]);

  const handleNew = () => { setEditItem({ name: "", description: "" }); setDialogOpen(true); };
  const handleEdit = (item: CentroCusto) => { setEditItem({ id: item.id, name: item.name, description: item.description || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editItem || !editItem.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editItem.id) {
      const { error } = await supabase.from("cost_centers").update({ name: editItem.name, description: editItem.description || null }).eq("id", editItem.id);
      if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
      toast({ title: "Centro de custo atualizado" });
    } else {
      const payload: Record<string, unknown> = { user_id: user.id, name: editItem.name, description: editItem.description || null };
      if (selectedClient) payload.company_id = selectedClient.id;
      const { error } = await supabase.from("cost_centers").insert(payload as any);
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      toast({ title: "Centro de custo criado" });
    }
    setDialogOpen(false); setEditItem(null);
    fetchItems();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("cost_centers").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Centro de custo excluído" });
    setItems(prev => prev.filter(i => i.id !== deleteId));
    setDeleteOpen(false); setDeleteId(null);
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">Centros de Custo</h1>
        <Button variant="hero" size="lg" className="gap-2" onClick={handleNew}>
          <Plus size={18} /> Novo Centro de Custo
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
        </div>
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
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground">{item.name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{item.description || "—"}</td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} centros de custo encontrados
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItem?.id ? "Editar" : "Novo"} Centro de Custo</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Centro de Custo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este centro de custo?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CentrosCusto;
