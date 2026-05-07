import { useState, useMemo } from "react";
import {
  Brain, RefreshCw, CalendarDays, Loader2,
  TrendingUp, TrendingDown, Building2, Lightbulb, BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";
import ReactMarkdown from "react-markdown";

const monthOptions = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const years = ["2024", "2025", "2026"];

const currentDate = new Date();
const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

const Insights = () => {
  const { selectedClient } = useClient();
  const companyName = selectedClient?.name || "sua empresa";
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [analysisContent, setAnalysisContent] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "receitas" | "despesas">("todos");
  const { toast } = useToast();

  // Date filters
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"months" | "custom">("months");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  const toggleMonth = (value: string) => {
    setSelectedMonths((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  };

  const selectAllMonths = () => {
    if (selectedMonths.length === 12) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(monthOptions.map((m) => m.value));
    }
  };

  const getMonthsLabel = () => {
    if (selectedMonths.length === 0) return "Todos os meses";
    if (selectedMonths.length === 12) return "Todos os meses";
    if (selectedMonths.length <= 2) {
      return selectedMonths
        .map((v) => monthOptions.find((m) => m.value === v)?.label)
        .join(", ");
    }
    return `${selectedMonths.length} meses`;
  };

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Build date range from filters
  const getDateRange = () => {
    if (filterMode === "custom" && customDateFrom && customDateTo) {
      return {
        dateFrom: format(customDateFrom, "yyyy-MM-dd"),
        dateTo: format(customDateTo, "yyyy-MM-dd"),
      };
    }
    if (filterMode === "months") {
      if (selectedMonths.length === 0 || selectedMonths.length === 12) {
        return { dateFrom: `${selectedYear}-01-01`, dateTo: `${selectedYear}-12-31` };
      }
      const sorted = [...selectedMonths].sort();
      const firstMonth = sorted[0];
      const lastMonth = sorted[sorted.length - 1];
      const lastDay = new Date(parseInt(selectedYear), parseInt(lastMonth), 0).getDate();
      return {
        dateFrom: `${selectedYear}-${firstMonth}-01`,
        dateTo: `${selectedYear}-${lastMonth}-${lastDay}`,
      };
    }
    return { dateFrom: undefined, dateTo: undefined };
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setAnalysisContent("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login para usar a análise de IA", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { dateFrom, dateTo } = getDateRange();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          dateFrom,
          dateTo,
          companyName,
          companyId: selectedClient?.id,
          filterType: filterType === "todos" ? undefined : filterType,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast({ title: errData.error || "Erro na análise", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const contentType = resp.headers.get("content-type") || "";

      // Check if it's a JSON error response
      if (contentType.includes("application/json")) {
        const data = await resp.json();
        if (data.error) {
          setAnalysisContent(`⚠️ ${data.error}`);
        }
        setIsLoading(false);
        setLastUpdated(new Date());
        return;
      }

      // Stream SSE response
      const reader = resp.body?.getReader();
      if (!reader) {
        toast({ title: "Erro ao iniciar stream", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setAnalysisContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setAnalysisContent(fullContent);
            }
          } catch { /* ignore */ }
        }
      }

      setLastUpdated(new Date());
    } catch (e) {
      console.error("AI analysis error:", e);
      toast({ title: "Erro ao conectar com a IA", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Date Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="text-gold" size={24} />
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Inteligência Financeira</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-gold/15 text-gold px-2 py-0.5 rounded-full">
              IA
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter type buttons */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(["todos", "receitas", "despesas"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors capitalize ${
                    filterType === f
                      ? f === "receitas" ? "bg-success text-white" : f === "despesas" ? "bg-destructive text-white" : "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "todos" ? "Todos" : f === "receitas" ? "Receitas" : "Despesas"}
                </button>
              ))}
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-9 gap-2 bg-gold hover:bg-gold/90 text-foreground font-semibold"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {isLoading ? "Analisando..." : "Atualizar Análise"}
            </Button>
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <CalendarDays size={14} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setFilterMode("months")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterMode === "months" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Meses
            </button>
            <button
              onClick={() => setFilterMode("custom")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterMode === "custom" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Personalizado
            </button>
          </div>

          {filterMode === "months" ? (
            <>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm min-w-[140px] justify-start font-normal">
                    <CalendarDays size={14} className="mr-2 shrink-0" />
                    {getMonthsLabel()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedMonths.length === 12}
                        onCheckedChange={selectAllMonths}
                      />
                      <span className="text-sm font-medium">Todos os meses</span>
                    </label>
                    <div className="border-t border-border my-1.5" />
                    {monthOptions.map((m) => (
                      <label key={m.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={selectedMonths.includes(m.value)}
                          onCheckedChange={() => toggleMonth(m.value)}
                        />
                        <span className="text-sm">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm min-w-[130px] justify-start font-normal">
                    <CalendarDays size={14} className="mr-2" />
                    {customDateFrom ? formatShortDate(customDateFrom) : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateFrom}
                    onSelect={setCustomDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm min-w-[130px] justify-start font-normal">
                    <CalendarDays size={14} className="mr-2" />
                    {customDateTo ? formatShortDate(customDateTo) : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateTo}
                    onSelect={setCustomDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Content - Split into cards */}
      {!analysisContent && !isLoading && (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
          <div className="text-center py-16">
            <Brain className="mx-auto text-muted-foreground/30 mb-4" size={48} />
            <p className="text-muted-foreground font-medium">Clique em "Atualizar Análise" para gerar os insights</p>
            <p className="text-xs text-muted-foreground/70 mt-1">A IA analisará seus lançamentos reais e gerará um relatório completo</p>
          </div>
        </div>
      )}
      {isLoading && !analysisContent && (
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
          <div className="text-center py-16">
            <Loader2 className="mx-auto text-gold animate-spin mb-4" size={48} />
            <p className="text-muted-foreground font-medium">Analisando dados financeiros reais...</p>
            <p className="text-xs text-muted-foreground/70 mt-1">A IA está processando seus lançamentos</p>
          </div>
        </div>
      )}
      {analysisContent && (
        <SectionCards content={analysisContent} isLoading={isLoading} />
      )}
    </div>
  );
};

/* ---- Helper: split markdown by ## headings into visual cards ---- */

const sectionMeta: Record<string, { icon: React.ReactNode; colorClass: string }> = {
  "resumo": { icon: <BarChart3 size={20} />, colorClass: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  "receita": { icon: <TrendingUp size={20} />, colorClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  "despesa": { icon: <TrendingDown size={20} />, colorClass: "text-red-400 bg-red-400/10 border-red-400/20" },
  "fornecedor": { icon: <Building2 size={20} />, colorClass: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  "recomenda": { icon: <Lightbulb size={20} />, colorClass: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
};

function matchSectionKey(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("resumo") || lower.includes("executivo")) return "resumo";
  if (lower.includes("receita")) return "receita";
  if (lower.includes("despesa")) return "despesa";
  if (lower.includes("fornecedor")) return "fornecedor";
  if (lower.includes("recomenda") || lower.includes("projeç")) return "recomenda";
  return "resumo";
}

function SectionCards({ content, isLoading }: { content: string; isLoading: boolean }) {
  const sections = useMemo(() => {
    const parts: { title: string; body: string }[] = [];
    const lines = content.split("\n");
    let currentTitle = "";
    let currentBody: string[] = [];

    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)/);
      if (h2Match) {
        if (currentTitle || currentBody.length > 0) {
          parts.push({ title: currentTitle, body: currentBody.join("\n").trim() });
        }
        currentTitle = h2Match[1].trim();
        currentBody = [];
      } else {
        currentBody.push(line);
      }
    }
    if (currentTitle || currentBody.length > 0) {
      parts.push({ title: currentTitle, body: currentBody.join("\n").trim() });
    }

    return parts.filter(p => p.title || p.body);
  }, [content]);

  // If no sections detected yet (still streaming initial text), show single card
  if (sections.length <= 1 && !sections[0]?.title) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6 md:p-8">
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 mt-4 text-gold">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Gerando análise...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {sections.map((section, i) => {
        const key = matchSectionKey(section.title);
        const meta = sectionMeta[key] || sectionMeta["resumo"];
        const [colorIcon, colorBg, colorBorder] = meta.colorClass.split(" ");

        return (
          <div
            key={i}
            className={`bg-card rounded-xl border shadow-[var(--shadow-card)] overflow-hidden ${colorBorder || "border-border"}`}
          >
            {section.title && (
              <div className={`flex items-center gap-3 px-6 py-4 border-b ${colorBorder || "border-border"} ${colorBg || ""}`}>
                <span className={colorIcon}>{meta.icon}</span>
                <h2 className="font-heading font-bold text-foreground text-lg">{section.title}</h2>
              </div>
            )}
            {section.body && (
              <div className="p-6">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                  <ReactMarkdown>{section.body}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {isLoading && (
        <div className="flex items-center gap-2 text-gold px-2">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs">Gerando análise...</span>
        </div>
      )}
    </div>
  );
}

export default Insights;
