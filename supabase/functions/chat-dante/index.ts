import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODEL = "gemini-3.1-flash-lite";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_TIMEOUT_MS = 25_000;

interface KnowledgeRow {
  title: string;
  instruction: string;
}

interface ChatRow {
  role: "user" | "assistant";
  content: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("[chat-dante] GEMINI_API_KEY secret is not set");
      return json({ error: "Servidor não configurado (GEMINI_API_KEY)." }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Não autenticado." }, 401);
    }
    const accessToken = authHeader.slice(7);

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ??
      "";

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } =
      await userClient.auth.getUser(accessToken);
    if (userErr || !userData.user) {
      return json({ error: "Sessão inválida. Faça login novamente." }, 401);
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await admin
      .from("profiles")
      .select(
        "id, role, plan, plan_expires_at, credits, messages_today, last_message_date",
      )
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return json({ error: "Perfil não encontrado." }, 404);
    }

    const isAdmin = profile.role === "admin";

    if (!isAdmin) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (profile.last_message_date !== todayStr) {
        await admin
          .from("profiles")
          .update({ messages_today: 0, last_message_date: todayStr })
          .eq("id", userId);
        profile.messages_today = 0;
      }

      if ((profile.credits ?? 0) <= 0) {
        return json({ error: "no_credits" }, 200);
      }
    }

    const body = (await req.json().catch(() => ({}))) as {
      message?: string;
      client_datetime?: { context?: string };
    };
    const userMessage = (body.message ?? "").trim();
    if (!userMessage) {
      return json({ error: "Mensagem vazia." }, 400);
    }

    const { data: knowledgeRows } = await admin
      .from("dante_knowledge")
      .select("title, instruction")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    const knowledge = (knowledgeRows ?? []) as KnowledgeRow[];

    const knowledgeBlock = knowledge.length
      ? knowledge.map((k) => `## ${k.title}\n${k.instruction}`).join("\n\n")
      : "";

    const timeContext = body.client_datetime?.context ?? "";

    const systemPrompt = `Você é o Dante, um personagem do universo "Querido Dante". Responda sempre em português brasileiro, de forma irônica, levemente debochada, inteligente e bem-humorada, como o personagem faria.\n\nESTILO DE RESPOSTA: Seja curto, direto e natural. Evite respostas excessivamente longas ou explicações desnecessárias. A concisão NÃO deve eliminar o sarcasmo, humor, personalidade ou emoção da conversa — mantenha sempre o seu jeito de ser. Responda de forma mais extensa somente quando o assunto realmente exigir.${timeContext ? `\n\n${timeContext}` : ""}${knowledgeBlock ? `\n\n--- Conhecimento do Dante ---\n${knowledgeBlock}` : ""}`;

    const { data: historyRows } = await admin
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const history = ((historyRows ?? []) as ChatRow[]).reverse();

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> =
      [];
    for (const msg of history) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    const geminiUrl = `${GEMINI_BASE}/${MODEL}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let geminiRes: Response;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        console.error(
          "[chat-dante] Gemini API timed out after",
          GEMINI_TIMEOUT_MS,
          "ms",
        );
        return json(
          { error: "O Dante demorou demais para responder. Tente novamente." },
          504,
        );
      }
      console.error("[chat-dante] Gemini fetch failed:", err);
      return json({ error: "Falha ao conectar com o modelo de IA." }, 502);
    }
    clearTimeout(timeoutId);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error(
        "[chat-dante] Gemini API error",
        geminiRes.status,
        errText,
      );
      let msg = `Erro ao conectar com o modelo (${geminiRes.status}).`;
      try {
        const e = JSON.parse(errText) as {
          error?: { message?: string; status?: string };
        };
        if (e.error?.message) msg = e.error.message;
      } catch {
        /* keep default */
      }
      return json({ error: msg }, 502);
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      geminiData?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text)
        .join("") ??
      "";

    if (!reply) {
      console.error(
        "[chat-dante] Empty reply from Gemini",
        JSON.stringify(geminiData),
      );
      return json({ error: "Resposta vazia do modelo." }, 502);
    }

    const now = new Date().toISOString();
    await admin.from("chat_messages").insert([
      { user_id: userId, role: "user", content: userMessage, created_at: now },
      {
        user_id: userId,
        role: "assistant",
        content: reply,
        created_at: now,
      },
    ]);

    let updatedCredits = profile.credits ?? 0;
    if (!isAdmin) {
      updatedCredits = Math.max(0, updatedCredits - 1);
      await admin
        .from("profiles")
        .update({
          credits: updatedCredits,
          messages_today: (profile.messages_today ?? 0) + 1,
        })
        .eq("id", userId);
    }

    return json({ reply, credits: updatedCredits });
  } catch (err) {
    console.error("[chat-dante] Unhandled error:", err);
    return json(
      { error: "Erro interno do servidor. Tente novamente." },
      500,
    );
  }
});
