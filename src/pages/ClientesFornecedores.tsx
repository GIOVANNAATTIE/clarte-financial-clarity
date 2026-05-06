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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type Entity = {
  id: string;
  name: string;
  type: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  zip_code: string | null;
  address: string | null;
  bank_info: string | null;
  default_category_id: string | null;
};

type CategoryOption = { id: string; name: string };

// We store bank details as JSON in the bank_info column
type BankDetails = {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: string;
  chavePix?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  contato?: string;
};

const parseBankInfo = (bankInfo: string | null): BankDetails => {
  if (!bankInfo) return {};
  try { return JSON.parse(bankInfo); } catch { return {}; }
};

const ClientesFornecedores = () => {
  const { toast } = useToast();

  const [entities, setEntities] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cepLoading, setCepLoading] = useState(false);

  const [clienteSearch, setClienteSearch] = useState("");
  const [fornecedorSearch, setFornecedorSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"cliente" | "fornecedor">("cliente");
  const [editForm, setEditForm] = useState<{
    id?: string;
    name: string;
    document: string;
    email: string;
    phone: string;
    cep: string;
    endereco: string;
    bairro: string;
    cidade: string;
    estado: string;
    banco: string;
    agencia: string;
    conta: string;
    tipoConta: string;
    chavePix: string;
    contato: string;
    default_category_id: string;
  } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [entRes, catRes] = await Promise.all([
      supabase.from("entities").select("*").eq("user_id", user.id).order("name"),
      supabase.from("categories").select("id, name").eq("user_id", user.id).order("name"),
    ]);
    if (entRes.data) setEntities(entRes.data);
    if (catRes.data) setCategories(catRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const clientes = entities.filter(e => e.type === "cliente");
  const fornecedores = entities.filter(e => e.type === "fornecedor");
  const filteredClientes = clientes.filter(i => i.name.toLowerCase().includes(clienteSearch.toLowerCase()));
  const filteredFornecedores = fornecedores.filter(i => i.name.toLowerCase().includes(fornecedorSearch.toLowerCase()));

  const entityToForm = (e: Entity) => {
    const bank = parseBankInfo(e.bank_info);
    return {
      id: e.id,
      name: e.name,
      document: e.document || "",
      email: e.email || "",
      phone: e.phone || "",
      cep: e.zip_code || "",
      endereco: e.address || "",
      bairro: bank.bairro || "",
      cidade: bank.cidade || "",
      estado: bank.estado || "",
      banco: bank.banco || "",
      agencia: bank.agencia || "",
      conta: bank.conta || "",
      tipoConta: bank.tipoConta || "",
      chavePix: bank.chavePix || "",
      contato: bank.contato || "",
      default_category_id: e.default_category_id || "",
    };
  };

  const emptyForm = (): typeof editForm => ({
    name: "", document: "", email: "", phone: "", cep: "",
    endereco: "", bairro: "", cidade: "", estado: "",
    banco: "", agencia: "", conta: "", tipoConta: "",
    chavePix: "", contato: "", default_category_id: "",
  });

  const handleNew = (tipo: "cliente" | "fornecedor") => {
    setDialogType(tipo);
    setEditForm(emptyForm());
    setDialogOpen(true);
  };

  const handleEdit = (e: Entity) => {
    setDialogType(e.type as "cliente" | "fornecedor");
    setEditForm(entityToForm(e));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editForm || !editForm.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const bankInfo = JSON.stringify({
      banco: editForm.banco, agencia: editForm.agencia, conta: editForm.conta,
      tipoConta: editForm.tipoConta, chavePix: editForm.chavePix,
      bairro: editForm.bairro, cidade: editForm.cidade, estado: editForm.estado,
      contato: editForm.contato,
    });

    const payload = {
      name: editForm.name,
      type: dialogType,
      document: editForm.document || null,
      email: editForm.email || null,
      phone: editForm.phone || null,
      zip_code: editForm.cep || null,
      address: editForm.endereco || null,
      bank_info: bankInfo,
      default_category_id: editForm.default_category_id || null,
    };

    if (editForm.id) {
      const { error } = await supabase.from("entities").update(payload).eq("id", editForm.id);
      if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
      toast({ title: "Registro atualizado" });
    } else {
      const { error } = await supabase.from("entities").insert({ ...payload, user_id: user.id });
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      toast({ title: "Registro criado" });
    }
    setDialogOpen(false);
    setEditForm(null);
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("entities").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Registro excluído" });
    setEntities(prev => prev.filter(i => i.id !== deleteId));
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const fetchCep = async (cep: string) => {
    if (!editForm) return;
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
      } else {
        setEditForm({
          ...editForm,
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

  const renderTable = (
    items: Entity[],
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
            {items.map(item => {
              const bank = parseBankInfo(item.bank_info);
              return (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      {item.name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell text-center">{item.document || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell text-center">{item.email || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell text-center">{item.phone || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell text-center">
                    {bank.cidade && bank.estado ? `${bank.cidade}/${bank.estado}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
            <Button variant="hero" size="lg" className="gap-2" onClick={() => handleNew("cliente")}>
              <Plus size={18} /> Novo Cliente
            </Button>
          </div>
          {renderTable(filteredClientes, "clientes")}
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)] flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input placeholder="Buscar por nome..." value={fornecedorSearch} onChange={e => setFornecedorSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
              </div>
            </div>
            <Button variant="hero" size="lg" className="gap-2" onClick={() => handleNew("fornecedor")}>
              <Plus size={18} /> Novo Fornecedor
            </Button>
          </div>
          {renderTable(filteredFornecedores, "fornecedores")}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editForm?.id ? "Editar" : "Novo"} {dialogType === "cliente" ? "Cliente" : "Fornecedor"}
            </DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-5 pt-2">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Dados Cadastrais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Nome / Razão Social</Label>
                    <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nome completo ou razão social" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CPF / CNPJ</Label>
                    <Input value={editForm.document} onChange={e => setEditForm({ ...editForm, document: e.target.value })} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin size={13} /> Endereço
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>CEP</Label>
                    <div className="relative">
                      <Input
                        value={editForm.cep}
                        onChange={e => setEditForm({ ...editForm, cep: e.target.value })}
                        onBlur={() => fetchCep(editForm.cep)}
                        placeholder="00000-000"
                        className="pr-8"
                      />
                      {cepLoading && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Preenche o endereço automaticamente</p>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Logradouro</Label>
                    <Input value={editForm.endereco} onChange={e => setEditForm({ ...editForm, endereco: e.target.value })} placeholder="Rua, Av..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bairro</Label>
                    <Input value={editForm.bairro} onChange={e => setEditForm({ ...editForm, bairro: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cidade</Label>
                    <Input value={editForm.cidade} onChange={e => setEditForm({ ...editForm, cidade: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estado</Label>
                    <Input value={editForm.estado} onChange={e => setEditForm({ ...editForm, estado: e.target.value })} maxLength={2} placeholder="UF" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 size={13} /> Dados Bancários
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Banco</Label>
                    <Input value={editForm.banco} onChange={e => setEditForm({ ...editForm, banco: e.target.value })} placeholder="Ex: Itaú, Bradesco..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo de Conta</Label>
                    <Select value={editForm.tipoConta || undefined} onValueChange={v => setEditForm({ ...editForm, tipoConta: v })}>
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
                    <Input value={editForm.agencia} onChange={e => setEditForm({ ...editForm, agencia: e.target.value })} placeholder="0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Conta</Label>
                    <Input value={editForm.conta} onChange={e => setEditForm({ ...editForm, conta: e.target.value })} placeholder="00000-0" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Key size={13} /> Chave PIX
                </h3>
                <div className="space-y-1.5">
                  <Label>Chave PIX (CPF, CNPJ, E-mail, Telefone ou Aleatória)</Label>
                  <Input value={editForm.chavePix} onChange={e => setEditForm({ ...editForm, chavePix: e.target.value })} placeholder="Informe a chave PIX" />
                </div>
              </div>

              {dialogType === "fornecedor" && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Tag size={13} /> Categoria Padrão
                    </h3>
                    <div className="space-y-1.5">
                      <Label>Categoria vinculada (auto-preenchimento em lançamentos)</Label>
                      <Select value={editForm.default_category_id || "none"} onValueChange={v => setEditForm({ ...editForm, default_category_id: v === "none" ? "" : v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Ao criar lançamentos para este fornecedor, a categoria será sugerida automaticamente</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3">
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
          <DialogHeader><DialogTitle>Excluir Registro</DialogTitle></DialogHeader>
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

export default ClientesFornecedores;
