import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Building2, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const SelectClient = () => {
  const { clients, selectClient, fetchClients, addClient, deleteClient, loading } = useClient();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", cnpj: "", segment: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search) ||
      c.segment.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (client: typeof clients[0]) => {
    selectClient(client);
    navigate("/dashboard");
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await addClient(form.name, form.cnpj, form.segment);
    setForm({ name: "", cnpj: "", segment: "" });
    setNewOpen(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    await deleteClient(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <img src={logo} alt="Clarté Consultoria" className="h-32 mx-auto mb-4" />
          <h2 className="font-heading text-xl text-foreground">Olá, <span className="font-bold">Administrador</span></h2>
          <p className="text-sm text-muted-foreground mt-1">Selecione a empresa que deseja acessar</p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-elevated)] border border-border/50">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por nome, CNPJ ou segmento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background/50"
              />
            </div>
            <Button variant="hero" size="default" className="gap-2" onClick={() => setNewOpen(true)}>
              <Plus size={16} /> Nova Empresa
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-gold/50 hover:bg-gold/5 transition-all duration-200 text-left group"
                >
                  <button
                    onClick={() => handleSelect(client)}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left"
                  >
                    <div className="p-2.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <Building2 className="text-primary" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm text-foreground truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.cnpj ? `${client.cnpj} · ` : ""}{client.segment || "Sem segmento"}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-gold transition-colors" />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(client.id); setDeleteOpen(true); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {clients.length === 0 ? "Nenhuma empresa cadastrada. Crie uma para começar." : "Nenhum resultado encontrado"}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Clarté · Todos os direitos reservados
        </p>
      </div>

      {/* New Company Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Razão Social ou Nome Fantasia" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
            </div>
            <div className="space-y-2">
              <Label>Segmento <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} placeholder="Ex: Tecnologia, Saúde..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={saving || !form.name.trim()}>
                {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Criar Empresa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Empresa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza? Isso apagará todos os dados da empresa (transações, clientes, categorias e centros de custo). Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectClient;
