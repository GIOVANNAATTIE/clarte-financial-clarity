import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Search, Loader2, MapPin, Building2, Key, Tag } from "lucide-react";
import { initialClientesFornecedores, type ClienteFornecedor } from "@/data/cadastros";
import { initialCategorias } from "@/data/cadastros";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type CategoryOption = { id: number; nome: string; tipo: string };

const emptyEntity = (tipo: "cliente" | "fornecedor"): ClienteFornecedor => ({
  id: Date.now(),
  nome: "",
  tipo,
  documento: "",
  contato: "",
  email: "",
  telefone: "",
  cep: "",
  endereco: "",
  bairro: "",
  cidade: "",
  estado: "",
  banco: "",
  agencia: "",
  conta: "",
  tipoConta: "",
  chavePix: "",
  categoriaPadrao: "",
});

const ClientesFornecedores = () => {
  const allItems = initialClientesFornecedores;
  const { toast } = useToast();

  const [clientes, setClientes] = useState<ClienteFornecedor[]>(allItems.filter(i => i.tipo === "cliente"));
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<ClienteFornecedor | null>(null);
  const [clienteDeleteOpen, setClienteDeleteOpen] = useState(false);
  const [clienteDeleteId, setClienteDeleteId] = useState<number | null>(null);

  const [fornecedores, setFornecedores] = useState<ClienteFornecedor[]>(allItems.filter(i => i.tipo === "fornecedor"));
  const [fornecedorSearch, setFornecedorSearch] = useState("");
  const [fornecedorDialogOpen, setFornecedorDialogOpen] = useState(false);
  const [editFornecedor, setEditFornecedor] = useState<ClienteFornecedor | null>(null);
  const [fornecedorDeleteOpen, setFornecedorDeleteOpen] = useState(false);
  const [fornecedorDeleteId, setFornecedorDeleteId] = useState<number | null>(null);

  const [cepLoading, setCepLoading] = useState(false);
  

  // ViaCEP lookup
  const fetchCep = async (cep: string, setItem: (item: ClienteFornecedor) => void, currentItem: ClienteFornecedor) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
      } else {
        setItem({
          ...currentItem,
          cep,
          endereco: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        });
        toast({ title: "Endereço preenchido automaticamente" });
      }
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    }
    setCepLoading(false);
  };

  // Logo upload (local preview)
  // Clientes handlers
  const handleNewCliente = () => { setEditCliente(emptyEntity("cliente")); setClienteDialogOpen(true); };
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
  const handleNewFornecedor = () => { setEditFornecedor(emptyEntity("fornecedor")); setFornecedorDialogOpen(true); };
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

  const renderTable = (
    items: ClienteFornecedor[],
    onEdit: (i: ClienteFornecedor) => void,
    setDeleteId: (id: number) => void,
    setDeleteOpen: (v: boolean) => void,
    label: string
  ) => (
    <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Nome</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center hidden md:table-cell">Documento</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center hidden md:table-cell">E-mail</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center hidden lg:table-cell">Telefone</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center hidden lg:table-cell">Cidade/UF</th>
              <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {item.nome.charAt(0).toUpperCase()}
                    </div>
                    {item.nome}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell text-center">{item.documento || "—"}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell text-center">{item.email || "—"}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell text-center">{item.telefone || "—"}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell text-center">
                  {item.cidade && item.estado ? `${item.cidade}/${item.estado}` : "—"}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}><Trash2 size={14} /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        {items.length} {label} encontrados
      </div>
    </div>
  );

  const renderFormDialog = (
    open: boolean,
    setOpen: (v: boolean) => void,
    editItem: ClienteFornecedor | null,
    setEditItem: (i: ClienteFornecedor) => void,
    items: ClienteFornecedor[],
    onSave: () => void,
    tipo: string
  ) => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editItem && items.some(i => i.id === editItem.id) ? "Editar" : "Novo"} {tipo}</DialogTitle></DialogHeader>
        {editItem && (
          <div className="space-y-5 pt-2">
            {/* Dados Pessoais */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Dados Cadastrais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Nome / Razão Social</Label>
                  <Input value={editItem.nome} onChange={e => setEditItem({ ...editItem, nome: e.target.value })} placeholder="Nome completo ou razão social" />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF / CNPJ</Label>
                  <Input value={editItem.documento} onChange={e => setEditItem({ ...editItem, documento: e.target.value })} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={editItem.email} onChange={e => setEditItem({ ...editItem, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={editItem.telefone} onChange={e => setEditItem({ ...editItem, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço com ViaCEP */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin size={13} /> Endereço
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      value={editItem.cep}
                      onChange={e => setEditItem({ ...editItem, cep: e.target.value })}
                      onBlur={() => fetchCep(editItem.cep, setEditItem, editItem)}
                      placeholder="00000-000"
                      className="pr-8"
                    />
                    {cepLoading && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Preenche o endereço automaticamente</p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Logradouro</Label>
                  <Input value={editItem.endereco} onChange={e => setEditItem({ ...editItem, endereco: e.target.value })} placeholder="Rua, Av..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input value={editItem.bairro} onChange={e => setEditItem({ ...editItem, bairro: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={editItem.cidade} onChange={e => setEditItem({ ...editItem, cidade: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Input value={editItem.estado} onChange={e => setEditItem({ ...editItem, estado: e.target.value })} maxLength={2} placeholder="UF" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados Bancários */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 size={13} /> Dados Bancários
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Banco</Label>
                  <Input value={editItem.banco} onChange={e => setEditItem({ ...editItem, banco: e.target.value })} placeholder="Ex: Itaú, Bradesco..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de Conta</Label>
                  <Select value={editItem.tipoConta || undefined} onValueChange={v => setEditItem({ ...editItem, tipoConta: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                      <SelectItem value="pagamento">Conta Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Agência</Label>
                  <Input value={editItem.agencia} onChange={e => setEditItem({ ...editItem, agencia: e.target.value })} placeholder="0000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Conta</Label>
                  <Input value={editItem.conta} onChange={e => setEditItem({ ...editItem, conta: e.target.value })} placeholder="00000-0" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Chave PIX */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Key size={13} /> Chave PIX
              </h3>
              <div className="space-y-1.5">
                <Label>Chave PIX (CPF, CNPJ, E-mail, Telefone ou Aleatória)</Label>
                <Input value={editItem.chavePix} onChange={e => setEditItem({ ...editItem, chavePix: e.target.value })} placeholder="Informe a chave PIX" />
              </div>
            </div>

            {/* Categoria Padrão - only for fornecedores */}
            {editItem.tipo === "fornecedor" && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Tag size={13} /> Categoria Padrão
                  </h3>
                  <div className="space-y-1.5">
                    <Label>Categoria vinculada (auto-preenchimento em lançamentos)</Label>
                    <Select value={editItem.categoriaPadrao || "none"} onValueChange={v => setEditItem({ ...editItem, categoriaPadrao: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {initialCategorias.map(c => (
                          <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Ao criar lançamentos para este fornecedor, a categoria será sugerida automaticamente</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-3">
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
          {renderTable(filteredClientes, handleEditCliente, setClienteDeleteId, setClienteDeleteOpen, "clientes")}
        </TabsContent>

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
          {renderTable(filteredFornecedores, handleEditFornecedor, setFornecedorDeleteId, setFornecedorDeleteOpen, "fornecedores")}
        </TabsContent>
      </Tabs>

      {renderFormDialog(clienteDialogOpen, setClienteDialogOpen, editCliente, (i) => setEditCliente(i), clientes, handleSaveCliente, "Cliente")}
      {renderDeleteDialog(clienteDeleteOpen, setClienteDeleteOpen, confirmDeleteCliente, "Cliente")}

      {renderFormDialog(fornecedorDialogOpen, setFornecedorDialogOpen, editFornecedor, (i) => setEditFornecedor(i), fornecedores, handleSaveFornecedor, "Fornecedor")}
      {renderDeleteDialog(fornecedorDeleteOpen, setFornecedorDeleteOpen, confirmDeleteFornecedor, "Fornecedor")}
    </div>
  );
};

export default ClientesFornecedores;
