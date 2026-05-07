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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { dateFrom, dateTo, companyName, companyId, filterType } = await req.json();

    let query = supabase
      .from("transactions")
      .select("date, description, value, type, status, category_id, cost_center_id, entity_id")
      .eq("user_id", user.id)
      .neq("status", "cancelado")
      .order("date", { ascending: false });

    if (companyId) query = query.eq("company_id", companyId);
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);

    // Filter by type if requested
    if (filterType === "receitas") query = query.gte("value", 0);
    else if (filterType === "despesas") query = query.lt("value", 0);

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

    const enriched = txRes.data.map(t => {
      const cat = t.category_id ? catMap.get(t.category_id) : null;
      const cc = t.cost_center_id ? ccMap.get(t.cost_center_id) : null;
      const ent = t.entity_id ? entMap.get(t.entity_id) : null;
      return {
        data: t.date,
        valor: t.value,
        tipo: t.value >= 0 ? "Receita" : "Despesa",
        status: t.status,
        categoria: cat?.name || "Sem categoria",
        centro_custo: cc?.name || "",
        cliente_fornecedor: ent?.name || t.description || "",
      };
    });

    if (enriched.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum lançamento encontrado para o período selecionado." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalReceitas = enriched.filter(t => t.valor >= 0).reduce((s, t) => s + t.valor, 0);
    const totalDespesas = enriched.filter(t => t.valor < 0).reduce((s, t) => s + Math.abs(t.valor), 0);
    const saldo = totalReceitas - totalDespesas;

    const periodoLabel = dateFrom && dateTo
      ? `de ${dateFrom} a ${dateTo}`
      : dateFrom ? `a partir de ${dateFrom}`
      : dateTo ? `até ${dateTo}`
      : "todos os períodos disponíveis";

    const empresa = companyName || "a empresa";
    const filtroLabel = filterType === "receitas" ? " — Apenas Receitas" : filterType === "despesas" ? " — Apenas Despesas" : "";

    const dataPayload = JSON.stringify(enriched, null, 0);

    const systemPrompt = `Você é um analista financeiro sênior da Clarté Consultoria analisando os dados de ${empresa}.

REGRAS OBRIGATÓRIAS:
- Comece DIRETAMENTE com os dados e análise — ZERO introduções, ZERO apresentações, ZERO frases como "Com base nos dados..." ou "Analisando os lançamentos..."
- Use SOMENTE os dados reais fornecidos — NUNCA invente dados
- Cite nomes reais de clientes/fornecedores e categorias reais de ${empresa}
- Compare meses quando houver dados históricos
- Linguagem direta e profissional — como um CFO falando com o dono do negócio
- Destaque pontos críticos PRIMEIRO
- Quando algo for suspeito ou fora do padrão, indique ação concreta ("verifique", "confirme", "revise")
- Formate em Markdown com seções claras usando ##
- Emojis de severidade: 🔴 Crítico | 🟡 Atenção | 🟢 Positivo | ℹ️ Informativo
- Valores em formato brasileiro: R$ X.XXX,XX
- NUNCA mencione "Clarté Assessoria Contábil" — use apenas "Clarté Consultoria"

ESTRUTURA OBRIGATÓRIA (use EXATAMENTE estes títulos com ##):

## 📊 Resumo Executivo
Totais de receitas, despesas e saldo. Alertas críticos primeiro.

## 📈 Receitas
Principais fontes, concentração, variações, riscos de dependência.

## 📉 Despesas
Categorias mais onerosas, recorrências, variações, parcelas detectadas, oportunidades de redução.

## 🏢 Fornecedores e Clientes
Ranking por volume, frequência de pagamento, padrões detectados (duplicidades, valores fora do padrão).

## 💡 Recomendações
Ações concretas e objetivas. Projeções baseadas no histórico real.

CONTEXTO:
- Empresa: ${empresa}
- Período: ${periodoLabel}${filtroLabel}
- Lançamentos: ${enriched.length}
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
          { role: "user", content: `Dados financeiros reais de ${empresa}:\n\n${dataPayload}` },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao processar análise de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
