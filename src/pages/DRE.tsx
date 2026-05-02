import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const dreData = [
  { grupo: "Receita Bruta", items: [{ label: "Venda de Produtos", valor: 120000 }, { label: "Prestação de Serviços", valor: 45000 }] },
  { grupo: "Deduções", items: [{ label: "Impostos sobre Vendas", valor: -18500 }, { label: "Devoluções", valor: -3200 }] },
  { grupo: "Custos", items: [{ label: "Custo dos Produtos Vendidos", valor: -52000 }, { label: "Custo dos Serviços", valor: -15000 }] },
  { grupo: "Despesas Operacionais", items: [{ label: "Despesas Administrativas", valor: -22000 }, { label: "Despesas Comerciais", valor: -12000 }, { label: "Despesas com Pessoal", valor: -35000 }] },
  { grupo: "Resultado Financeiro", items: [{ label: "Receitas Financeiras", valor: 3500 }, { label: "Despesas Financeiras", valor: -4800 }] },
];

const DRE = () => {
  const [periodo, setPeriodo] = useState("abril-2026");

  const receitaLiquida = dreData.slice(0, 2).flatMap(g => g.items).reduce((s, i) => s + i.valor, 0);
  const lucroBruto = receitaLiquida + dreData[2].items.reduce((s, i) => s + i.valor, 0);
  const resultadoOperacional = lucroBruto + dreData[3].items.reduce((s, i) => s + i.valor, 0);
  const resultadoLiquido = resultadoOperacional + dreData[4].items.reduce((s, i) => s + i.valor, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">DRE - Demonstrativo de Resultado</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-44 h-10">
            <CalendarIcon size={14} className="mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="janeiro-2026">Janeiro 2026</SelectItem>
            <SelectItem value="fevereiro-2026">Fevereiro 2026</SelectItem>
            <SelectItem value="marco-2026">Março 2026</SelectItem>
            <SelectItem value="abril-2026">Abril 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-left">Descrição</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Valor</th>
              </tr>
            </thead>
            <tbody>
              {dreData.map((grupo) => (
                <>
                  <tr key={grupo.grupo} className="bg-muted/10">
                    <td colSpan={2} className="px-5 py-2.5 text-xs font-bold text-foreground uppercase tracking-wider">{grupo.grupo}</td>
                  </tr>
                  {grupo.items.map((item) => (
                    <tr key={item.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 text-sm text-foreground pl-10">{item.label}</td>
                      <td className={`px-5 py-3 text-sm font-mono text-center ${item.valor >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(item.valor)}
                      </td>
                    </tr>
                  ))}
                </>
              ))}

              <tr className="border-t-2 border-border bg-muted/30">
                <td className="px-5 py-3 text-sm font-bold text-foreground">Receita Líquida</td>
                <td className={`px-5 py-3 text-sm font-mono font-bold text-center ${receitaLiquida >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(receitaLiquida)}</td>
              </tr>
              <tr className="bg-muted/20">
                <td className="px-5 py-3 text-sm font-bold text-foreground">Lucro Bruto</td>
                <td className={`px-5 py-3 text-sm font-mono font-bold text-center ${lucroBruto >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(lucroBruto)}</td>
              </tr>
              <tr className="bg-muted/30">
                <td className="px-5 py-3 text-sm font-bold text-foreground">Resultado Operacional</td>
                <td className={`px-5 py-3 text-sm font-mono font-bold text-center ${resultadoOperacional >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(resultadoOperacional)}</td>
              </tr>
              <tr className="border-t-2 border-gold/30 bg-gold/5">
                <td className="px-5 py-4 text-base font-bold text-foreground">Resultado Líquido</td>
                <td className={`px-5 py-4 text-base font-mono font-bold text-center ${resultadoLiquido >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(resultadoLiquido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DRE;
