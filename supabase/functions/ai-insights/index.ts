import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { dateFrom, dateTo } = await req.json();

    // Fetch all transactions for this user
    let query = supabase
      .from("transactions")
      .select("date, description, value, type, status, category_id, cost_center_id, entity_id")
      .eq("user_id", user.id)
      .neq("status", "cancelado")
      .order("date", { ascending: false });

    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);

    const [txRes, catRes, ccRes, entRes] = await Promise.all([
      query,
      supabase.from("categories").select("id, name, type").eq("user_id", user.id),
      supabase.from("cost_centers").select("id, name").eq("user_id", user.id),
      supabase.from("entities").select("id, name, type").eq("user_id", user.id),
    ]);

    if (txRes.error) throw txRes.error;

    const catMap = new Map(catRes.data?.map(c => [c.id, c]) || []);
    const ccMap = new Map(ccRes.data?.map(c => [c.id, c]) || []);
    const entMap = new Map(entRes.data?.map(e => [e.id, e]) || []);

    // Clean description prefixes
    const prefixes = [
      "PIX ENVIADO PARA ", "PIX RECEBIDO DE ",
      "PAGAMENTO DE BOLETO ", "PAGAMENTO DE CONTA / TRIBUTO ",
      "PAGAMENTO DE CONTA/TRIBUTO ",
      "TRANSFERENCIA ENVIADA PARA ", "TRANSFERENCIA RECEBIDA DE ",
      "TED ENVIADA PARA ", "TED RECEBIDA DE ",
      "DOC ENVIADO PARA ", "DOC RECEBIDO DE ",
    ];

    const cleanDesc = (raw: string | null) => {
      if (!raw) return "";
      let cleaned = raw.replace(/^-+\s*/, "");
      const upper = cleaned.toUpperCase();
      for (const p of prefixes) {
        if (upper.startsWith(p)) return cleaned.slice(p.length).trim();
      }
      return cleaned;
    };

    // Build enriched transaction summaries for AI
    const enriched = txRes.data.map(t => {
      const cat = t.category_id ? catMap.get(t.category_id) : null;
      const cc = t.cost_center_id ? ccMap.get(t.cost_center_id) : null;
      const ent = t.entity_id ? entMap.get(t.entity_id) : null;
      return {
        data: t.date,
        descricao: cleanDesc(t.description),
        valor: t.value,
        tipo: t.type === "entrada" ? "Receita" : "Despesa",
        status: t.status,
        categoria: cat?.name || "Sem categoria",
        centro_custo: cc?.name || "",
        cliente_fornecedor: ent?.name ? cleanDesc(ent.name) : "",
        tipo_entidade: ent?.type || "",
      };
    });

    if (enriched.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum lançamento encontrado para o período selecionado." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build summary stats for context
    const totalReceitas = enriched.filter(t => t.valor >= 0).reduce((s, t) => s + t.valor, 0);
    const totalDespesas = enriched.filter(t => t.valor < 0).reduce((s, t) => s + Math.abs(t.valor), 0);
    const saldo = totalReceitas - totalDespesas;

    const periodoLabel = dateFrom && dateTo
      ? `de ${dateFrom} a ${dateTo}`
      : dateFrom ? `a partir de ${dateFrom}`
      : dateTo ? `até ${dateTo}`
      : "todos os períodos disponíveis";

    const dataPayload = JSON.stringify(enriched, null, 0);

    const systemPrompt = `Você é um analista financeiro sênior (CFO) da empresa Clarté Assessoria Contábil. Analise os lançamentos financeiros REAIS abaixo e gere um relatório completo de inteligência financeira.

REGRAS OBRIGATÓRIAS:
- Use SOMENTE os dados reais fornecidos — NUNCA invente dados
- Cite nomes reais de clientes/fornecedores e categorias reais
- Compare com mês anterior quando possível
- Use linguagem clara, direta e profissional — como um CFO explicando para o dono do negócio
- Destaque os pontos mais críticos primeiro (maior impacto financeiro)
- Quando detectar algo suspeito ou fora do padrão, sugira uma ação ("verifique", "confirme", "considere revisar")
- Formate o relatório em Markdown com seções claras
- Use emojis para indicar severidade: 🔴 Crítico, 🟡 Atenção, 🟢 Positivo, ℹ️ Informativo
- Valores monetários em formato brasileiro (R$ X.XXX,XX)

ESTRUTURA DO RELATÓRIO:
1. **📊 Resumo Executivo** — Visão geral do período com totais de receitas, despesas e saldo
2. **🔴 Alertas Críticos** — Anomalias, duplicidades, valores fora do padrão
3. **🟡 Pontos de Atenção** — Variações significativas, tendências preocupantes
4. **📈 Análise de Receitas** — Principais fontes, concentração, variações
5. **📉 Análise de Despesas** — Maiores fornecedores, categorias mais onerosas, despesas recorrentes
6. **🔄 Padrões Detectados** — Pagamentos recorrentes, parcelas, mensalidades
7. **💡 Recomendações Estratégicas** — Ações concretas para otimizar o financeiro
8. **📅 Projeções** — Estimativas baseadas no histórico real

CONTEXTO:
- Período analisado: ${periodoLabel}
- Total de lançamentos: ${enriched.length}
- Total Receitas: R$ ${totalReceitas.toFixed(2)}
- Total Despesas: R$ ${totalDespesas.toFixed(2)}
- Saldo: R$ ${saldo.toFixed(2)}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Chave de IA não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Aqui estão os lançamentos financeiros reais para análise:\n\n${dataPayload}` },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações > Workspace > Uso." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao processar análise de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
