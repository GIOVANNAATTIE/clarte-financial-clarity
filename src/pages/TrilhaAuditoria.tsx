import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Pencil, Trash2, Eye } from "lucide-react";

type AuditLog = {
  id: number;
  data: string;
  hora: string;
  usuario: string;
  acao: "inclusão" | "edição" | "exclusão" | "visualização";
  modulo: string;
  descricao: string;
};

const mockLogs: AuditLog[] = [
  { id: 1, data: "2026-05-02", hora: "14:32", usuario: "Admin", acao: "edição", modulo: "Movimentação", descricao: "Editou lançamento #1 - Fornecedor ABC" },
  { id: 2, data: "2026-05-02", hora: "14:15", usuario: "Admin", acao: "exclusão", modulo: "Categorias", descricao: "Excluiu categoria 'Marketing'" },
  { id: 3, data: "2026-05-02", hora: "13:50", usuario: "Maria Silva", acao: "inclusão", modulo: "Clientes/Fornecedores", descricao: "Cadastrou novo fornecedor 'Tech Solutions'" },
  { id: 4, data: "2026-05-01", hora: "16:20", usuario: "João Santos", acao: "edição", modulo: "Centros de Custo", descricao: "Editou centro de custo 'Operações'" },
  { id: 5, data: "2026-05-01", hora: "15:00", usuario: "Admin", acao: "inclusão", modulo: "Movimentação", descricao: "Importou extrato OFX - 15 lançamentos" },
  { id: 6, data: "2026-05-01", hora: "10:30", usuario: "Maria Silva", acao: "visualização", modulo: "Relatórios", descricao: "Visualizou relatório mensal Abril/2026" },
  { id: 7, data: "2026-04-30", hora: "17:45", usuario: "João Santos", acao: "exclusão", modulo: "Movimentação", descricao: "Excluiu lançamento #12 - Material de Escritório" },
  { id: 8, data: "2026-04-30", hora: "09:10", usuario: "Admin", acao: "edição", modulo: "Configurações", descricao: "Alterou permissões do usuário Maria Silva" },
];

const acaoIcons: Record<string, React.ReactNode> = {
  "inclusão": <Plus size={14} className="text-success" />,
  "edição": <Pencil size={14} className="text-gold" />,
  "exclusão": <Trash2 size={14} className="text-destructive" />,
  "visualização": <Eye size={14} className="text-muted-foreground" />,
};

const acaoStyles: Record<string, string> = {
  "inclusão": "bg-success/10 text-success",
  "edição": "bg-gold/10 text-gold",
  "exclusão": "bg-destructive/10 text-destructive",
  "visualização": "bg-muted text-muted-foreground",
};

const TrilhaAuditoria = () => {
  const [search, setSearch] = useState("");
  const [acaoFilter, setAcaoFilter] = useState("todas");
  const [moduloFilter, setModuloFilter] = useState("todos");

  const modulos = [...new Set(mockLogs.map(l => l.modulo))];

  const filtered = mockLogs.filter(l => {
    const matchSearch = l.descricao.toLowerCase().includes(search.toLowerCase()) || l.usuario.toLowerCase().includes(search.toLowerCase());
    const matchAcao = acaoFilter === "todas" || l.acao === acaoFilter;
    const matchModulo = moduloFilter === "todos" || l.modulo === moduloFilter;
    return matchSearch && matchAcao && matchModulo;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Trilha de Auditoria</h1>

      <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar por descrição ou usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-background/50" />
          </div>
          <Select value={acaoFilter} onValueChange={setAcaoFilter}>
            <SelectTrigger className="w-full md:w-40 h-10">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Ações</SelectItem>
              <SelectItem value="inclusão">Inclusão</SelectItem>
              <SelectItem value="edição">Edição</SelectItem>
              <SelectItem value="exclusão">Exclusão</SelectItem>
              <SelectItem value="visualização">Visualização</SelectItem>
            </SelectContent>
          </Select>
          <Select value={moduloFilter} onValueChange={setModuloFilter}>
            <SelectTrigger className="w-full md:w-44 h-10">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Módulos</SelectItem>
              {modulos.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Data/Hora</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Usuário</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Ação</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Módulo</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground text-center whitespace-nowrap">
                    {new Date(log.data).toLocaleDateString("pt-BR")} {log.hora}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground text-center">{log.usuario}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${acaoStyles[log.acao]}`}>
                      {acaoIcons[log.acao]} {log.acao}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground text-center">{log.modulo}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{log.descricao}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} registros encontrados
        </div>
      </div>
    </div>
  );
};

export default TrilhaAuditoria;
