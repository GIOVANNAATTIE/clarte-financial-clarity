import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { initialClientesFornecedores, type ClienteFornecedor } from "@/data/cadastros";

const ClientesFornecedores = () => {
  const allItems = initialClientesFornecedores;

  // Clientes state
  const [clientes, setClientes] = useState<ClienteFornecedor[]>(allItems.filter(i => i.tipo === "cliente"));
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<ClienteFornecedor | null>(null);
  const [clienteDeleteOpen, setClienteDeleteOpen] = useState(false);
  const [clienteDeleteId, setClienteDeleteId] = useState<number | null>(null);

  // Fornecedores state
  const [fornecedores, setFornecedores] = useState<ClienteFornecedor[]>(allItems.filter(i => i.tipo === "fornecedor"));
  const [fornecedorSearch, setFornecedorSearch] = useState("");
  const [fornecedorDialogOpen, setFornecedorDialogOpen] = useState(false);
  const [editFornecedor, setEditFornecedor] = useState<ClienteFornecedor | null>(null);
  const [fornecedorDeleteOpen, setFornecedorDeleteOpen] = useState(false);
  const [fornecedorDeleteId, setFornecedorDeleteId] = useState<number | null>(null);

  // Clientes handlers
  const handleNewCliente = () => { setEditCliente({ id: Date.now(), nome: "", tipo: "cliente", documento: "", contato: "" }); setClienteDialogOpen(true); };
  const handleEditCliente = (item: ClienteFornecedor) => { setEditCliente({ ...item }); setClienteDialogOpen(true); };
  const handleSaveCliente = () => {
    if (!editCliente || !editCliente.nome.trim()) return;
    setClientes(prev => prev.some(i => i.id === editCliente.id) ? prev.map(i => i.id === editCliente.id ? editCliente : i) : [...prev, editCliente]);
    setClienteDialogOpen(false); setEditCliente(null);
  };
  const confirmDeleteCliente = () => {
    if (clienteDeleteId !== null) setClientes(prev => prev.filter(i => i.id !== clienteDeleteId));
    setClienteDeleteOpen(false); setClienteDeleteId(null);
  };

  // Fornecedores handlers
  const handleNewFornecedor = () => { setEditFornecedor({ id: Date.now(), nome: "", tipo: "fornecedor", documento: "", contato: "" }); setFornecedorDialogOpen(true); };
  const handleEditFornecedor = (item: ClienteFornecedor) => { setEditFornecedor({ ...item }); setFornecedorDialogOpen(true); };
  const handleSaveFornecedor = () => {
    if (!editFornecedor || !editFornecedor.nome.trim()) return;
    setFornecedores(prev => prev.some(i => i.id === editFornecedor.id) ? prev.map(i => i.id === editFornecedor.id ? editFornecedor : i) : [...prev, editFornecedor]);
    setFornecedorDialogOpen(false); setEditFornecedor(null);
  };
  const confirmDeleteFornecedor = () => {
    if (fornecedorDeleteId !== null) setFornecedores(prev => prev.filter(i => i.id !== fornecedorDeleteId));
    setFornecedorDeleteOpen(false); setFornecedorDeleteId(null);
  };

  const filteredClientes = clientes.filter(i => i.nome.toLowerCase().includes(clienteSearch.toLowerCase()));
  const filteredFornecedores = fornecedores.filter(i => i.nome.toLowerCase().includes(fornecedorSearch.toLowerCase()));

  const renderTable = (items: ClienteFornecedor[], onEdit: (i: ClienteFornecedor) => void, onDelete: (id: number) => void, setDeleteId: (id: number) => void, setDeleteOpen: (v: boolean) => void, label: string) => (
    <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Nome</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center hidden md:table-cell">Documento</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center hidden md:table-cell">Contato</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-sm text-foreground">{item.nome}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{item.documento}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{item.contato}</td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}><Trash2 size={14} /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        {items.length} {label} encontrados
      </div>
    </div>
  );

  const renderDialog = (open: boolean, setOpen: (v: boolean) => void, editItem: ClienteFornecedor | null, setEditItem: (i: ClienteFornecedor | null) => void, items: ClienteFornecedor[], onSave: () => void, tipo: string) => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editItem && items.some(i => i.id === editItem.id) ? "Editar" : "Novo"} {tipo}</DialogTitle></DialogHeader>
        {editItem && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={editItem.nome} onChange={e => setEditItem({ ...editItem, nome: e.target.value })} /></div>
            <div className="space-y-2"><Label>Documento (CNPJ/CPF)</Label><Input value={editItem.documento} onChange={e => setEditItem({ ...editItem, documento: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contato</Label><Input value={editItem.contato} onChange={e => setEditItem({ ...editItem, contato: e.target.value })} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={onSave}>Salvar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const renderDeleteDialog = (open: boolean, setOpen: (v: boolean) => void, onConfirm: () => void, tipo: string) => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Excluir {tipo}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este registro?</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Excluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Clientes / Fornecedores</h1>

      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)] flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input placeholder="Buscar por nome..." value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
              </div>
            </div>
            <Button variant="hero" size="lg" className="gap-2" onClick={handleNewCliente}>
              <Plus size={18} /> Novo Cliente
            </Button>
          </div>
          {renderTable(filteredClientes, handleEditCliente, confirmDeleteCliente, setClienteDeleteId, setClienteDeleteOpen, "clientes")}
        </TabsContent>

        {/* Fornecedores Tab */}
        <TabsContent value="fornecedores" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)] flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input placeholder="Buscar por nome..." value={fornecedorSearch} onChange={e => setFornecedorSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
              </div>
            </div>
            <Button variant="hero" size="lg" className="gap-2" onClick={handleNewFornecedor}>
              <Plus size={18} /> Novo Fornecedor
            </Button>
          </div>
          {renderTable(filteredFornecedores, handleEditFornecedor, confirmDeleteFornecedor, setFornecedorDeleteId, setFornecedorDeleteOpen, "fornecedores")}
        </TabsContent>
      </Tabs>

      {/* Clientes Dialogs */}
      {renderDialog(clienteDialogOpen, setClienteDialogOpen, editCliente, setEditCliente, clientes, handleSaveCliente, "Cliente")}
      {renderDeleteDialog(clienteDeleteOpen, setClienteDeleteOpen, confirmDeleteCliente, "Cliente")}

      {/* Fornecedores Dialogs */}
      {renderDialog(fornecedorDialogOpen, setFornecedorDialogOpen, editFornecedor, setEditFornecedor, fornecedores, handleSaveFornecedor, "Fornecedor")}
      {renderDeleteDialog(fornecedorDeleteOpen, setFornecedorDeleteOpen, confirmDeleteFornecedor, "Fornecedor")}
    </div>
  );
};

export default ClientesFornecedores;
