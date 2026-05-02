import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const mockData = [
  { mes: "Janeiro", entradas: 45000, saidas: 32000 },
  { mes: "Fevereiro", entradas: 52000, saidas: 38000 },
  { mes: "Março", entradas: 48000, saidas: 41000 },
  { mes: "Abril", entradas: 61000, saidas: 35000 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const FluxoCaixa = () => {
  const [ano, setAno] = useState("2026");

  const totalEntradas = mockData.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = mockData.reduce((s, d) => s + d.saidas, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-32 h-10">
            <CalendarIcon size={14} className="mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10"><TrendingUp size={18} className="text-success" /></div>
            <span className="text-sm text-muted-foreground">Total Entradas</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-destructive/10"><TrendingDown size={18} className="text-destructive" /></div>
            <span className="text-sm text-muted-foreground">Total Saídas</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gold/10"><DollarSign size={18} className="text-gold" /></div>
            <span className="text-sm text-muted-foreground">Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(saldo)}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Mês</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Entradas</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Saídas</th>
                <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 text-center">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((d) => (
                <tr key={d.mes} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-foreground text-center">{d.mes}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-success text-center">{formatCurrency(d.entradas)}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-destructive text-center">{formatCurrency(d.saidas)}</td>
                  <td className={`px-5 py-3.5 text-sm font-mono font-medium text-center ${d.entradas - d.saidas >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(d.entradas - d.saidas)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FluxoCaixa;
